-- Additive, disabled by default. Does not close the legacy feed or change any client.
create table private.operations_read_guard_config (
  singleton boolean primary key default true check(singleton),
  enabled boolean not null default false,
  salt bytea not null default extensions.gen_random_bytes(32) check(octet_length(salt)=32),
  request_capacity integer check(request_capacity between 1 and 100000),
  row_capacity integer check(row_capacity between 100 and 100000),
  request_refill numeric check(request_refill>0 and request_refill<=100000),
  row_refill numeric check(row_refill>0 and row_refill<=100000),
  check(not enabled or (request_capacity is not null and row_capacity is not null
    and request_refill is not null and row_refill is not null
    and request_capacity/request_refill<=3600 and row_capacity/row_refill<=3600))
);
insert into private.operations_read_guard_config default values;
create table private.operations_read_guard_buckets (
  actor_key bytea primary key check(octet_length(actor_key)=32),
  requests numeric not null check(requests>=0),
  remaining_rows numeric not null check(remaining_rows>=0),
  updated_at timestamptz not null,
  admitted bigint not null default 0,
  denied bigint not null default 0,
  failed bigint not null default 0,
  delivered_rows bigint not null default 0
);
create index operations_read_guard_buckets_age on private.operations_read_guard_buckets(updated_at);
alter table private.operations_read_guard_config enable row level security;
alter table private.operations_read_guard_buckets enable row level security;
revoke all on private.operations_read_guard_config,private.operations_read_guard_buckets
  from public,anon,authenticated,service_role;

create function private.read_operations_guarded(p_area_slug text,p_limit integer,p_cursor jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare
  v_user uuid:=auth.uid();
  v_config private.operations_read_guard_config%rowtype;
  v_bucket private.operations_read_guard_buckets%rowtype;
  v_actor bytea;
  v_now timestamptz;
  v_elapsed numeric;
  v_page jsonb;
  v_rows integer:=0;
  v_retry integer:=0;
  v_status integer:=200;
  v_code text;
  v_message text;
begin
  if v_user is null or not exists(select 1 from auth.users where id=v_user) then
    raise insufficient_privilege using message='Authentication required.';
  end if;
  if current_setting('request.method',true) is distinct from 'POST' then
    raise sqlstate 'PT405' using message='POST required.';
  end if;
  if lower(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'prefer','')) ~ '(^|,)\s*tx\s*=' then
    raise invalid_parameter_value;
  end if;
  if p_limit is null or p_limit<1 or p_limit>100 or length(p_area_slug)>100
    or octet_length(p_cursor::text)>512 then raise invalid_parameter_value; end if;
  select * into strict v_config from private.operations_read_guard_config;
  if not v_config.enabled then
    perform set_config('response.status','503',true);
    perform set_config('response.headers','[{"Cache-Control":"no-store"}]',true);
    return jsonb_build_object('code','OPERATIONS_READ_NOT_CONFIGURED','data',null);
  end if;
  v_actor:=extensions.hmac(convert_to(v_user::text,'UTF8'),v_config.salt,'sha256');
  insert into private.operations_read_guard_buckets(actor_key,requests,remaining_rows,updated_at)
    values(v_actor,v_config.request_capacity,v_config.row_capacity,clock_timestamp()) on conflict do nothing;
  select * into strict v_bucket from private.operations_read_guard_buckets where actor_key=v_actor for update;
  v_now:=clock_timestamp();
  v_elapsed:=greatest(extract(epoch from v_now-v_bucket.updated_at),0);
  v_bucket.requests:=least(v_config.request_capacity,v_bucket.requests+v_elapsed*v_config.request_refill);
  v_bucket.remaining_rows:=least(v_config.row_capacity,v_bucket.remaining_rows+v_elapsed*v_config.row_refill);
  if v_bucket.requests<1 then
    v_retry:=greatest(1,ceil((1-v_bucket.requests)/v_config.request_refill)::integer);
  else
    v_bucket.requests:=v_bucket.requests-1;
    -- Refuse before scanning if no condition allowance remains. Empty feeds also wait in this case.
    if v_bucket.remaining_rows<1 then
      v_retry:=greatest(1,ceil((1-v_bucket.remaining_rows)/v_config.row_refill)::integer);
    else
      begin
        v_page:=private.read_operations_active_page(p_area_slug,p_limit,p_cursor);
        v_rows:=jsonb_array_length(v_page->'updates');
        if v_rows>v_bucket.remaining_rows then
          v_retry:=greatest(1,ceil((v_rows-v_bucket.remaining_rows)/v_config.row_refill)::integer);
          v_page:=null;
          v_rows:=0;
        else
          v_bucket.remaining_rows:=v_bucket.remaining_rows-v_rows;
        end if;
      exception
        when sqlstate 'PT409' then
          v_status:=409;v_code:='OPERATIONS_READ_CHANGED';v_message:='Conditions changed. Try refreshing again.';
        when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then
          v_status:=400;v_code:='OPERATIONS_READ_INVALID';v_message:='Invalid Operations request.';
        when others then
          v_status:=503;v_code:='OPERATIONS_READ_UNAVAILABLE';v_message:='Operations is temporarily unavailable.';
      end;
    end if;
  end if;
  if v_retry>0 then
    v_status:=429;v_code:='OPERATIONS_READ_THROTTLED';v_message:='Please wait before refreshing Operations.';
  end if;
  if v_status<>200 then v_page:=null;v_rows:=0;end if;
  update private.operations_read_guard_buckets b set requests=v_bucket.requests,
    remaining_rows=v_bucket.remaining_rows,updated_at=v_now,
    admitted=b.admitted+case when v_status=200 then 1 else 0 end,
    denied=b.denied+case when v_status=429 then 1 else 0 end,
    failed=b.failed+case when v_status in (400,409,503) then 1 else 0 end,
    delivered_rows=b.delivered_rows+v_rows where b.actor_key=v_actor;
  perform set_config('response.status',v_status::text,true);
  perform set_config('response.headers',case when v_retry>0 then
    jsonb_build_array(jsonb_build_object('Retry-After',v_retry::text),jsonb_build_object('Cache-Control','no-store'))::text
    else '[{"Cache-Control":"no-store"}]' end,true);
  return jsonb_build_object('code',v_code,'message',v_message,'retry_after_seconds',v_retry,
    'details',jsonb_build_object('retry_after_seconds',v_retry)::text,'data',v_page);
