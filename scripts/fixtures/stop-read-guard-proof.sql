-- Mechanism proof only. NOT a migration or production limiter.
-- Installed/removed by rehearse-stop-read-guard.mjs against local Docker only.
-- Tiny test budgets intentionally have no relationship to production policy.
begin;
create schema freightiq_guard_proof;
revoke all on schema freightiq_guard_proof from public, anon, authenticated;
create table freightiq_guard_proof.actors (id uuid primary key);
create table freightiq_guard_proof.targets (id text primary key);
create table freightiq_guard_proof.policy (
  singleton boolean primary key default true check(singleton),
  request_capacity numeric not null default 8,
  disclosure_capacity numeric not null default 5,
  request_refill numeric not null default 0,
  disclosure_refill numeric not null default 0
);
insert into freightiq_guard_proof.policy default values;
create table freightiq_guard_proof.buckets (
  actor uuid primary key,
  requests numeric not null,
  metadata numeric not null,
  detail numeric not null,
  updated_at timestamptz not null,
  admitted integer not null default 0,
  denied integer not null default 0,
  paused_until timestamptz
);
create table freightiq_guard_proof.seen (
  actor uuid not null,
  class text not null,
  target text not null,
  expires_at timestamptz not null,
  primary key(actor,class,target)
);
create table freightiq_guard_proof.cases (
  actor uuid primary key,
  denials integer not null default 1
);
alter table freightiq_guard_proof.actors enable row level security;
alter table freightiq_guard_proof.targets enable row level security;
alter table freightiq_guard_proof.policy enable row level security;
alter table freightiq_guard_proof.buckets enable row level security;
alter table freightiq_guard_proof.seen enable row level security;
alter table freightiq_guard_proof.cases enable row level security;
revoke all on all tables in schema freightiq_guard_proof from public, anon, authenticated;

create function freightiq_guard_proof.read(p_class text, p_ids text[])
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  policy freightiq_guard_proof.policy%rowtype;
  bucket freightiq_guard_proof.buckets%rowtype;
  observed timestamptz;
  elapsed numeric;
  cost integer;
  remaining numeric;
  rows jsonb;
  why text;
  retry_seconds integer := 60;
