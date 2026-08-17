# City & Driver Search V1 — Unresolved Locality Correction Runbook

## Purpose

Correct the 18 production stops whose saved addresses provide an explicit reviewable US locality
but whose structured locality tuple remained null after the original City Search backfill.

This runbook also preserves one intentionally unresolved test-like record. It does not execute or
authorize a production write.

## Cause

The City Search schema and server trigger accepted driver-confirmed locality values, but the mobile
stop-creation insert did not send `city`, `state_code`, or `country_code`. All visible stops created
after the original fixed-ID backfill therefore remained available to normal stop and geographic
search while being excluded from City Search.

Telluride Storage illustrates the gap: the approved backfill localized the earlier stop ID
`1774547695916`, but production later contained replacement ID `1786474424226` with a null locality
tuple.

## Approved Review Set

| Stop ID       | Stop                                        | Saved address                                                               | Proposed locality                             |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| 1786934923244 | Gustave A Larson Company                    | 2930 North Ave, Grand Junction, Colorado 81504, United States               | Grand Junction, CO, US                        |
| 1786934118440 | khkcsi                                      | pbezpq                                                                      | Unresolved — no trustworthy locality evidence |
| 1786739612708 | DaVita                                      | 710 Wellington Ave, Grand Junction, Colorado 81501, United States           | Grand Junction, CO, US                        |
| 1786739542905 | All Phase Electric Supply                   | 2776 Crossroads Boulevard, Grand Junction, Colorado 81506, United States    | Grand Junction, CO, US                        |
| 1786735455750 | Solstice Senior Living at Mesa View         | 601 Horizon Pl, Grand Junction, Colorado 81506, United States               | Grand Junction, CO, US                        |
| 1786733711016 | Aspen Ridge Alzheimer's Special Care Center | 622 28 1/4 Rd, Grand Junction, Colorado 81506, United States                | Grand Junction, CO, US                        |
| 1786731871279 | Tru by Hilton Grand Junction Downtown       | 243 Colorado Ave, Grand Junction, Colorado 81501, United States             | Grand Junction, CO, US                        |
| 1786730363153 | Carville's Auto Mart                        | 2507 US-6, Grand Junction, Colorado 81505, United States                    | Grand Junction, CO, US                        |
| 1786729126561 | Play It Again Sports                        | 2454 Hwy 6 And 50 Suite 111B, Grand Junction, Colorado 81505, United States | Grand Junction, CO, US                        |
| 1786728205113 | Big O Tires                                 | 2462 Highway 6 And 50, Grand Junction, Colorado 81505, United States        | Grand Junction, CO, US                        |
| 1786654989083 | WWTP Naturita                               | 26140 FF26 Road, Naturita, Colorado 81422, United States                    | Naturita, CO, US                              |
| 1786578148110 | Black Lantern Ranch                         | 63740 Ida Road, Montrose, Colorado 81401, United States                     | Montrose, CO, US                              |
| 1786577699924 | Telluride Custom Millworks                  | 687 North Cora Street, Ridgway, Colorado 81432, United States               | Ridgway, CO, US                               |
| 1786576979493 | Telluride Film Festival                     | 300 S Mahoney Drive, Unit 3C Telluride, Colorado 81435, United States       | Telluride, CO, US                             |
| 1786576973277 | Telluride Film Festival                     | 300 S Mahoney Drive, Unit 3C Telluride, Colorado 81435, United States       | Telluride, CO, US                             |
| 1786492534356 | San Miguel Power Association                | 720 N Railroad St, Ridgway, Colorado 81432, United States                   | Ridgway, CO, US                               |
| 1786474424226 | Telluride Storage                           | 650 S Park Rd. Telluride, Co 81435                                          | Telluride, CO, US                             |
| 1786470424068 | Kristin Waters                              | 1351 Panorama Ln. Placerville, Co 81430                                     | Placerville, CO, US                           |
| 1786466829880 | CDOT Ridgway                                | 1125 Sherman Street, Ridgway, Colorado 81432, United States                 | Ridgway, CO, US                               |

The two Telluride Film Festival rows remain separate. Duplicate resolution is outside this focused
locality correction.

## Preconditions

Before any production write:

1. Obtain separate Product Owner approval for the exact 18-row mapping.
2. Confirm all 18 target IDs exist, are visible, and still have a fully null locality tuple.
3. Confirm `1786934118440` remains fully null and is not included in the update.
4. Confirm no additional visible null-locality rows have appeared; newly created rows require a new
   reviewed mapping rather than being appended without review.
5. Capture a current backup or confirm the approved recovery path.

## Guarded Transaction

Run only after the separate production-data approval gate.

