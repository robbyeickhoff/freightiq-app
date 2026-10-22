begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users(id,email,created_at,updated_at) values
  ('52000000-0000-4000-8000-000000000001','intel-dates@example.invalid',now(),now());
insert into public.mfi_stops(id,name,lat,lng,user_id,moderation_status) values
  ('intel-date-stop','Fictional timestamp stop',39,-108,'52000000-0000-4000-8000-000000000001','visible');
insert into public.mfi_reports(
  id, stop_id, user_id, deliver_from_details, approach_hint, check_in_notes, notes,
  moderation_status, updated_at
) values (
  '52000000-0000-4000-8000-000000000002', 'intel-date-stop',
  '52000000-0000-4000-8000-000000000001', 'Use dock two', 'Approach from the west',
  'Call receiving', 'Watch the low branch', 'visible', '2026-01-02 03:04:05+00'
);

select is(deliver_from_details_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'delivery details receive their own initial date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select is(approach_hint_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'best approach receives its own initial date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select is(check_in_notes_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'check-in notes receive their own initial date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select is(notes_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'driver notes receive their own initial date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';

set local role authenticated;
set local "request.jwt.claim.sub"='52000000-0000-4000-8000-000000000001';
select is(
  public.save_freightiq_report_v1(
    p_stop_id=>'intel-date-stop',
    p_report_id=>'52000000-0000-4000-8000-000000000002',
    p_deliver_from_details=>'Use dock two',
    p_approach_hint=>'Approach from the west',
    p_check_in_notes=>'Call receiving',
    p_notes=>'The low branch was trimmed'
  ),
  '52000000-0000-4000-8000-000000000002'::uuid,
  'owner can update one text field through the guarded write API'
);
reset role;

select is(deliver_from_details_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'unchanged delivery details keep their date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select is(approach_hint_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'unchanged best approach keeps its date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select is(check_in_notes_updated_at, '2026-01-02 03:04:05+00'::timestamptz, 'unchanged check-in notes keep their date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';
select ok(notes_updated_at > '2026-01-02 03:04:05+00'::timestamptz, 'changed driver notes receive a newer date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';

set local role authenticated;
set local "request.jwt.claim.sub"='52000000-0000-4000-8000-000000000001';
select ok(public.get_owned_freightiq_report_v1('intel-date-stop') ? 'notes_updated_at', 'owned report includes the driver-note date');
select ok(public.get_owned_freightiq_report_v1('intel-date-stop') ? 'approach_hint_updated_at', 'owned report includes the approach date');
reset role;

set local "request.jwt.claim.sub"='52000000-0000-4000-8000-000000000001';
select is((select notes from public.list_freightiq_stop_reports_v1('intel-date-stop',100)), 'The low branch was trimmed', 'shared report still returns the note');
select ok((select notes_updated_at is not null from public.list_freightiq_stop_reports_v1('intel-date-stop',100)), 'shared report includes the driver-note date');

update public.mfi_reports
set check_in_notes=null, updated_at='2026-04-05 06:07:08+00'
where id='52000000-0000-4000-8000-000000000002';
select ok(check_in_notes_updated_at is null, 'clearing check-in notes clears their displayed date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';

update public.mfi_reports
set check_in_notes='Use the side office', updated_at='2026-05-06 07:08:09+00'
where id='52000000-0000-4000-8000-000000000002';
select is(check_in_notes_updated_at, '2026-05-06 07:08:09+00'::timestamptz, 're-added check-in notes receive their new date')
from public.mfi_reports where id='52000000-0000-4000-8000-000000000002';

select ok(not has_function_privilege('authenticated','public.list_freightiq_stop_reports_v1(text,integer)','execute'), 'direct shared-report reads remain closed to drivers');

select * from finish();
rollback;
