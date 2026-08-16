-- Synthetic development data for FreightIQ search verification.
-- These records do not represent production stops, drivers, reports, or users.

insert into public.mfi_stops (id, name, address, lat, lng)
values
  (
    'test-gj-alpine-freight',
    'Alpine Freight Test Stop',
    '100 Test Way, Grand Junction, CO 81501',
    39.0639,
    -108.5506
  ),
  (
    'test-denver-alpine-freight',
    'Alpine Freight Test Stop',
    '200 Example Avenue, Denver, CO 80202',
    39.7392,
    -104.9903
  ),
  (
    'test-gj-mesa-dock',
    'Mesa Dock Supply',
    '300 Sample Road, Grand Junction, CO 81504',
    39.0912,
    -108.4998
  ),
  (
    'test-gj-canyon-distribution',
    'Canyon Distribution Center',
    '400 Placeholder Drive, Grand Junction, CO 81505',
    39.1074,
    -108.6123
  ),
  (
    'test-gj-canyon-distributing',
    'Canyon Distributing',
    '410 Placeholder Drive, Grand Junction, CO 81505',
    39.1080,
    -108.6112
  ),
  (
    'test-fruita-western-warehouse',
    'Western Warehouse Test',
    '500 Fictional Street, Fruita, CO 81521',
    39.1589,
    -108.7284
  ),
  (
    'test-telluride-alpine-market',
    'Alpine Market Test Stop',
    '600 Demo Lane, Telluride, CO 81435',
    37.9375,
    -107.8123
  ),
  (
    'test-norwood-mesa-market',
    'Mesa Market Test Stop',
    '700 Example Boulevard, Norwood, CO 81423',
    38.1300,
    -108.2923
  ),
  (
    'test-gj-no-address',
    'Addressless Test Warehouse',
    null,
    39.0745,
    -108.5701
  ),
  (
    'test-gj-near-duplicate',
    'Mesa Dock Supplies',
    '302 Sample Road, Grand Junction, CO 81504',
    39.0913,
    -108.4997
  );

-- Reusable fictional recording fixture. Placeholder users have no password and exist only to
-- provide ownership and public attribution for synthetic Driver Reports.
insert into auth.users (id, email, created_at, updated_at)
values
  (
    'd0000000-0000-4000-8000-000000000001',
    'demo-driver-one@example.invalid',
    now(),
    now()
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'demo-driver-two@example.invalid',
    now(),
    now()
  );

insert into public.profiles (id, username, tractor_type)
values
  (
    'd0000000-0000-4000-8000-000000000001',
    'Demo Driver',
    'Single Axle Day Cab'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'Route Driver',
    'Tandem Axle Day Cab'
  );

insert into public.mfi_stops (
  id,
  name,
  address,
  lat,
  lng,
  deliver_from_type,
  deliver_from_details,
  approach_hint,
  back_in_required,
  truck_fit,
  entrance_lat,
  entrance_lng,
  city,
  state_code,
  country_code,
  locality_source
)
values (
  'demo-canyon-peak-industrial',
  'Canyon Peak Industrial Supply',
  '1000 Demo Route, Grand Junction, CO 81501',
  39.06435,
  -108.54995,
  'Dock',
  'Rear dock on the north side',
  'Approach from South; use the wide service entrance',
  true,
  '28''',
  39.06454,
  -108.55018,
  'Grand Junction',
  'CO',
  'US',
  'reviewed_backfill'
);

insert into public.mfi_reports (
  id,
  stop_id,
  user_id,
  deliver_from_type,
  deliver_from_details,
  approach_hint,
  back_in_required,
  truck_fit,
  notes,
  tractor_type,
  delivery_type
)
values
  (
    'd1000000-0000-4000-8000-000000000001',
    'demo-canyon-peak-industrial',
    'd0000000-0000-4000-8000-000000000001',
    'Dock',
    'Rear dock on the north side',
    'Approach from South; use the wide service entrance',
    true,
    '28''',
    'Check in at receiving before backing to the dock.',
    'Single Axle Day Cab',
    'Dock'
  ),
  (
    'd1000000-0000-4000-8000-000000000002',
    'demo-canyon-peak-industrial',
    'd0000000-0000-4000-8000-000000000002',
    'Dock',
    'Rear dock on the north side',
    'Wide turn needed from the south entrance',
    true,
    '28''',
    'Plenty of room for a straight truck once you are lined up.',
    'Tandem Axle Day Cab',
    'Dock'
  );
