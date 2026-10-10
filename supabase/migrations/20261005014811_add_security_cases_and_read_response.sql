-- Local candidate. Detection and mail delivery default OFF; no thresholds selected.
-- Case/audit retention is separate from short-lived minute accounting.
create table private.security_response_config (
 singleton boolean primary key default true check(singleton),
 salt bytea not null default extensions.gen_random_bytes(32) check(octet_length(salt)=32),
 detection_enabled boolean not null default false,
 mail_enabled boolean not null default false,
 last_record_failure_at timestamptz,
 last_worker_at timestamptz,
 min_denied integer check(min_denied between 1 and 1000000),
 min_disclosed integer check(min_disclosed between 1 and 1000000),
 min_minutes integer check(min_minutes between 2 and 15),
 check(not detection_enabled or (min_denied is not null and min_disclosed is not null and min_minutes is not null))
);
insert into private.security_response_config default values;
create table private.security_read_minutes (
 actor_key bytea not null check(octet_length(actor_key)=32),
 minute timestamptz not null,
 denied bigint not null default 0,
 disclosed bigint not null default 0,
 primary key(actor_key,minute)
);
create table private.security_read_cases (
 id uuid primary key default gen_random_uuid(),
 actor_key bytea not null unique check(octet_length(actor_key)=32),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '30 days',
 last_seen_at timestamptz not null default now(),
 denied bigint not null,
 disclosed bigint not null,
 active_minutes integer not null,
 paused_until timestamptz,
 version integer not null default 0,
 check(expires_at>created_at and expires_at<=created_at+interval '30 days')
);
create table private.security_read_audit (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references private.security_read_cases(id) on delete cascade,
 moderator_id uuid references auth.users(id) on delete set null,
 action text not null check(action in ('pause','restore')),
 reason text not null check(reason in ('suspicious_collection','review_complete','mistake')),
 happened_at timestamptz not null default clock_timestamp(),
 paused_until timestamptz,
 version integer not null
);
create table private.security_alert_recipients (
 user_id uuid primary key references private.moderation_admins(user_id) on delete cascade
);
create table private.security_alert_outbox (
 id uuid primary key default gen_random_uuid(),
 case_id uuid not null references private.security_read_cases(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 recipient text not null,
 created_at timestamptz not null default clock_timestamp(),
 attempt integer not null default 0 check(attempt between 0 and 5),
 next_attempt_at timestamptz not null default clock_timestamp(),
 lease_token uuid,
 lease_until timestamptz,
 state text not null default 'pending' check(state in ('pending','accepted','held','cancelled')),
 provider_id uuid,
 unique(case_id,recipient_id)
);
create index security_read_minutes_age on private.security_read_minutes(minute);
create index security_read_cases_age on private.security_read_cases(expires_at);
create index security_alert_ready on private.security_alert_outbox(next_attempt_at) where state='pending';
alter table private.security_response_config enable row level security;
alter table private.security_read_minutes enable row level security;
alter table private.security_read_cases enable row level security;
alter table private.security_read_audit enable row level security;
alter table private.security_alert_recipients enable row level security;
alter table private.security_alert_outbox enable row level security;
revoke all on private.security_response_config,private.security_read_minutes,private.security_read_cases,
 private.security_read_audit,private.security_alert_recipients,private.security_alert_outbox from public,anon,authenticated,service_role;

create function private.security_actor(p_user uuid) returns bytea
language sql stable security definer set search_path='' as $$
 select extensions.hmac(convert_to(p_user::text,'UTF8'),salt,'sha256') from private.security_response_config;
$$;
create function private.require_security_moderator() returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_moderation_admin()
   or not exists(select 1 from auth.users where id=auth.uid()) then
   raise insufficient_privilege using message='Moderator access required.';
 end if;
end;
$$;
create function private.record_security_read(p_denied boolean,p_disclosed integer) returns void
language plpgsql security definer set search_path='' as $$
declare c private.security_response_config%rowtype; a bytea; d bigint; r bigint; n integer; cid uuid;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 select * into strict c from private.security_response_config;
 if not c.detection_enabled then return; end if;
 a:=private.security_actor(auth.uid());
 -- Guard already serializes its own counters. This lock coordinates both read surfaces.
 perform pg_advisory_xact_lock(hashtextextended(encode(a,'hex'),7421));
 insert into private.security_read_minutes(actor_key,minute,denied,disclosed)
 values(a,date_trunc('minute',clock_timestamp()),case when p_denied then 1 else 0 end,greatest(0,coalesce(p_disclosed,0)))
 on conflict(actor_key,minute) do update set denied=security_read_minutes.denied+excluded.denied,
 disclosed=security_read_minutes.disclosed+excluded.disclosed;
 select sum(denied),sum(disclosed),count(*) into d,r,n from private.security_read_minutes
 where actor_key=a and minute>=date_trunc('minute',clock_timestamp())-interval '14 minutes';
 if d<c.min_denied or r<c.min_disclosed or n<c.min_minutes then return; end if;
 delete from private.security_read_cases where actor_key=a and expires_at<=clock_timestamp();
 insert into private.security_read_cases(actor_key,denied,disclosed,active_minutes)
 values(a,d,r,n) on conflict(actor_key) do update set
 last_seen_at=clock_timestamp(),denied=excluded.denied,disclosed=excluded.disclosed,active_minutes=excluded.active_minutes
 returning id into cid;
 -- One delivery per case/approved recipient. Never take an address from a client.
 insert into private.security_alert_outbox(case_id,recipient_id,recipient)
 select cid,u.id,u.email from private.security_alert_recipients ar
 join private.moderation_admins ma on ma.user_id=ar.user_id join auth.users u on u.id=ar.user_id
 where u.email_confirmed_at is not null and u.email is not null
 on conflict(case_id,recipient_id) do nothing;
end;
$$;

create function private.security_pause_seconds() returns integer
language plpgsql security definer set search_path='' as $$
declare t timestamptz;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then
   raise insufficient_privilege using message='Authentication required.';
 end if;
 select paused_until into t from private.security_read_cases where actor_key=private.security_actor(auth.uid())
 and expires_at>clock_timestamp();
 return greatest(0,ceil(extract(epoch from t-clock_timestamp()))::integer);
end;
$$;

-- Preserve old algorithms unchanged as private cores, revoke every client bypass.
alter function public.read_freightiq_guarded_v1(text,jsonb) set schema private;
alter function private.read_freightiq_guarded_v1(text,jsonb) rename to read_freightiq_guarded_core;
alter function private.read_operations_guarded(text,integer,jsonb) rename to read_operations_guarded_core;
revoke all on function private.read_freightiq_guarded_core(text,jsonb),private.read_operations_guarded_core(text,integer,jsonb)
 from public,anon,authenticated,service_role;

create function private.read_with_security_response(p_surface text,p_operation text,p_args jsonb,p_area text,p_limit integer,p_cursor jsonb)
returns jsonb language plpgsql volatile security definer set search_path='' set lock_timeout='2s' as $$
declare w integer; result jsonb; disclosed integer:=0; code text;
begin
 if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
 if lower(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'prefer','')) ~ '(^|,)\s*tx\s*=' then raise invalid_parameter_value; end if;
 if p_surface not in ('library','operations') or p_surface is null then raise invalid_parameter_value; end if;
 w:=private.security_pause_seconds();
 if w>0 then
   perform set_config('response.status','429',true);
   perform set_config('response.headers',jsonb_build_array(jsonb_build_object('Cache-Control','no-store'),jsonb_build_object('Retry-After',w::text))::text,true);
   return jsonb_build_object('code',case when p_surface='library' then 'FREIGHTIQ_READ_THROTTLED' else 'OPERATIONS_READ_THROTTLED' end,
    'message','Shared reading is temporarily paused. Contributions remain available.',
    'retry_after_seconds',w,'details',jsonb_build_object('retry_after_seconds',w)::text,'data',null);
 end if;
 if p_surface='library' then result:=private.read_freightiq_guarded_core(p_operation,p_args);
 else result:=private.read_operations_guarded_core(p_area,p_limit,p_cursor); end if;
 code:=result->>'code';
 -- Notification bookkeeping failure must not roll back quota accounting or disable enforcement.
 begin
   if code is null then
     if p_surface='operations' then disclosed:=jsonb_array_length(result->'data'->'updates');
     elsif jsonb_typeof(result->'data')='array' then disclosed:=jsonb_array_length(result->'data');
     elsif jsonb_typeof(result->'data'->'stops')='array' then disclosed:=jsonb_array_length(result->'data'->'stops'); end if;
   end if;
   if code is null or code in ('FREIGHTIQ_READ_THROTTLED','OPERATIONS_READ_THROTTLED') then
     perform private.record_security_read(code is not null,disclosed);
   end if;
 exception when others then
   begin update private.security_response_config set last_record_failure_at=clock_timestamp() where singleton;
   exception when others then null; end;
 end;
 return result;
