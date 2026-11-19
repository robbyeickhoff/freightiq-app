import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { roadRestrictionForNavigation } from '../utils/stop-road-restriction-validation.ts';
import { combineRoadSections } from '../utils/shared-road-section-data.ts';

// Run the production loader with controlled storage/network outcomes.
const source = readFileSync(new URL('../utils/stop-road-restriction.ts', import.meta.url), 'utf8');
const start = source.indexOf('export async function readNavigationRoadRestriction(');
const end = source.indexOf('\ntype RoadIdentity', start);
const loader = source.slice(start, end).replace('export ', '').replace('userId: string, stopId: string', 'userId, stopId');
const makeLoader = (local, remote, cache) => new Function('AsyncStorage', 'key', 'roadRestrictionForNavigation',
  'listSharedRoadSections', 'cachedSharedRoadSections', 'combineRoadSections', `${loader}; return readNavigationRoadRestriction;`)(
  { getItem: async () => { if (local instanceof Error) throw local; return local; } }, () => 'test-key',
  roadRestrictionForNavigation, async () => { if (remote instanceof Error) throw remote; return remote; },
  async () => { if (cache instanceof Error) throw cache; return cache; }, combineRoadSections,
);
const point = { latitude: 37.87, longitude: -107.88 };
const section = { road: 'County Road 63L', coordinates: [point, point], exclusionPoints: [point] };

test('failed check without a loaded marking never produces a navigation warning', async () => {
  for (const [local, remote, cache] of [
    [null, new Error('offline'), null], [null, new Error('offline'), []],
    [new Error('storage unavailable'), new Error('offline'), new Error('cache unreadable')],
    ['{bad', [], null], [null, [], null],
  ]) {
    const result = await makeLoader(local, remote, cache)('user', 'stop');
    assert.deepEqual(result, { restriction: null, warning: '' });
  }
});
test('loaded shared, cached and local markings retain their real startup warning', async () => {
  for (const [local, remote, cache] of [
    [null, [section], null], [null, new Error('offline'), [section]],
    [JSON.stringify(section), [], null],
  ]) {
    const result = await makeLoader(local, remote, cache)('user', 'stop');
    assert.equal(result.restriction.road, 'County Road 63L');
    assert.match(result.warning, /previously flagged as restricted/);
    assert.doesNotMatch(result.warning, /could not|unavailable|refreshed/);
  }
});
