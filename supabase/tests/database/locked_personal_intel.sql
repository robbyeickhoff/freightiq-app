begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email, created_at, updated_at) values
('20000000-0000-4000-8000-000000000001','private-note-owner@example.test',now(),now()),
('20000000-0000-4000-8000-000000000002','private-note-other@example.test',now(),now());

insert into public.mfi_stops (id,name,lat,lng,user_id) values
('private-note-source','Private Note Source',39.0,-108.0,'20000000-0000-4000-8000-000000000001'),
('private-note-target','Private Note Target',39.1,-108.1,'20000000-0000-4000-8000-000000000002'),
('private-note-conflict-source','Conflict Source',39.2,-108.2,'20000000-0000-4000-8000-000000000001'),
('private-note-conflict-target','Conflict Target',39.3,-108.3,'20000000-0000-4000-8000-000000000002');

select ok(not has_table_privilege('anon','public.mfi_private_stop_notes','select'),'anonymous callers cannot select private notes');
select ok(not has_table_privilege('anon','public.mfi_private_stop_notes','insert'),'anonymous callers cannot insert private notes');
select ok(not has_column_privilege('authenticated','public.mfi_private_stop_notes','user_id','update'),'clients cannot reassign note ownership');
select ok(not has_column_privilege('authenticated','public.mfi_private_stop_notes','stop_id','update'),'clients cannot directly move notes');
select ok(has_function_privilege('authenticated','public.merge_owned_freightiq_stop(text,text)','execute'),'authenticated callers can request safe merges');
select ok(not has_function_privilege('anon','public.merge_owned_freightiq_stop(text,text)','execute'),'anonymous callers cannot request merges');

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';

insert into public.mfi_private_stop_notes (stop_id,note)
values ('private-note-source','Owner gate code');
select is((select note from public.mfi_private_stop_notes where stop_id='private-note-source'),'Owner gate code','owner can read own note');
select throws_ok(
  $$insert into public.mfi_private_stop_notes (stop_id,note) values ('private-note-target','   ')$$,
  '23514',
  null,
  'blank notes are rejected'
);
select throws_ok(
  $$insert into public.mfi_private_stop_notes (stop_id,note) values ('private-note-target',repeat('x',2001))$$,
  '23514',
  null,
  'notes over 2000 characters are rejected'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000002';

select is((select count(*) from public.mfi_private_stop_notes where stop_id='private-note-source'),0::bigint,'another driver cannot discover the owner note');
update public.mfi_private_stop_notes set note='stolen' where stop_id='private-note-source';
select is((select count(*) from public.mfi_private_stop_notes where note='stolen'),0::bigint,'another driver cannot update the owner note');
insert into public.mfi_private_stop_notes (stop_id,note)
values ('private-note-source','Other driver note');

reset role;
insert into public.mfi_reports (stop_id,user_id,notes)
values ('private-note-source','20000000-0000-4000-8000-000000000002','Shared report survives merge');

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
select lives_ok(
  $$select public.merge_owned_freightiq_stop('private-note-source','private-note-target')$$,
  'stop owner can merge without seeing other owners private content'
);

reset role;
select is((select count(*) from public.mfi_stops where id='private-note-source'),0::bigint,'successful merge removes source stop');
select is((select count(*) from public.mfi_private_stop_notes where stop_id='private-note-target'),2::bigint,'successful merge preserves every owner note');
select is((select count(*) from public.mfi_reports where stop_id='private-note-target' and notes='Shared report survives merge'),1::bigint,'successful merge preserves another driver shared report');

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
insert into public.mfi_private_stop_notes (stop_id,note) values
('private-note-conflict-source','Source secret'),
('private-note-conflict-target','Target secret');
select throws_ok(
  $$select public.merge_owned_freightiq_stop('private-note-conflict-source','private-note-conflict-target')$$,
  '23505',
  'A locked-note conflict must be resolved before these stops can be merged.',
  'merge blocks rather than overwriting a same-owner conflict'
);

reset role;
select is((select count(*) from public.mfi_stops where id='private-note-conflict-source'),1::bigint,'conflicted merge keeps source stop');
select is((select count(*) from public.mfi_private_stop_notes where stop_id in ('private-note-conflict-source','private-note-conflict-target')),2::bigint,'conflicted merge keeps both notes');

delete from auth.users where id='20000000-0000-4000-8000-000000000002';
select is((select count(*) from public.mfi_private_stop_notes where user_id='20000000-0000-4000-8000-000000000002'),0::bigint,'account deletion removes owned notes');

set local role authenticated;
set local "request.jwt.claim.sub" = '20000000-0000-4000-8000-000000000001';
delete from public.mfi_private_stop_notes where stop_id='private-note-conflict-source';
select is((select count(*) from public.mfi_private_stop_notes where stop_id='private-note-conflict-source'),0::bigint,'owner can delete own note');
select throws_ok(
  $$select public.merge_owned_freightiq_stop('private-note-target','private-note-conflict-target')$$,
  '42501',
  'Only the driver who created this stop can merge it.',
  'non-owner cannot merge a stop'
);

select * from finish();
rollback;