exception
  when insufficient_privilege or sqlstate 'PT405' then raise;
  when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then
    perform set_config('response.status','400',true);
    return jsonb_build_object('code','OPERATIONS_READ_INVALID','data',null);
  when others then
    perform set_config('response.status','503',true);
    return jsonb_build_object('code','OPERATIONS_READ_UNAVAILABLE','data',null);
end;
$$;
create function public.read_operations_guarded_v1(p_area_slug text default null,p_limit integer default 100,p_cursor jsonb default null)
returns jsonb language sql volatile security invoker set search_path='' as $$
  select private.read_operations_guarded(p_area_slug,p_limit,p_cursor);
$$;
revoke all on function private.read_operations_guarded(text,integer,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.read_operations_guarded_v1(text,integer,jsonb) from public,anon,authenticated,service_role;
grant execute on function private.read_operations_guarded(text,integer,jsonb) to authenticated;
grant execute on function public.read_operations_guarded_v1(text,integer,jsonb) to authenticated;

create function private.purge_operations_read_guard() returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from private.operations_read_guard_buckets where updated_at<clock_timestamp()-interval '1 hour';
end;
$$;
revoke all on function private.purge_operations_read_guard() from public,anon,authenticated,service_role;
create function private.delete_operations_read_guard_for_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  delete from private.operations_read_guard_buckets b using private.operations_read_guard_config c
    where b.actor_key=extensions.hmac(convert_to(old.id::text,'UTF8'),c.salt,'sha256');
  return old;
end;
$$;
revoke all on function private.delete_operations_read_guard_for_user() from public,anon,authenticated,service_role;
create trigger delete_operations_read_guard_for_user before delete on auth.users
  for each row execute function private.delete_operations_read_guard_for_user();
select cron.schedule('operations-read-guard-purge','*/5 * * * *','select private.purge_operations_read_guard();');
