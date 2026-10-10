begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,email_confirmed_at) values
 ('99300000-0000-4000-8000-000000000001','inbox-moderator@example.invalid',now()),
 ('99300000-0000-4000-8000-000000000002','separate-inbox@example.invalid',now()),
 ('99300000-0000-4000-8000-000000000003','inbox-subject@example.invalid',now());
insert into private.moderation_admins(user_id) values('99300000-0000-4000-8000-000000000001');
insert into private.security_alert_recipients(user_id,delivery_user_id)
 values('99300000-0000-4000-8000-000000000001','99300000-0000-4000-8000-000000000002');
update private.security_response_config set detection_enabled=true,mail_enabled=true,
 min_denied=1,min_disclosed=1,min_minutes=2;
set local "request.jwt.claim.sub"='99300000-0000-4000-8000-000000000003';
insert into private.security_read_minutes(actor_key,minute,denied,disclosed)
 values(private.security_actor(auth.uid()),date_trunc('minute',now())-interval '1 minute',1,1);
select private.record_security_read(true,0);
select is((select recipient from private.security_alert_outbox),'separate-inbox@example.invalid','approved alternate confirmed inbox receives alert');
set local role authenticated;
set local "request.jwt.claim.sub"='99300000-0000-4000-8000-000000000002';
select throws_ok($$select public.get_security_read_cases_v1()$$,'42501','Moderator access required.','inbox account gains no moderator access');
select throws_ok($$update private.security_alert_recipients set delivery_user_id=auth.uid()$$,'42501',null,'driver cannot redirect security email');
reset role;
select set_config('test.inbox_claim',private.claim_security_alert()::text,true);
select ok(private.authorize_security_alert((current_setting('test.inbox_claim')::jsonb->>'id')::uuid,
 (current_setting('test.inbox_claim')::jsonb->>'leaseToken')::uuid),'alternate inbox authorized before send');
update auth.users set email_confirmed_at=null where id='99300000-0000-4000-8000-000000000002';
select ok(not private.authorize_security_alert((current_setting('test.inbox_claim')::jsonb->>'id')::uuid,
 (current_setting('test.inbox_claim')::jsonb->>'leaseToken')::uuid),'unconfirmed alternate inbox cannot receive queued mail');
update auth.users set email_confirmed_at=now(),email='changed-inbox@example.invalid' where id='99300000-0000-4000-8000-000000000002';
select ok(not private.authorize_security_alert((current_setting('test.inbox_claim')::jsonb->>'id')::uuid,
 (current_setting('test.inbox_claim')::jsonb->>'leaseToken')::uuid),'changed address cannot silently receive frozen delivery');
update auth.users set email='separate-inbox@example.invalid' where id='99300000-0000-4000-8000-000000000002';
delete from private.moderation_admins where user_id='99300000-0000-4000-8000-000000000001';
select ok(not private.authorize_security_alert((current_setting('test.inbox_claim')::jsonb->>'id')::uuid,
 (current_setting('test.inbox_claim')::jsonb->>'leaseToken')::uuid),'moderator revocation disables alternate delivery too');
select private.claim_security_alert();
select is((select state from private.security_alert_outbox),'cancelled','revoked recipient queued delivery cancelled');
select * from finish();
rollback;
