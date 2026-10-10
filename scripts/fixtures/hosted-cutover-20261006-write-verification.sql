-- Approved main-project transaction-only verification; all synthetic writes roll back.
begin;
set local statement_timeout='20s';
insert into auth.users(id,email,created_at,updated_at)
values('98000000-0000-4000-8000-000000000006','cutover-rollback-only-20261006@example.invalid',now(),now());
insert into public.profiles(id,username) values('98000000-0000-4000-8000-000000000006','cutover_rollback_20261006');
insert into public.founding_driver_enrollments(user_id,status) values('98000000-0000-4000-8000-000000000006','active');
set local role authenticated;
set local "request.jwt.claim.sub"='98000000-0000-4000-8000-000000000006';
set local "request.method"='POST';
set local "request.headers"='{}';
do $checks$
declare sid text:='cutover-rollback-only-20261006'; rid uuid; oid uuid;
begin
 if public.create_freightiq_stop_v1(sid,'Cutover rollback only','Synthetic original address',39.0639,-108.5506)<>sid then raise exception 'Create failed'; end if;
 if not public.edit_freightiq_stop_v1(sid,'Cutover rollback only','Synthetic original address') then raise exception 'Edit failed'; end if;
 if not public.set_owned_freightiq_delivery_zone_v1(sid,39.064,-108.551) then raise exception 'DZ failed'; end if;
 rid:=public.save_freightiq_report_v1(p_stop_id=>sid,p_notes=>'Rollback-only report');
 if rid is null then raise exception 'Report failed'; end if;
 if public.get_owned_freightiq_stop_editor_v1(sid)->>'id'<>sid then raise exception 'Owner reader failed'; end if;
 oid:=public.create_operations_update('grand-junction','delivery_access','Rollback-only condition',now()+interval '2 hours',sid,null,null);
 perform public.edit_operations_update(oid,'delivery_access','Rollback-only edited condition',now()+interval '2 hours');
 perform public.resolve_operations_update(oid);
 if not public.move_freightiq_stop_v1(sid,
 '{"address":"Synthetic original address","lat":39.0639,"lng":-108.5506,"entrance_lat":39.064,"entrance_lng":-108.551}',
 '{"address":"Synthetic destination address","lat":39.08,"lng":-108.59,"city":"Grand Junction","state_code":"CO","entrance_lat":null,"entrance_lng":null}') then raise exception 'Move failed'; end if;
end;
$checks$;
reset role;
insert into private.security_read_cases(id,actor_key,denied,disclosed,active_minutes)
values('98000000-0000-4000-8000-000000000016',private.security_actor('98000000-0000-4000-8000-000000000006'),0,0,0);
do $identity$
declare m uuid;
begin
 select user_id into strict m from private.moderation_admins order by user_id limit 1;
 perform set_config('request.jwt.claim.sub',m::text,true);
end;
$identity$;
set local role authenticated;
do $moderator$
begin
 if public.get_security_read_cases_v1('98000000-0000-4000-8000-000000000016') is null then raise exception 'Security list failed'; end if;
 perform public.get_moderation_queue();
 perform public.act_security_read_case_v1('98000000-0000-4000-8000-000000000016',0,900,'suspicious_collection');
 perform public.act_security_read_case_v1('98000000-0000-4000-8000-000000000016',1,0,'review_complete');
end;
$moderator$;
reset role;
do $verify$
begin
 if not exists(select 1 from private.security_read_cases where id='98000000-0000-4000-8000-000000000016' and version=2 and paused_until is null) then raise exception 'Moderator restore failed'; end if;
 if (select count(*) from private.security_read_audit where case_id='98000000-0000-4000-8000-000000000016')<>2 then raise exception 'Audit failed'; end if;
 if not exists(select 1 from public.mfi_reports where stop_id='cutover-rollback-only-20261006' and notes='Rollback-only report') then raise exception 'Move did not preserve report'; end if;
end;
$verify$;
select 'PASS: authenticated create/edit/DZ/report/owner-read/Operations create-edit-resolve/Move Stop and moderator list-pause-restore-audit; all fixture writes rolled back' as result;
rollback;
