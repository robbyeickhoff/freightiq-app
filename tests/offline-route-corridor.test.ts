import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node strip-types needs the extension.
import { offlineRouteCorridor, containsOfflinePoint } from '../utils/offline-route-corridor.ts';

test('road corridor excludes unused interior of a bent route but covers the roads and nearby detours', () => {
  const road = [{latitude:39,longitude:-109},{latitude:39,longitude:-108.4},{latitude:38.4,longitude:-108.4}];
  const coverage = offlineRouteCorridor(road);
  assert.ok(coverage);
  for (const p of road) assert.ok(containsOfflinePoint(coverage, p));
  assert.ok(containsOfflinePoint(coverage, {latitude:38.7,longitude:-108.37}));
  assert.ok(!containsOfflinePoint(coverage, {latitude:38.7,longitude:-108.7}));
  const restored = JSON.parse(JSON.stringify(coverage));
  assert.ok(!containsOfflinePoint(restored, {latitude:38.7,longitude:-108.7}));
});

test('Highway 145 corridor retains the County Road 63L detour', () => {
  const coverage = offlineRouteCorridor([
    {latitude:38.016059,longitude:-108.052641},
    {latitude:37.948276,longitude:-107.920861},
    {latitude:37.864695,longitude:-107.882085},
  ]);
  assert.ok(coverage);
  assert.ok(containsOfflinePoint(coverage, {latitude:37.9401065,longitude:-107.8970335}));
});

test('loops, repeated points, a single location and invalid routes are handled', () => {
  assert.equal(offlineRouteCorridor([]), null);
  assert.equal(offlineRouteCorridor([{latitude:NaN,longitude:0}]), null);
  const loop = [{latitude:39,longitude:-108.6},{latitude:39,longitude:-108.4},{latitude:38.8,longitude:-108.4},{latitude:38.8,longitude:-108.6},{latitude:39,longitude:-108.6}];
  const coverage = offlineRouteCorridor(loop);
  assert.ok(coverage);
  assert.ok(!containsOfflinePoint(coverage, {latitude:38.9,longitude:-108.5}));
  const single = offlineRouteCorridor([loop[0], loop[0]]);
  assert.ok(single);
  assert.ok(containsOfflinePoint(single, loop[0]));
  assert.ok(!containsOfflinePoint({bounds:coverage.bounds,geometryJSON:'invalid'}, loop[0]));
});
