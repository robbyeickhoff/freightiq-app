-- Transaction-only hosted verification for Recoverable Stop Lifecycle V1.
-- Every fixture and lifecycle event is rolled back.

begin;
set local search_path = public;

do $verify$
begin
  if has_table_privilege(
    'authenticated',
    (select c.oid from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='private' and c.relname='stop_lifecycle_events'),
    'select'
  ) then
    raise exception 'authenticated can read private lifecycle evidence';
  end if;
  if has_function_privilege('anon','public.list_owned_removed_freightiq_stops_v1()','execute') then
    raise exception 'anonymous recovery-list execution is present';
  end if;
  if has_function_privilege('anon','public.restore_owned_freightiq_stop_v1(text)','execute') then
    raise exception 'anonymous restore execution is present';
  end if;
  if not has_function_privilege('authenticated','public.delete_owned_freightiq_stop_v1(text)','execute')
    or not has_function_privilege('authenticated','public.list_owned_removed_freightiq_stops_v1()','execute')
    or not has_function_privilege('authenticated','public.restore_owned_freightiq_stop_v1(text)','execute') then
    raise exception 'authenticated lifecycle execution grant is missing';
  end if;
end;
$verify$;

insert into auth.users(id,email,created_at,updated_at) values
 ('68100000-0000-4000-8000-000000000001','hosted-lifecycle-owner@example.invalid',now(),now()),
 ('68100000-0000-4000-8000-000000000002','hosted-lifecycle-other@example.invalid',now(),now());

insert into public.mfi_stops(id,name,address,lat,lng,user_id,entrance_lat,entrance_lng) values
 ('hosted-lifecycle-source','Hosted Lifecycle Source','1 Rollback Road',39,-108,'68100000-0000-4000-8000-000000000001',39.001,-108.001),
 ('hosted-lifecycle-target','Hosted Lifecycle Target','2 Rollback Road',39.01,-108.01,'68100000-0000-4000-8000-000000000002',null,null);
insert into public.mfi_reports(id,stop_id,user_id,notes) values
 ('68100000-0000-4000-8000-000000000010','hosted-lifecycle-source','68100000-0000-4000-8000-000000000002','Rollback-only report');
insert into public.mfi_private_stop_notes(id,stop_id,user_id,note) values
 ('68100000-0000-4000-8000-000000000020','hosted-lifecycle-source','68100000-0000-4000-8000-000000000001','Rollback-only note');

set local role authenticated;
set local "request.jwt.claim.sub"='68100000-0000-4000-8000-000000000002';
do $verify$
begin
  if public.delete_owned_freightiq_stop_v1('hosted-lifecycle-source') then
    raise exception 'non-owner removed stop';
  end if;
end;
$verify$;

set local "request.jwt.claim.sub"='68100000-0000-4000-8000-000000000001';
do $verify$
begin
  if not public.delete_owned_freightiq_stop_v1('hosted-lifecycle-source') then
    raise exception 'owner removal returned false';
  end if;
  if (select count(*) from public.list_owned_removed_freightiq_stops_v1()
      where id='hosted-lifecycle-source') <> 1 then
    raise exception 'owner recovery list does not contain removed stop';
  end if;
  if (select count(*) from public.get_freightiq_stop_v1('hosted-lifecycle-source')) <> 0 then
    raise exception 'ordinary detail exposed removed stop';
  end if;
end;
$verify$;
reset role;

do $verify$
begin
  if not exists (
    select 1 from public.mfi_stops
    where id='hosted-lifecycle-source' and user_id is null
      and removed_by='68100000-0000-4000-8000-000000000001'
      and removal_kind='owner_deleted' and moderation_status='removed'
      and recovery_expires_at > removed_at
  ) then
    raise exception 'removal metadata is incomplete';
  end if;
  if (select count(*) from public.mfi_reports where stop_id='hosted-lifecycle-source') <> 1
    or (select count(*) from public.mfi_private_stop_notes where stop_id='hosted-lifecycle-source') <> 1 then
    raise exception 'child Intel was not preserved';
  end if;
end;
$verify$;

set local role authenticated;
set local "request.jwt.claim.sub"='68100000-0000-4000-8000-000000000001';
do $verify$
begin
  if not public.restore_owned_freightiq_stop_v1('hosted-lifecycle-source') then
    raise exception 'owner restore returned false';
  end if;
  perform public.merge_owned_freightiq_stop('hosted-lifecycle-source','hosted-lifecycle-target');
end;
$verify$;
reset role;

do $verify$
begin
  if not exists (
    select 1 from public.mfi_stops
    where id='hosted-lifecycle-source' and removal_kind='merged'
      and merged_into_stop_id='hosted-lifecycle-target' and user_id is null
  ) then
    raise exception 'merge tombstone is incomplete';
  end if;
  if not exists (
    select 1 from public.mfi_reports
    where id='68100000-0000-4000-8000-000000000010'
      and stop_id='hosted-lifecycle-target'
  ) or not exists (
    select 1 from public.mfi_private_stop_notes
    where id='68100000-0000-4000-8000-000000000020'
      and stop_id='hosted-lifecycle-target'
  ) then
    raise exception 'merge did not preserve and move child Intel';
  end if;
end;
$verify$;

select '1..1' as tap_result
union all
select 'ok 1 - hosted recoverable stop lifecycle verification passed';

rollback;
