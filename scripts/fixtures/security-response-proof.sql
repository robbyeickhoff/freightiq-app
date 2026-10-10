-- Rollback-only operator mechanism proof. No migration, public RPC or scheduler.
-- Caller must BEGIN before loading and ROLLBACK afterward.
create schema freightiq_response_proof;
revoke all on schema freightiq_response_proof from public,anon,authenticated,service_role;
grant usage on schema freightiq_response_proof to authenticated;
create table freightiq_response_proof.cases (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check(surface in ('library','operations')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '30 days',
  paused_until timestamptz,
  version integer not null default 0,
  unique(subject_id,surface),
  check(expires_at>created_at and expires_at<=created_at+interval '30 days')
);
create table freightiq_response_proof.audit (
  id bigint generated always as identity primary key,
  case_id uuid not null references freightiq_response_proof.cases(id) on delete cascade,
  moderator_id uuid references auth.users(id) on delete set null,
  action text not null check(action in ('pause','restore')),
  reason text not null check(reason in ('suspicious_collection','review_complete','mistake')),
  happened_at timestamptz not null default clock_timestamp(),
  paused_until timestamptz,
  version integer not null
);
alter table freightiq_response_proof.cases enable row level security;
alter table freightiq_response_proof.audit enable row level security;
revoke all on all tables in schema freightiq_response_proof from public,anon,authenticated,service_role;
revoke all on all sequences in schema freightiq_response_proof from public,anon,authenticated,service_role;

create function freightiq_response_proof.require_moderator() returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or not private.is_moderation_admin()
    or not exists(select 1 from auth.users where id=auth.uid()) then
    raise insufficient_privilege using message='Moderator access required.';
  end if;
end;
$$;

create function freightiq_response_proof.get_case(p_case uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_case freightiq_response_proof.cases%rowtype;
begin
  perform freightiq_response_proof.require_moderator();
  select * into v_case from freightiq_response_proof.cases
    where id=p_case and expires_at>clock_timestamp();
  if not found then return null; end if;
  -- No account identity or raw activity details in the review response.
  return jsonb_build_object('id',v_case.id,'surface',v_case.surface,
    'created_at',v_case.created_at,'expires_at',v_case.expires_at,
    'paused_until',v_case.paused_until,'version',v_case.version);
end;
$$;

create function freightiq_response_proof.act(p_case uuid,p_version integer,p_seconds integer,p_reason text)
returns jsonb language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare v_case freightiq_response_proof.cases%rowtype; v_until timestamptz;
begin
  perform freightiq_response_proof.require_moderator();
  if current_setting('request.method',true) is distinct from 'POST' then
    raise sqlstate 'PT405' using message='POST required.';
  end if;
  if lower(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'prefer','')) ~ '(^|,)\s*tx\s*=' then
    raise invalid_parameter_value using message='Invalid action.';
  end if;
  if p_version is null or p_version<0 or p_seconds is null or p_seconds not in (0,900,3600,86400)
    or p_reason is null or p_reason not in ('suspicious_collection','review_complete','mistake')
    or (p_seconds>0 and p_reason<>'suspicious_collection')
    or (p_seconds=0 and p_reason='suspicious_collection') then
    raise invalid_parameter_value using message='Invalid action.';
  end if;
  select * into v_case from freightiq_response_proof.cases where id=p_case for update;
  if not found or v_case.expires_at<=clock_timestamp() then
    raise sqlstate 'PT404' using message='Case unavailable.';
  end if;
  if v_case.version<>p_version then
    raise sqlstate 'PT409' using message='Case changed. Reload before acting.';
  end if;
  v_until:=case when p_seconds=0 then null
    else least(clock_timestamp()+make_interval(secs=>p_seconds),v_case.expires_at) end;
  update freightiq_response_proof.cases set paused_until=v_until,version=version+1 where id=p_case;
  insert into freightiq_response_proof.audit(case_id,moderator_id,action,reason,paused_until,version)
    values(p_case,auth.uid(),case when p_seconds=0 then 'restore' else 'pause' end,
      p_reason,v_until,p_version+1);
  return freightiq_response_proof.get_case(p_case);
end;
$$;

create function freightiq_response_proof.remaining_pause(p_surface text) returns integer
language plpgsql security definer set search_path='' as $$
declare v_until timestamptz;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then
    raise insufficient_privilege using message='Authentication required.';
  end if;
  select paused_until into v_until from freightiq_response_proof.cases
    where subject_id=auth.uid() and surface=p_surface and expires_at>clock_timestamp();
  return greatest(0,ceil(extract(epoch from v_until-clock_timestamp()))::integer);
end;
$$;

create function freightiq_response_proof.purge_expired() returns void
language sql security definer set search_path='' as $$
  delete from freightiq_response_proof.cases where expires_at<=clock_timestamp();
$$;

-- Only these proof wrappers consult the pause. Existing app APIs stay untouched.
create function freightiq_response_proof.read_library(p_operation text,p_args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_wait integer:=freightiq_response_proof.remaining_pause('library');
begin
  if v_wait>0 then
    perform set_config('response.status','429',true);
    perform set_config('response.headers',jsonb_build_array(jsonb_build_object('Cache-Control','no-store'),
      jsonb_build_object('Retry-After',v_wait::text))::text,true);
    return jsonb_build_object('code','FREIGHTIQ_READ_THROTTLED','data',null,
      'retry_after_seconds',v_wait,'details',jsonb_build_object('retry_after_seconds',v_wait)::text);
  end if;
  return public.read_freightiq_guarded_v1(p_operation,p_args);
end;
$$;
create function freightiq_response_proof.read_operations() returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_wait integer:=freightiq_response_proof.remaining_pause('operations');
begin
  if v_wait>0 then
    perform set_config('response.status','429',true);
    perform set_config('response.headers',jsonb_build_array(jsonb_build_object('Cache-Control','no-store'),
      jsonb_build_object('Retry-After',v_wait::text))::text,true);
    return jsonb_build_object('code','OPERATIONS_READ_THROTTLED','data',null,
      'retry_after_seconds',v_wait,'details',jsonb_build_object('retry_after_seconds',v_wait)::text);
  end if;
  return public.read_operations_guarded_v1(null,100,null);
end;
$$;
revoke all on all functions in schema freightiq_response_proof from public,anon,authenticated,service_role;
grant execute on function freightiq_response_proof.get_case(uuid),
  freightiq_response_proof.act(uuid,integer,integer,text),
  freightiq_response_proof.read_library(text,jsonb),freightiq_response_proof.read_operations() to authenticated;
