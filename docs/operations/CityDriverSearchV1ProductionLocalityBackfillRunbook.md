# City & Driver Search V1 — Production Locality Backfill Runbook

> **Status: Prepared for review; execution not authorized — 2026-08-11**
>
> This runbook defines the exact stop-ID-specific production locality backfill for the 227 visible
> stops approved by the Product Owner. It does not authorize a schema migration, production write,
> deployment, distribution, or release.

## Governing Records

- [City & Driver Search V1 build specification](../build-specs/FreightIQCityDriverSearchV1BuildSpec.md)
- [Approved stop-by-stop locality mapping](../build-specs/FreightIQCityDriverSearchV1LocalityMapping.md)
- [Completed production cleanup runbook](CityDriverSearchV1ProductionCleanupRunbook.md)

## Verified Vendor Requirements

Supabase's current migration guidance requires database changes to be represented by migration
files, tested locally with a database reset, previewed before a remote push, and deployed without
direct remote schema editing. The current breaking-change changelog contains no database-migration
change that invalidates this procedure.

Official references:

- [Supabase — Database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Supabase — Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase — Breaking-change changelog](https://supabase.com/changelog?types=breaking-change)

## Fixed Scope

- Production project: `finjqunyuyfxiesumuxk`
- Approved visible stops: exactly 227
- Backfill source: `reviewed_backfill`
- Locality fields changed: `city`, `state_code`, `country_code`, and `locality_source`
- Fields explicitly unchanged: address, coordinates, ownership, routing data, Intel, reports,
  moderation state, timestamps, and every unrelated column
- Dynamic parsing, geocoding, fuzzy matching, nearby-city inference, and Mapbox requests: prohibited

The SQL values below are generated directly from the approved mapping. The mapping and this fixed
list must remain identical.

## Prerequisites

All prerequisites must pass before requesting execution approval:

1. The Phase 2 schema migration has been created through `supabase migration new`.
2. The migration adds the four approved columns, all-or-none validity constraints, approved
   locality-source constraint, permissions, indexes, and bounded search functions.
3. `supabase db reset` passes locally from a clean database.
4. Representative and adversarial database fixtures pass.
5. Schema lint plus Supabase security and performance advisors pass or every relevant finding is
   resolved and documented.
6. Rollback or forward-restoration behavior is verified locally.
7. The production migration history matches the reviewed repository history.
8. A dry-run shows only the separately approved Phase 2 migration is pending.
9. The Phase 2 migration has received separate operational approval and has been applied
   successfully before this data backfill begins.
10. A fresh production preflight matches every expectation below.
11. The Product Owner has separately approved this complete backfill procedure for execution.

Failure of any prerequisite stops the operation.

## Expected Immediate Preflight

Immediately before the transaction, verify read-only that:

- exactly 227 visible stops exist;
- all 227 fixed IDs exist and are visible;
- no visible stop exists outside the fixed mapping;
- all four locality fields are null on all 227 targets;
- the four locality columns and their constraints exist;
- no migration is pending or partially applied; and
- ordinary authenticated stop search still works after the schema migration.

Any new, removed, hidden, renamed, or otherwise mismatched stop stops execution. Do not expand,
shrink, regenerate, or repair the mapping during the production window. Return to read-only review
and present a replacement procedure.

## Exact Guarded Transaction

Run the following as one reviewed transaction through the authenticated production SQL executor
only after every prerequisite and the separate execution approval are satisfied:

```sql
begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

lock table public.mfi_stops in share row exclusive mode;

create temporary table city_driver_search_v1_locality_backfill (
  stop_id text primary key,
  city text not null check (btrim(city) <> ''),
  state_code text not null check (state_code ~ '^[A-Z]{2}$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$')
) on commit drop;

insert into city_driver_search_v1_locality_backfill
  (stop_id, city, state_code, country_code)
values
  ('1773934926766', 'Nucla', 'CO', 'US'),
  ('1784928254592', 'Telluride', 'CO', 'US'),
  ('1784928257340', 'Telluride', 'CO', 'US'),
  ('1774204874644', 'Grand Junction', 'CO', 'US'),
  ('1781899631507', 'Grand Junction', 'CO', 'US'),
  ('1785772130534', 'Grand Junction', 'CO', 'US'),
  ('1773414472402', 'Nucla', 'CO', 'US'),
  ('1784084363929', 'Telluride', 'CO', 'US'),
  ('1775851852228', 'Grand Junction', 'CO', 'US'),
  ('1785532604107', 'Grand Junction', 'CO', 'US'),
  ('1775596233964', 'Burton', 'MI', 'US'),
  ('1775492501704', 'Montrose', 'CO', 'US'),
  ('1785787436978', 'Grand Junction', 'CO', 'US'),
  ('1774543372108', 'Montrose', 'CO', 'US'),
  ('1778182629465', 'Grand Junction', 'CO', 'US'),
  ('1780956330806', 'Telluride', 'CO', 'US'),
  ('1782503194453', 'Grand Junction', 'CO', 'US'),
  ('1778182439278', 'Grand Junction', 'CO', 'US'),
  ('1773329958419', 'Grand Junction', 'CO', 'US'),
  ('1774990129559', 'Telluride', 'CO', 'US'),
  ('1782503053308', 'Grand Junction', 'CO', 'US'),
  ('1780930788507', 'Ridgway', 'CO', 'US'),
  ('1782502461164', 'Grand Junction', 'CO', 'US'),
  ('1779329276049', 'Telluride', 'CO', 'US'),
  ('1774989641146', 'Mountain Village', 'CO', 'US'),
  ('1783522269737', 'Mountain Village', 'CO', 'US'),
  ('1785622960362', 'Ridgway', 'CO', 'US'),
  ('1785949368969', 'Montrose', 'CO', 'US'),
  ('1775072038386', 'Grand Junction', 'CO', 'US'),
  ('1785531677605', 'Grand Junction', 'CO', 'US'),
  ('1783368082214', 'Olathe', 'CO', 'US'),
  ('1785771525742', 'Grand Junction', 'CO', 'US'),
  ('1783367866074', 'Montrose', 'CO', 'US'),
  ('1775491229880', 'Montrose', 'CO', 'US'),
  ('1781900024339', 'Grand Junction', 'CO', 'US'),
  ('1773253033533', 'Grand Junction', 'CO', 'US'),
  ('1781295533072', 'Grand Junction', 'CO', 'US'),
  ('1781900137287', 'Grand Junction', 'CO', 'US'),
  ('1781899902429', 'Clifton', 'CO', 'US'),
  ('1775677053930', 'Placerville', 'CO', 'US'),
  ('1784333974943', 'Grand Junction', 'CO', 'US'),
  ('1784327038157', 'Grand Junction', 'CO', 'US'),
  ('1784749374295', 'Montrose', 'CO', 'US'),
  ('1783049347382', 'Norwood', 'CO', 'US'),
  ('1786128700628', 'Grand Junction', 'CO', 'US'),
  ('1785785871357', 'Fruita', 'CO', 'US'),
  ('1785778228920', 'Fruita', 'CO', 'US'),
  ('1774989832054', 'Ridgway', 'CO', 'US'),
  ('1783464334173', 'Telluride', 'CO', 'US'),
  ('1785532339617', 'Grand Junction', 'CO', 'US'),
  ('1786124574002', 'Grand Junction', 'CO', 'US'),
  ('1772544860193', 'Grand Junction', 'CO', 'US'),
  ('1774301044173', 'Montrose', 'CO', 'US'),
  ('1781899744461', 'Grand Junction', 'CO', 'US'),
  ('1786139507339', 'Grand Junction', 'CO', 'US'),
  ('1783367483202', 'Montrose', 'CO', 'US'),
  ('1781404986594', 'Ridgway', 'CO', 'US'),
  ('1775853151505', 'Grand Junction', 'CO', 'US'),
  ('1783536805598', 'Montrose', 'CO', 'US'),
  ('1783364068943', 'Montrose', 'CO', 'US'),
  ('1775059808137', 'Montrose', 'CO', 'US'),
  ('1782833664527', 'Delta', 'CO', 'US'),
  ('1784684544688', 'Placerville', 'CO', 'US'),
  ('1774989987455', 'Ridgway', 'CO', 'US'),
  ('1781296103555', 'Grand Junction', 'CO', 'US'),
  ('1780408164160', 'Montrose', 'CO', 'US'),
  ('1782502778146', 'Grand Junction', 'CO', 'US'),
  ('1786062604316', 'Nucla', 'CO', 'US'),
  ('1773685281298', 'Telluride', 'CO', 'US'),
  ('1783537587180', 'Montrose', 'CO', 'US'),
  ('1773521673346', 'Nucla', 'CO', 'US'),
  ('1774901736430', 'Mountain Village', 'CO', 'US'),
  ('1782315466005', 'Montrose', 'CO', 'US'),
  ('1774633635355', 'Montrose', 'CO', 'US'),
  ('1773251868597', 'Grand Junction', 'CO', 'US'),
  ('1774819215987', 'Loma', 'CO', 'US'),
  ('1775058935730', 'Montrose', 'CO', 'US'),
  ('1785438840258', 'Norwood', 'CO', 'US'),
  ('1781899841115', 'Palisade', 'CO', 'US'),
  ('1773681809487', 'Mountain Village', 'CO', 'US'),
  ('1783367632113', 'Montrose', 'CO', 'US'),
  ('1773607728544', 'Grand Junction', 'CO', 'US'),
  ('1773934972930', 'Gateway', 'CO', 'US'),
  ('1784775655777', 'Montrose', 'CO', 'US'),
  ('1786127285307', 'Grand Junction', 'CO', 'US'),
  ('1778611569163', 'Grand Junction', 'CO', 'US'),
  ('1774631216816', 'Grand Junction', 'CO', 'US'),
  ('1786124512596', 'Grand Junction', 'CO', 'US'),
  ('1783535023664', 'Montrose', 'CO', 'US'),
  ('1782838252320', 'Grand Junction', 'CO', 'US'),
  ('1781296492037', 'Grand Junction', 'CO', 'US'),
  ('1785531994174', 'Grand Junction', 'CO', 'US'),
  ('1785438270336', 'Telluride', 'CO', 'US'),
  ('1774544934918', 'Montrose', 'CO', 'US'),
  ('1783863840195', 'Telluride', 'CO', 'US'),
  ('1779384841120', 'Montrose', 'CO', 'US'),
  ('1786119867818', 'Grand Junction', 'CO', 'US'),
  ('1781899520702', 'Grand Junction', 'CO', 'US'),
  ('1784024805673', 'Telluride', 'CO', 'US'),
  ('1781694131439', 'Ridgway', 'CO', 'US'),
  ('1775595283279', 'Fruita', 'CO', 'US'),
  ('1782502976466', 'Grand Junction', 'CO', 'US'),
  ('1781826276876', 'Norwood', 'CO', 'US'),
  ('1783863507012', 'Telluride', 'CO', 'US'),
  ('1782836495273', 'Grand Junction', 'CO', 'US'),
  ('1775852043492', 'Grand Junction', 'CO', 'US'),
  ('1785882886292', 'Montrose', 'CO', 'US'),
  ('1785438646986', 'Norwood', 'CO', 'US'),
  ('1781295732286', 'Grand Junction', 'CO', 'US'),
  ('1786402444418', 'Mountain Village', 'CO', 'US'),
  ('1773681345843', 'Telluride', 'CO', 'US'),
  ('1783350435568', 'Whitewater', 'CO', 'US'),
  ('1785531885870', 'Grand Junction', 'CO', 'US'),
  ('1773849515084', 'Grand Junction', 'CO', 'US'),
  ('1781296350541', 'Grand Junction', 'CO', 'US'),
  ('1773759276205', 'Montrose', 'CO', 'US'),
  ('1784748791277', 'Montrose', 'CO', 'US'),
  ('1785466935546', 'Gateway', 'CO', 'US'),
  ('1781638829465', 'Mountain Village', 'CO', 'US'),
  ('1781638833163', 'Mountain Village', 'CO', 'US'),
  ('1782331650789', 'Ridgway', 'CO', 'US'),
  ('1784840560435', 'Telluride', 'CO', 'US'),
  ('1772907886671', 'Grand Junction', 'CO', 'US'),
  ('1773259687093', 'Grand Junction', 'CO', 'US'),
  ('1774211020349', 'Clifton', 'CO', 'US'),
  ('1783027825573', 'Telluride', 'CO', 'US'),
  ('1782836936184', 'Grand Junction', 'CO', 'US'),
  ('1776382362078', 'Nucla', 'CO', 'US'),
  ('1782427897636', 'Nucla', 'CO', 'US'),
  ('1782427922121', 'Nucla', 'CO', 'US'),
  ('1786062741019', 'Nucla', 'CO', 'US'),
  ('1781638992360', 'Telluride', 'CO', 'US'),
  ('1784326896432', 'Grand Junction', 'CO', 'US'),
  ('1774901582319', 'Ouray', 'CO', 'US'),
  ('1774285493021', 'Ouray', 'CO', 'US'),
  ('1774295146752', 'Ouray', 'CO', 'US'),
  ('1774901470357', 'Ridgway', 'CO', 'US'),
  ('1786402684939', 'Ridgway', 'CO', 'US'),
  ('1781726905939', 'Telluride', 'CO', 'US'),
  ('1783367529732', 'Montrose', 'CO', 'US'),
  ('1784025143335', 'Telluride', 'CO', 'US'),
  ('1781899308879', 'Grand Junction', 'CO', 'US'),
  ('1782961381468', 'Grand Junction', 'CO', 'US'),
  ('1778182525587', 'Grand Junction', 'CO', 'US'),
  ('1775666246048', 'Olathe', 'CO', 'US'),
  ('1783534148520', 'Montrose', 'CO', 'US'),
  ('1778264904674', 'Fruita', 'CO', 'US'),
  ('1785773788017', 'Grand Junction', 'CO', 'US'),
  ('1783368010421', 'Olathe', 'CO', 'US'),
  ('1782840748092', 'Grand Junction', 'CO', 'US'),
  ('1773253321067', 'Grand Junction', 'CO', 'US'),
  ('1785786050088', 'Fruita', 'CO', 'US'),
  ('1786121085951', 'Grand Junction', 'CO', 'US'),
  ('1780071129476', 'Grand Junction', 'CO', 'US'),
  ('1782507143591', 'Grand Junction', 'CO', 'US'),
  ('1782856765077', 'Grand Junction', 'CO', 'US'),
  ('1781049188421', 'Nucla', 'CO', 'US'),
  ('1773677389553', 'Ridgway', 'CO', 'US'),
  ('1782152497688', 'Ridgway', 'CO', 'US'),
  ('1781196195442', 'Ridgway', 'CO', 'US'),
  ('1778685613811', 'Ridgway', 'CO', 'US'),
  ('1774471990079', 'Grand Junction', 'CO', 'US'),
  ('1776096905973', 'Montrose', 'CO', 'US'),
  ('1785424161417', 'Delta', 'CO', 'US'),
  ('1784749744236', 'Delta', 'CO', 'US'),
  ('1774892559552', 'Montrose', 'CO', 'US'),
  ('1774626755555', 'Olathe', 'CO', 'US'),
  ('1783538016921', 'Montrose', 'CO', 'US'),
  ('1784749010526', 'Montrose', 'CO', 'US'),
  ('1773768981662', 'Telluride', 'CO', 'US'),
  ('1785017220274', 'Grand Junction', 'CO', 'US'),
  ('1784024425863', 'Ridgway', 'CO', 'US'),
  ('1783367712201', 'Montrose', 'CO', 'US'),
  ('1786402394984', 'Telluride', 'CO', 'US'),
  ('1784928529332', 'Telluride', 'CO', 'US'),
  ('1774472098207', 'Grand Junction', 'CO', 'US'),
  ('1785777205852', 'Fruita', 'CO', 'US'),
  ('1782502701222', 'Grand Junction', 'CO', 'US'),
  ('1773245804570', 'Grand Junction', 'CO', 'US'),
  ('1775772599374', 'Grand Junction', 'CO', 'US'),
  ('1783368230674', 'Olathe', 'CO', 'US'),
  ('1779814087926', 'Montrose', 'CO', 'US'),
  ('1784927576107', 'Telluride', 'CO', 'US'),
  ('1773259424778', 'Grand Junction', 'CO', 'US'),
  ('1785945563782', 'Montrose', 'CO', 'US'),
  ('1780531032917', 'Montrose', 'CO', 'US'),
  ('1783367334595', 'Montrose', 'CO', 'US'),
  ('1785946570630', 'Montrose', 'CO', 'US'),
  ('1775676640342', 'Telluride', 'CO', 'US'),
  ('1781638122044', 'Ridgway', 'CO', 'US'),
  ('1783464103612', 'Mountain Village', 'CO', 'US'),
  ('1784927308615', 'Telluride', 'CO', 'US'),
  ('1773522765882', 'Mountain Village', 'CO', 'US'),
  ('1774547695916', 'Telluride', 'CO', 'US'),
  ('1781035187489', 'Telluride', 'CO', 'US'),
  ('1785532174060', 'Grand Junction', 'CO', 'US'),
  ('1774364604011', 'Mountain Village', 'CO', 'US'),
  ('1780956135701', 'Telluride', 'CO', 'US'),
  ('1783644125509', 'Mountain Village', 'CO', 'US'),
  ('1775072167473', 'Grand Junction', 'CO', 'US'),
  ('1782933510648', 'Telluride', 'CO', 'US'),
  ('1781295975881', 'Grand Junction', 'CO', 'US'),
  ('1783539407151', 'Montrose', 'CO', 'US'),
  ('1781638582897', 'Mountain Village', 'CO', 'US'),
  ('1781035010183', 'Telluride', 'CO', 'US'),
  ('1781296631870', 'Grand Junction', 'CO', 'US'),
  ('1775490519307', 'Montrose', 'CO', 'US'),
  ('1784025380300', 'Telluride', 'CO', 'US'),
  ('1784215076329', 'Olathe', 'CO', 'US'),
  ('1781547234019', 'Telluride', 'CO', 'US'),
  ('1784749165517', 'Montrose', 'CO', 'US'),
  ('1785532478190', 'Grand Junction', 'CO', 'US'),
  ('1778860941658', 'Grand Junction', 'CO', 'US'),
  ('1778611148271', 'Grand Junction', 'CO', 'US'),
  ('1778529744173', 'Mountain Village', 'CO', 'US'),
  ('1785791345613', 'Grand Junction', 'CO', 'US'),
  ('1773259342401', 'Grand Junction', 'CO', 'US'),
  ('1782313825446', 'Montrose', 'CO', 'US'),
  ('1775583327848', 'Montrose', 'CO', 'US'),
  ('1774628684781', 'Grand Junction', 'CO', 'US'),
  ('1775851672633', 'Grand Junction', 'CO', 'US'),
  ('1774472216023', 'Grand Junction', 'CO', 'US'),
  ('1784928759184', 'Telluride', 'CO', 'US'),
  ('1779465182698', 'Grand Junction', 'CO', 'US'),
  ('1781233735706', 'Naturita', 'CO', 'US'),
  ('1785284839716', 'Ridgway', 'CO', 'US'),
  ('1786402492223', 'Telluride', 'CO', 'US');

do $preflight$
declare
  mapped_count integer;
  visible_count integer;
  missing_or_hidden_count integer;
  unmapped_visible_count integer;
  already_populated_count integer;
begin
  select count(*) into mapped_count
  from city_driver_search_v1_locality_backfill;

  select count(*) into visible_count
  from public.mfi_stops
  where moderation_status = 'visible';

  select count(*) into missing_or_hidden_count
  from city_driver_search_v1_locality_backfill b
  left join public.mfi_stops s on s.id = b.stop_id
  where s.id is null or s.moderation_status <> 'visible';

  select count(*) into unmapped_visible_count
  from public.mfi_stops s
  left join city_driver_search_v1_locality_backfill b on b.stop_id = s.id
  where s.moderation_status = 'visible' and b.stop_id is null;

  select count(*) into already_populated_count
  from public.mfi_stops s
  join city_driver_search_v1_locality_backfill b on b.stop_id = s.id
  where s.city is not null
     or s.state_code is not null
     or s.country_code is not null
     or s.locality_source is not null;

  if mapped_count <> 227 then
    raise exception 'Backfill aborted: expected 227 mapping rows, found %', mapped_count;
  end if;

  if visible_count <> 227 then
    raise exception 'Backfill aborted: expected 227 visible stops, found %', visible_count;
  end if;

  if missing_or_hidden_count <> 0 then
    raise exception 'Backfill aborted: % mapped stops are missing or not visible',
      missing_or_hidden_count;
  end if;

  if unmapped_visible_count <> 0 then
    raise exception 'Backfill aborted: % visible stops are outside the approved mapping',
      unmapped_visible_count;
  end if;

  if already_populated_count <> 0 then
    raise exception 'Backfill aborted: % targets already contain locality data',
      already_populated_count;
  end if;
end
$preflight$;

do $write$
declare
  changed_count integer;
begin
  update public.mfi_stops s
  set city = b.city,
      state_code = b.state_code,
      country_code = b.country_code,
      locality_source = 'reviewed_backfill'
  from city_driver_search_v1_locality_backfill b
  where s.id = b.stop_id;

  get diagnostics changed_count = row_count;

  if changed_count <> 227 then
    raise exception 'Backfill aborted: expected 227 changed rows, changed %', changed_count;
  end if;
end
$write$;

do $verify$
declare
  mismatch_count integer;
begin
  select count(*) into mismatch_count
  from city_driver_search_v1_locality_backfill b
  join public.mfi_stops s on s.id = b.stop_id
  where s.city is distinct from b.city
     or s.state_code is distinct from b.state_code
     or s.country_code is distinct from b.country_code
     or s.locality_source is distinct from 'reviewed_backfill';

  if mismatch_count <> 0 then
    raise exception 'Backfill aborted: % rows failed exact post-write verification',
      mismatch_count;
  end if;
end
$verify$;

commit;
```

The transaction must be submitted as one operation. Any assertion error or timeout must leave the
database unchanged. Do not retry without a new read-only preflight.

## Immediate Post-Write Verification

After commit, verify read-only that:

1. exactly 227 visible stops remain;
2. exactly 227 rows have `locality_source = 'reviewed_backfill'`;
3. every fixed ID has the exact approved city, state, and country;
4. zero visible stops have a partial locality tuple;
5. zero visible stops have null locality;
6. no address, coordinates, ownership, routing data, moderation state, Intel, report, or timestamp
   value changed;
7. Telluride and Mountain Village remain factually distinct stored localities;
8. Saturday Test is Grand Junction and Adaptive Manufacturing Solutions is Burton, Michigan;
9. ordinary authenticated stop search remains functional; and
10. the new city search functions return representative expected cities only if those functions
    were included in the separately approved Phase 2 migration.

Record the execution timestamp, executor, before/after counts, migration version, verification
results, and any advisor findings in this runbook. Never record credentials or private row data.

## Recovery Boundary

If the transaction fails before commit, PostgreSQL rolls it back and no data recovery is required.

After commit, do not run a broad or dynamic reversal. A reversal must be a separately reviewed,
fixed-ID transaction that:

- first proves all 227 rows still exactly match this mapping;
- proves every target still has `locality_source = 'reviewed_backfill'`;
- proves no target has since been driver-confirmed or edited;
- clears only the four locality fields on the exact 227 IDs; and
- verifies all unrelated fields remain unchanged.

If any row has changed after backfill, stop and prepare a row-specific forward correction instead of
erasing newer data.

## Approval Gate

This runbook is prepared for review only. The Phase 2 migration, clean migration replay, focused
local verification, and forward-restoration check are complete. Production migration, this
production backfill, application implementation, commit, push, deployment, distribution, and
release remain separate approval gates.
