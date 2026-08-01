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