```sql
begin;

do $$
declare
  v_expected integer := 18;
  v_matching integer;
begin
  with approved(id, name, address) as (
    values
      ('1786934923244', 'Gustave A Larson Company', '2930 North Ave, Grand Junction, Colorado 81504, United States'),
      ('1786739612708', 'DaVita', '710 Wellington Ave, Grand Junction, Colorado 81501, United States'),
      ('1786739542905', 'All Phase Electric Supply', '2776 Crossroads Boulevard, Grand Junction, Colorado 81506, United States'),
      ('1786735455750', 'Solstice Senior Living at Mesa View', '601 Horizon Pl, Grand Junction, Colorado 81506, United States'),
      ('1786733711016', 'Aspen Ridge Alzheimer''s Special Care Center', '622 28 1/4 Rd, Grand Junction, Colorado 81506, United States'),
      ('1786731871279', 'Tru by Hilton Grand Junction Downtown', '243 Colorado Ave, Grand Junction, Colorado 81501, United States'),
      ('1786730363153', 'Carville''s Auto Mart', '2507 US-6, Grand Junction, Colorado 81505, United States'),
      ('1786729126561', 'Play It Again Sports', '2454 Hwy 6 And 50 Suite 111B, Grand Junction, Colorado 81505, United States'),
      ('1786728205113', 'Big O Tires', '2462 Highway 6 And 50, Grand Junction, Colorado 81505, United States'),
      ('1786654989083', 'WWTP Naturita', '26140 FF26 Road, Naturita, Colorado 81422, United States'),
      ('1786578148110', 'Black Lantern Ranch', '63740 Ida Road, Montrose, Colorado 81401, United States'),
      ('1786577699924', 'Telluride Custom Millworks', '687 North Cora Street, Ridgway, Colorado 81432, United States'),
      ('1786576979493', 'Telluride Film Festival', '300 S Mahoney Drive, Unit 3C Telluride, Colorado 81435, United States'),
      ('1786576973277', 'Telluride Film Festival', '300 S Mahoney Drive, Unit 3C Telluride, Colorado 81435, United States'),
      ('1786492534356', 'San Miguel Power Association', '720 N Railroad St, Ridgway, Colorado 81432, United States'),
      ('1786474424226', 'Telluride Storage', '650 S Park Rd. Telluride, Co 81435'),
      ('1786470424068', 'Kristin Waters', '1351 Panorama Ln. Placerville, Co 81430'),
      ('1786466829880', 'CDOT Ridgway', '1125 Sherman Street, Ridgway, Colorado 81432, United States')
  )
  select count(*)
  into v_matching
  from approved a
  join public.mfi_stops s on s.id = a.id
  where s.name = a.name
    and s.address = a.address
    and s.moderation_status = 'visible'
    and s.city is null
    and s.state_code is null
    and s.country_code is null
    and s.locality_source is null;

  if v_matching <> v_expected then
    raise exception 'Locality correction precondition failed: expected %, found %',
      v_expected, v_matching;
  end if;
end;
$$;

with approved(id, city, state_code, country_code) as (
  values
    ('1786934923244', 'Grand Junction', 'CO', 'US'),
    ('1786739612708', 'Grand Junction', 'CO', 'US'),
    ('1786739542905', 'Grand Junction', 'CO', 'US'),
    ('1786735455750', 'Grand Junction', 'CO', 'US'),
    ('1786733711016', 'Grand Junction', 'CO', 'US'),
    ('1786731871279', 'Grand Junction', 'CO', 'US'),
    ('1786730363153', 'Grand Junction', 'CO', 'US'),
    ('1786729126561', 'Grand Junction', 'CO', 'US'),
    ('1786728205113', 'Grand Junction', 'CO', 'US'),
    ('1786654989083', 'Naturita', 'CO', 'US'),
    ('1786578148110', 'Montrose', 'CO', 'US'),
    ('1786577699924', 'Ridgway', 'CO', 'US'),
    ('1786576979493', 'Telluride', 'CO', 'US'),
    ('1786576973277', 'Telluride', 'CO', 'US'),
    ('1786492534356', 'Ridgway', 'CO', 'US'),
    ('1786474424226', 'Telluride', 'CO', 'US'),
    ('1786470424068', 'Placerville', 'CO', 'US'),
    ('1786466829880', 'Ridgway', 'CO', 'US')
)
update public.mfi_stops s
set city = a.city,
    state_code = a.state_code,
    country_code = a.country_code,
    locality_source = 'reviewed_backfill'
from approved a
where s.id = a.id;

do $$
begin
  if (select count(*) from public.mfi_stops
      where id in (
        '1786934923244','1786739612708','1786739542905','1786735455750',
        '1786733711016','1786731871279','1786730363153','1786729126561',
        '1786728205113','1786654989083','1786578148110','1786577699924',
        '1786576979493','1786576973277','1786492534356','1786474424226',
        '1786470424068','1786466829880'
      ) and locality_source = 'reviewed_backfill') <> 18 then
    raise exception 'Locality correction verification failed.';
  end if;
end;
$$;

commit;
```

## Post-Write Verification

1. Verify the 18 exact tuples and `reviewed_backfill` provenance.
2. Verify Telluride Storage appears in `search_freightiq_cities('telluride', ...)` and
   `list_freightiq_city_stops('Telluride', 'CO', 'US', ...)`.
3. Verify the Telluride city count increases by three relative to the pre-correction count.
4. Verify Grand Junction increases by nine, Ridgway by three, and Naturita, Montrose, and
   Placerville by one each.
5. Verify `1786934118440` remains unresolved.
6. Verify normal stop search and map visibility remain unchanged.

## Rollback

If verification fails before commit, roll back the transaction. After commit, use a separately
approved forward correction that targets the same exact IDs; do not rewrite migration history.