exception
 when insufficient_privilege or sqlstate 'PT405' then raise;
 when invalid_parameter_value or invalid_text_representation or numeric_value_out_of_range then
   perform set_config('response.status','400',true);
   return jsonb_build_object('code',case when p_surface='library' then 'FREIGHTIQ_READ_INVALID' else 'OPERATIONS_READ_INVALID' end,'data',null);
 when others then
   perform set_config('response.status','503',true);
   return jsonb_build_object('code',case when p_surface='library' then 'FREIGHTIQ_READ_UNAVAILABLE' else 'OPERATIONS_READ_UNAVAILABLE' end,'data',null);
end;
$$;
create function public.read_freightiq_guarded_v1(p_operation text,p_args jsonb default '{}') returns jsonb
language sql volatile security invoker set search_path='' as $$
 select private.read_with_security_response('library',p_operation,p_args,null,null,null);
$$;
create or replace function public.read_operations_guarded_v1(p_area_slug text default null,p_limit integer default 100,p_cursor jsonb default null)
returns jsonb language sql volatile security invoker set search_path='' as $$
 select private.read_with_security_response('operations',null,null,p_area_slug,p_limit,p_cursor);
$$;

create function private.security_case_list(p_case uuid,p_before timestamptz,p_before_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_security_moderator();
 if (p_before is null) <> (p_before_id is null) then raise invalid_parameter_value; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id desc),'[]') into result from (
 select c.id,c.created_at,c.expires_at,c.last_seen_at,c.denied,c.disclosed,c.active_minutes,c.paused_until,c.version,
  coalesce(c.paused_until>clock_timestamp(),false) as pause_active,
  (select coalesce(jsonb_agg(jsonb_build_object('state',o.state,'attempt',o.attempt)),'[]') from private.security_alert_outbox o where o.case_id=c.id) as deliveries,
  (select coalesce(jsonb_agg(to_jsonb(a) order by a.happened_at desc),'[]') from
    (select action,reason,happened_at,paused_until,version from private.security_read_audit where case_id=c.id order by happened_at desc limit 20) a) as actions
 from private.security_read_cases c where c.expires_at>clock_timestamp()
 and (p_case is null or c.id=p_case) and (p_before is null or (c.created_at,c.id)<(p_before,p_before_id))
 order by c.created_at desc,c.id desc limit 50) x;
 return jsonb_build_object('cases',result,'detection_enabled',(select detection_enabled from private.security_response_config),
 'mail_enabled',(select mail_enabled from private.security_response_config),
 'last_record_failure_at',(select last_record_failure_at from private.security_response_config),
 'last_worker_at',(select last_worker_at from private.security_response_config),
 'oldest_pending_at',(select min(created_at) from private.security_alert_outbox where state='pending'));
