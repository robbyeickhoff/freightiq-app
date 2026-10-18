begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, email, created_at, updated_at)
values ('71000000-0000-4000-8000-000000000001','normalized-search@example.test',now(),now());

insert into public.profiles (id, username)
values ('71000000-0000-4000-8000-000000000001','Normalized Search Tester');

insert into public.mfi_stops
  (id,name,address,lat,lng,user_id,city,state_code,country_code,moderation_status)
values
  ('normalized-search-hospital','St. Mary''s Hospital and Regional Medical Center','2635 N 7th St, Grand Junction, CO 81501',39.0900,-108.5700,'71000000-0000-4000-8000-000000000001','Grand Junction','CO','US','visible'),
  ('normalized-search-machine','Northwest Machine Works Inc','2318 Grand Park Dr, Grand Junction, CO 81505',39.1000,-108.5600,'71000000-0000-4000-8000-000000000001','Grand Junction','CO','US','visible'),
  ('normalized-search-market','1150 West Market Street','1150 West Market Street, Meeker, CO 81641',40.0400,-107.9100,'71000000-0000-4000-8000-000000000001','Meeker','CO','US','visible'),
  ('normalized-search-hyphen','Smith-Jones Freight / Receiving','10 Test Rd, Grand Junction, CO',39.0800,-108.5800,'71000000-0000-4000-8000-000000000001','Grand Junction','CO','US','visible'),
  ('normalized-search-hidden','St. Mary''s Hidden Test','11 Test Rd, Grand Junction, CO',39.0800,-108.5800,'71000000-0000-4000-8000-000000000001','Grand Junction','CO','US','hidden'),
  ('normalized-search-accent','Café del Sol','12 Test Rd, Grand Junction, CO',39.0800,-108.5800,'71000000-0000-4000-8000-000000000001','Grand Junction','CO','US','visible');

select is(
  (select id from public.search_mfi_stops('st m',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'punctuation-normalized name prefix ranks the hospital first'
);
select is(
  (select id from public.search_mfi_stops('St',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'two-letter name prefix ranks the hospital first'
);
select is(
  (select id from public.search_mfi_stops('St.',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'two-letter abbreviation with punctuation ranks the hospital first'
);
select is(
  (select count(*) from public.search_mfi_stops('St',39.09,-108.57,250000,10) where id in ('normalized-search-machine','normalized-search-market')),
  0::bigint,
  'two-letter search does not use broad fragment or address matching'
);
select is(
  (select id from public.search_mfi_stops('st. m',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'punctuated query ranks the hospital first'
);
select is(
  (select id from public.search_mfi_stops('St Mary',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'unpunctuated full prefix ranks the hospital first'
);
select is(
  (select id from public.search_mfi_stops('St. Mary''s',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hospital',
  'apostrophe query ranks the hospital first'
);
select is(
  (select match_tier from public.search_mfi_stops('st m',39.09,-108.57,50000,10) where id='normalized-search-hospital'),
  4,
  'normalized hospital match is a name prefix'
);
select is(
  (select match_tier from public.search_mfi_stops('st m',39.09,-108.57,50000,10) where id='normalized-search-machine'),
  3,
  'incidental machine-name fragment ranks below the prefix'
);
select is(
  (select match_tier from public.search_mfi_stops('st m',39.09,-108.57,250000,10) where id='normalized-search-market'),
  3,
  'incidental market-name fragment ranks below the hospital prefix'
);
select is(
  (select id from public.search_mfi_stops('smith j',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hyphen',
  'hyphenated names match an unpunctuated query'
);
select is(
  (select id from public.search_mfi_stops('freight receiving',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hyphen',
  'slash-separated names match a space-separated query'
);
select is(
  (select id from public.search_mfi_stops('smith   jones',39.09,-108.57,50000,10) limit 1),
  'normalized-search-hyphen',
  'repeated query spaces collapse to the same match'
);
select is(
  (select name from public.search_mfi_stops('st m',39.09,-108.57,50000,10) where id='normalized-search-hospital'),
  'St. Mary''s Hospital and Regional Medical Center',
  'search normalization does not change the displayed name'
);
select is(
  (select id from public.search_mfi_stops('café d',39.09,-108.57,50000,10) limit 1),
  'normalized-search-accent',
  'normalization preserves accented letters'
);
select throws_ok(
  $$select * from public.search_mfi_stops('S.',39.09,-108.57,50000,10)$$,
  '22023',
  'Search text must contain at least two characters.',
  'one-letter queries remain invalid after punctuation normalization'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '71000000-0000-4000-8000-000000000001';
set local "request.method" = 'POST';
set local "request.headers" = '{}';

select is(
  public.read_freightiq_guarded_v1(
    'search_stops',
    '{"p_search_text":"st m","p_center_lat":39.09,"p_center_lng":-108.57,"p_radius_meters":50000,"p_result_limit":10}'
  )->'data'->0->>'id',
  'normalized-search-hospital',
  'guarded stop search returns the normalized hospital match first'
);
select is(
  public.read_freightiq_guarded_v1(
    'search_stops',
    '{"p_search_text":"St.","p_center_lat":39.09,"p_center_lng":-108.57,"p_radius_meters":50000,"p_result_limit":10}'
  )->'data'->0->>'id',
  'normalized-search-hospital',
  'guarded stop search accepts the two-letter abbreviation'
);
select ok(
  not jsonb_path_exists(
    public.read_freightiq_guarded_v1(
      'search_stops',
      '{"p_search_text":"St Mary","p_center_lat":39.09,"p_center_lng":-108.57,"p_radius_meters":50000,"p_result_limit":10}'
    )->'data',
    '$[*] ? (@.id == "normalized-search-hidden")'
  ),
  'guarded stop search still excludes hidden stops'
);
select ok(
  not has_function_privilege('authenticated','public.search_mfi_stops(text,double precision,double precision,double precision,integer)','execute'),
  'the internal search function remains unavailable directly to authenticated clients'
);
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname='public'
      and tablename='mfi_stops'
      and indexname='mfi_stops_normalized_name_prefix_idx'
  ),
  'two-letter name prefixes have a dedicated index'
);

select * from finish();
rollback;
