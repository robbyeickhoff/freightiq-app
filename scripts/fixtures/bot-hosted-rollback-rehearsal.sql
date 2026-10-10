-- Candidate for separately approved hosted execution; validate locally first.
-- No COMMIT, grants, schema changes, external requests, deletes or truncates.
-- Execute this entire file in ONE session. Never execute selected statements.
begin;
set local lock_timeout = '1s';
set local statement_timeout = '20s';
set local idle_in_transaction_session_timeout = '30s';
select set_config('freightiq.rehearsal_user',gen_random_uuid()::text,true);
select set_config('freightiq.rehearsal_prefix','rollback-'||gen_random_uuid()::text,true);
insert into auth.users(id,email,created_at,updated_at)
values(current_setting('freightiq.rehearsal_user')::uuid,
 current_setting('freightiq.rehearsal_prefix')||'@example.invalid',now(),now());
insert into public.mfi_stops(id,name,lat,lng,user_id)
select current_setting('freightiq.rehearsal_prefix')||'-'||n,
 'Fictional rollback-only test',39,-108,current_setting('freightiq.rehearsal_user')::uuid
from generate_series(1,151)n;
-- The reviewed candidate policy, visible only inside this uncommitted transaction.
update private.freightiq_read_guard_config set enabled=true,
 request_capacity=120,request_refill=2,metadata_capacity=12000,metadata_refill=10,
 detail_capacity=150,detail_refill=0.25;
update private.security_response_config set detection_enabled=true,
 min_denied=20,min_disclosed=100,min_minutes=3,
 warn_metadata_15m=6000,warn_detail_15m=250,warn_detail_60m=750;
-- Accelerated warning history for ONLY this synthetic actor. Not real elapsed activity.
insert into private.security_read_minutes(actor_key,minute,denied,disclosed,detail_charged)
select private.security_actor(current_setting('freightiq.rehearsal_user')::uuid),
 date_trunc('minute',clock_timestamp())-n*interval '1 minute',0,50,50
from generate_series(1,2)n;
select set_config('request.jwt.claim.sub',current_setting('freightiq.rehearsal_user'),true);
set local "request.method"='POST';
set local "request.headers"='{}';
set local role authenticated;
do $$
declare result jsonb; batch integer; started timestamptz:=clock_timestamp();
begin
 for batch in 0..2 loop
  result:=public.read_freightiq_guarded_v1('route_stops',jsonb_build_object('p_stop_ids',
   (select jsonb_agg(current_setting('freightiq.rehearsal_prefix')||'-'||n)
    from generate_series(batch*50+1,batch*50+50)n)));
  if result->>'code' is not null or jsonb_array_length(result->'data') is distinct from 50 then
   raise exception 'Expected complete allowed synthetic route batch';
  end if;
 end loop;
 -- A slow run may refill the bucket: fail rather than falsely claiming a refusal.
 if clock_timestamp()-started>=interval '3 seconds' then
  raise exception 'Rehearsal too slow for deterministic budget exhaustion';
 end if;
 result:=public.read_freightiq_guarded_v1('stop_detail',jsonb_build_object('p_stop_id',
  current_setting('freightiq.rehearsal_prefix')||'-151'));
 if result->>'code' is distinct from 'FREIGHTIQ_READ_THROTTLED'
  or result->'data' is distinct from 'null'::jsonb
  or current_setting('response.status') is distinct from '429' then
  raise exception 'Expected data-free bulk-read refusal';
 end if;
 result:=public.read_freightiq_guarded_v1('stop_detail',jsonb_build_object('p_stop_id',
  current_setting('freightiq.rehearsal_prefix')||'-1'));
 if result->>'code' is not null or jsonb_array_length(result->'data') is distinct from 1 then
  raise exception 'Previously charged detail must remain readable';
 end if;
end $$;
reset role;
do $$
declare cid uuid; expected integer; actual integer;
begin
 select id into strict cid from private.security_read_cases
 where actor_key=private.security_actor(current_setting('freightiq.rehearsal_user')::uuid);
 select count(*) into expected from private.security_alert_recipients ar
 join private.moderation_admins ma on ma.user_id=ar.user_id
 join auth.users u on u.id=coalesce(ar.delivery_user_id,ar.user_id)
 where u.email_confirmed_at is not null and u.email is not null;
 select count(*) into actual from private.security_alert_outbox where case_id=cid;
 if actual<>expected then raise exception 'Synthetic case notification queue mismatch'; end if;
end $$;
select 'PASS: 150 synthetic details allowed, next new detail refused without data, repeat detail allowed, sustained-warning case and recipient queue verified. Rollback follows; not HTTP or performance acceptance.' as result;
rollback;