end;
$$;
create function public.get_security_read_cases_v1(p_case uuid default null,p_before timestamptz default null,p_before_id uuid default null) returns jsonb
language sql security invoker set search_path='' as $$select private.security_case_list(p_case,p_before,p_before_id);$$;

create function private.security_case_act(p_case uuid,p_version integer,p_seconds integer,p_reason text) returns void
language plpgsql security definer set search_path='' set lock_timeout='2s' as $$
declare c private.security_read_cases%rowtype; t timestamptz;
begin
 perform private.require_security_moderator();
 if current_setting('request.method',true) is distinct from 'POST' then raise sqlstate 'PT405' using message='POST required.'; end if;
 if lower(coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'prefer','')) ~ '(^|,)\s*tx\s*=' then raise invalid_parameter_value; end if;
 if p_version is null or p_version<0 or p_seconds is null or p_seconds not in (0,900,3600,86400)
 or p_reason is null or (p_seconds>0 and p_reason<>'suspicious_collection')
 or (p_seconds=0 and p_reason not in ('review_complete','mistake')) then raise invalid_parameter_value using message='Invalid action.'; end if;
 select * into c from private.security_read_cases where id=p_case for update;
 if not found or c.expires_at<=clock_timestamp() then raise sqlstate 'PT404' using message='Case unavailable.'; end if;
 if c.version<>p_version then raise sqlstate 'PT409' using message='Case changed. Reload before acting.'; end if;
 t:=case when p_seconds=0 then null else least(clock_timestamp()+make_interval(secs=>p_seconds),c.expires_at) end;
 update private.security_read_cases set paused_until=t,version=version+1 where id=p_case;
 insert into private.security_read_audit(case_id,moderator_id,action,reason,paused_until,version)
 values(p_case,auth.uid(),case when p_seconds=0 then 'restore' else 'pause' end,p_reason,t,p_version+1);