begin
  if v_actor is null or not exists(select 1 from freightiq_guard_proof.actors a where a.id=v_actor) then
    raise insufficient_privilege using message='Proof account required';
  end if;
  if current_setting('request.method',true) is distinct from 'POST' then
    raise sqlstate 'PT405' using message='POST required';
  end if;
  -- Reject all transaction preferences instead of assuming gateway defaults.
  if lower(coalesce(current_setting('request.headers',true)::jsonb->>'prefer',''))
       ~ '(^|,)\s*tx\s*=' then
    raise sqlstate 'PT400' using message='Transaction preferences not supported';
  end if;
  if p_class not in ('metadata','detail') or p_class is null
     or p_ids is null or cardinality(p_ids)<1 or cardinality(p_ids)>5
     or (p_class='detail' and cardinality(p_ids)<>1)
     or exists(select 1 from unnest(p_ids) t(id)
       where not exists(select 1 from freightiq_guard_proof.targets s where s.id=t.id)) then
    raise sqlstate 'PT400' using message='Invalid proof request';
  end if;
  select * into strict policy from freightiq_guard_proof.policy;
  insert into freightiq_guard_proof.buckets(actor,requests,metadata,detail,updated_at)
    values(v_actor,policy.request_capacity,policy.disclosure_capacity,policy.disclosure_capacity,clock_timestamp())
    on conflict do nothing;
  -- One account row serializes spending across both entry points and sessions.
  select b.* into strict bucket from freightiq_guard_proof.buckets b where b.actor=v_actor for update;
  observed := clock_timestamp(); -- Capture AFTER waiting, not at transaction start.
  elapsed := greatest(extract(epoch from observed-bucket.updated_at),0);
  bucket.requests := least(policy.request_capacity,bucket.requests+elapsed*policy.request_refill);
  bucket.metadata := least(policy.disclosure_capacity,bucket.metadata+elapsed*policy.disclosure_refill);
  bucket.detail := least(policy.disclosure_capacity,bucket.detail+elapsed*policy.disclosure_refill);
  if bucket.paused_until>observed then
    why := 'read_paused';
    retry_seconds := greatest(1,ceil(extract(epoch from bucket.paused_until-observed))::integer);
  elsif bucket.requests<1 then
    why := 'request_budget';
    if policy.request_refill>0 then
      retry_seconds := greatest(1,ceil((1-bucket.requests)/policy.request_refill)::integer);
    end if;
  else
    bucket.requests := bucket.requests-1;
    -- Actual existing bounded operations, but only fictional fixture targets.
    if p_class='metadata' then
      select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into rows
        from public.get_freightiq_stop_summaries_v1(p_ids) s;
    else
      select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into rows
        from public.get_freightiq_stop_v1(p_ids[1]) s;
    end if;
    select count(*) into cost from (
      select distinct t->>'id' id from jsonb_array_elements(rows) t
    ) ids where not exists(select 1 from freightiq_guard_proof.seen s
      where s.actor=v_actor and s.class=p_class and s.target=ids.id and s.expires_at>observed);
    remaining := case when p_class='metadata' then bucket.metadata else bucket.detail end;
    if cost>remaining then
      why := 'disclosure_budget';
      if policy.disclosure_refill>0 then
        retry_seconds := greatest(1,ceil((cost-remaining)/policy.disclosure_refill)::integer);
      end if;
    else
      if p_class='metadata' then bucket.metadata:=bucket.metadata-cost;
      else bucket.detail:=bucket.detail-cost; end if;
      insert into freightiq_guard_proof.seen(actor,class,target,expires_at)
        select distinct v_actor,p_class,t->>'id',observed+interval '2 minutes'
        from jsonb_array_elements(rows) t
        on conflict(actor,class,target) do update set expires_at=excluded.expires_at;
    end if;
  end if;
  update freightiq_guard_proof.buckets b set requests=bucket.requests,
    metadata=bucket.metadata,detail=bucket.detail,updated_at=observed,
    admitted=b.admitted+case when why is null then 1 else 0 end,
    denied=b.denied+case when why is null then 0 else 1 end where b.actor=v_actor;
  if why is not null then
    insert into freightiq_guard_proof.cases(actor) values(v_actor)
      on conflict(actor) do update set denials=freightiq_guard_proof.cases.denials+1;
    perform set_config('response.status','429',true);
    perform set_config('response.headers',jsonb_build_array(
      jsonb_build_object('Retry-After',retry_seconds::text),
      jsonb_build_object('Cache-Control','no-store'))::text,true);
    -- Normal return commits counters/case; RAISE here would undo them.
    return jsonb_build_object('code',why,'retry_after_seconds',retry_seconds,'data',null);
  end if;
  perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
  return jsonb_build_object('data',rows,'code',null);
exception
  when insufficient_privilege or sqlstate 'PT400' or sqlstate 'PT405' then raise;
  when others then
    -- Internal errors must not disclose row values in Postgres error details.
    -- This rolls back spending, but also discards every queried stop row.
    perform set_config('response.status','503',true);
    perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
    return jsonb_build_object('code','read_unavailable','data',null);
end;
$$;
revoke all on function freightiq_guard_proof.read(text,text[]) from public,anon,authenticated;
create function public.freightiq_guard_proof_detail(p_id text)
returns jsonb language sql volatile security definer set search_path = '' as $$
  select freightiq_guard_proof.read('detail',array[p_id]);
$$;
create function public.freightiq_guard_proof_batch(p_ids text[])
returns jsonb language sql volatile security definer set search_path = '' as $$
  select freightiq_guard_proof.read('metadata',p_ids);
$$;
revoke all on function public.freightiq_guard_proof_detail(text) from public,anon;
revoke all on function public.freightiq_guard_proof_batch(text[]) from public,anon;
grant execute on function public.freightiq_guard_proof_detail(text) to authenticated;
grant execute on function public.freightiq_guard_proof_batch(text[]) to authenticated;
notify pgrst,'reload schema';
commit;
