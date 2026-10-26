begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users(id,email,created_at,updated_at) values
  ('68000000-0000-4000-8000-000000000001','canada-owner@example.invalid',now(),now());

set local role authenticated;
set local "request.jwt.claim.sub"='68000000-0000-4000-8000-000000000001';
select is(
  public.create_freightiq_stop_v1(
    'canada-create-test',' Canadian Stop ',' 1 Saskatchewan Drive ',50.4452,-104.6189,
    ' regina ','sk','ca'
  ),
  'canada-create-test',
  'authenticated driver can create a Canadian stop'
);
reset role;

select is((select city from public.mfi_stops where id='canada-create-test'),'regina','Canadian city normalized');
select is((select state_code from public.mfi_stops where id='canada-create-test'),'SK','Canadian province normalized');
select is((select country_code from public.mfi_stops where id='canada-create-test'),'CA','Canadian country retained');
select is((select locality_source from public.mfi_stops where id='canada-create-test'),'driver_confirmed','Canadian locality remains driver confirmed');
select ok((select lat=50.4452 and lng=-104.6189 from public.mfi_stops where id='canada-create-test'),'Canadian coordinates retained');
select throws_ok(
  $$insert into public.mfi_stops(id,name,lat,lng,user_id,city,state_code,country_code)
    values ('canada-invalid-country','Invalid Country',50,-104,'68000000-0000-4000-8000-000000000001','Regina','SK','CAN')$$,
  '23514',
  null,
  'non-two-letter country rejected by the locality contract'
);

select * from finish();
rollback;