end;
$$;
create function public.act_security_read_case_v1(p_case uuid,p_version integer,p_seconds integer,p_reason text) returns void
language sql security invoker set search_path='' as $$select private.security_case_act(p_case,p_version,p_seconds,p_reason);$$;

create function private.claim_security_alert() returns jsonb
language plpgsql security definer set search_path='' as $$
declare o private.security_alert_outbox%rowtype;
begin
 if not (select mail_enabled from private.security_response_config) then return null; end if;
 update private.security_response_config set last_worker_at=clock_timestamp() where singleton;
 update private.security_alert_outbox q set state='cancelled',lease_token=null,lease_until=null
 where q.state='pending' and not exists(select 1 from private.security_alert_recipients ar join private.moderation_admins ma on ma.user_id=ar.user_id
 join auth.users u on u.id=ar.user_id where ar.user_id=q.recipient_id and u.email=q.recipient and u.email_confirmed_at is not null);
 update private.security_alert_outbox set state='held',lease_token=null,lease_until=null
 where state='pending' and (lease_until is null or lease_until<=clock_timestamp())
 and (attempt>=5 or created_at<=clock_timestamp()-interval '23 hours'+interval '15 seconds');
 select q.* into o from private.security_alert_outbox q join private.security_read_cases c on c.id=q.case_id
 where q.state='pending' and q.next_attempt_at<=clock_timestamp() and (q.lease_until is null or q.lease_until<=clock_timestamp())
 and c.expires_at>clock_timestamp() order by q.created_at,q.id for update of q skip locked limit 1;
 if not found then return null; end if;
 update private.security_alert_outbox set attempt=attempt+1,lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '60 seconds'
 where id=o.id returning * into o;
 return jsonb_build_object('id',o.id,'caseId',o.case_id,'recipient',o.recipient,'createdAt',o.created_at,
 'attempt',o.attempt,'leaseExpiresAt',o.lease_until,'leaseToken',o.lease_token);
end;
$$;
create function public.claim_security_alert_v1() returns jsonb language sql security invoker set search_path='' as $$select private.claim_security_alert();$$;
create function private.authorize_security_alert(p_id uuid,p_lease uuid) returns boolean
language sql security definer set search_path='' as $$
 select exists(select 1 from private.security_alert_outbox o
 join private.security_read_cases c on c.id=o.case_id
 join private.security_alert_recipients ar on ar.user_id=o.recipient_id
 join private.moderation_admins ma on ma.user_id=ar.user_id
 join auth.users u on u.id=ar.user_id
 where o.id=p_id and o.lease_token=p_lease and o.lease_until>clock_timestamp()+interval '15 seconds'
 and o.state='pending' and o.created_at>clock_timestamp()-interval '23 hours'+interval '15 seconds'
 and c.expires_at>clock_timestamp() and u.email=o.recipient and u.email_confirmed_at is not null
 and (select mail_enabled from private.security_response_config));
$$;
create function public.authorize_security_alert_v1(p_id uuid,p_lease uuid) returns boolean
language sql security invoker set search_path='' as $$select private.authorize_security_alert(p_id,p_lease);$$;
create function private.complete_security_alert(p_id uuid,p_lease uuid,p_state text,p_provider uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if p_state is null or p_state not in ('accepted','retry','held') or (p_state='accepted' and p_provider is null) then raise invalid_parameter_value; end if;
 update private.security_alert_outbox set
 state=case when p_state='retry' and attempt<5 and created_at>clock_timestamp()-interval '23 hours' then 'pending'
   when p_state='retry' then 'held' else p_state end,
 next_attempt_at=clock_timestamp()+make_interval(secs=>least(60*power(2,attempt-1),900)::integer),
 provider_id=case when p_state='accepted' then p_provider else null end,lease_token=null,lease_until=null
 where id=p_id and state='pending' and lease_token=p_lease and lease_until>clock_timestamp();
 get diagnostics n=row_count; return n=1;
end;
$$;
create function public.complete_security_alert_v1(p_id uuid,p_lease uuid,p_state text,p_provider uuid default null) returns boolean
language sql security invoker set search_path='' as $$select private.complete_security_alert(p_id,p_lease,p_state,p_provider);$$;

create function private.purge_security_response() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from private.security_read_minutes where minute<=clock_timestamp()-interval '110 minutes';
 delete from private.security_read_cases where expires_at<=clock_timestamp();
end;
$$;
create function private.delete_security_response_for_user() returns trigger language plpgsql security definer set search_path='' as $$
declare a bytea:=private.security_actor(old.id);
begin
 delete from private.security_read_minutes where actor_key=a;
 delete from private.security_read_cases where actor_key=a;
 return old;
end;
$$;
create trigger delete_security_response_for_user before delete on auth.users for each row execute function private.delete_security_response_for_user();

revoke all on function private.security_actor(uuid),private.require_security_moderator(),private.record_security_read(boolean,integer),
 private.security_pause_seconds(),private.read_with_security_response(text,text,jsonb,text,integer,jsonb),
 private.security_case_list(uuid,timestamptz,uuid),private.security_case_act(uuid,integer,integer,text),private.claim_security_alert(),
 private.complete_security_alert(uuid,uuid,text,uuid),private.purge_security_response(),private.delete_security_response_for_user(),
 public.read_freightiq_guarded_v1(text,jsonb),public.read_operations_guarded_v1(text,integer,jsonb),
 public.get_security_read_cases_v1(uuid,timestamptz,uuid),public.act_security_read_case_v1(uuid,integer,integer,text),
 public.claim_security_alert_v1(),public.complete_security_alert_v1(uuid,uuid,text,uuid) from public,anon,authenticated,service_role;
revoke all on function private.authorize_security_alert(uuid,uuid),public.authorize_security_alert_v1(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.read_with_security_response(text,text,jsonb,text,integer,jsonb),
 public.read_freightiq_guarded_v1(text,jsonb),public.read_operations_guarded_v1(text,integer,jsonb),
 private.security_case_list(uuid,timestamptz,uuid),private.security_case_act(uuid,integer,integer,text),
 public.get_security_read_cases_v1(uuid,timestamptz,uuid),public.act_security_read_case_v1(uuid,integer,integer,text) to authenticated;
grant execute on function private.claim_security_alert(),private.complete_security_alert(uuid,uuid,text,uuid),
 public.claim_security_alert_v1(),public.complete_security_alert_v1(uuid,uuid,text,uuid) to service_role;
grant execute on function private.authorize_security_alert(uuid,uuid),public.authorize_security_alert_v1(uuid,uuid) to service_role;
select cron.schedule('security-response-purge','*/5 * * * *','select private.purge_security_response();');
