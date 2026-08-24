import assert from 'node:assert/strict'

import {
  buildAddressKey,
  grandJunctionParentZones,
  grandJunctionMicroZones,
  isMicroZoneParent,
  isValidMicroZonePair,
  microZonesByParent,
  resolveLearnedMicroZone,
  resolveLearnedZone,
  selectableOperationalZones,
  tellurideMicroZones,
} from '../src/lib/zone-learning.ts'

assert.deepEqual(grandJunctionParentZones, [
  'Fruita',
  'West',
  'River Road',
  'Airport',
  'Downtown / The Hole',
  'East',
])
assert.equal(selectableOperationalZones.includes('Grand Junction'), false)
assert.equal(Object.values(grandJunctionMicroZones).flat().length, 19)
assert.equal(Object.values(microZonesByParent).flat().length, 30)
assert.deepEqual(tellurideMicroZones['Mountain Village'], [
  'Ophir',
  'Ski Ranch South',
  'Ski Ranch North',
  'Mountain Village West',
  'Benchmark',
  'San Joaquin',
  'Mountain Village East',
  'Mountain Village North',
])
assert.deepEqual(tellurideMicroZones['Downtown Telluride'], [
  'Zone 1 South',
  'Zone 2 East',
  'Zone 3 Central / North',
])
assert.equal(isMicroZoneParent('Mountain Village'), true)
assert.equal(isMicroZoneParent('Lawson Hill / Society'), false)
assert.equal(isValidMicroZonePair('Downtown / The Hole', 'Hole E'), true)
assert.equal(isValidMicroZonePair('West', 'Hole E'), false)
assert.equal(isValidMicroZonePair('Mountain Village', 'Ophir'), true)
assert.equal(isValidMicroZonePair('Downtown Telluride', 'Zone 2 East'), true)
assert.equal(isValidMicroZonePair('Mountain Village', 'Zone 2 East'), false)

assert.equal(buildAddressKey({
  address: '  123   Main St ',
  city: ' GRAND JUNCTION ',
  state: ' CO ',
  postalCode: ' 81501 ',
}), '123 main st|grand junction|co|81501')

assert.equal(resolveLearnedZone([]), null)
assert.deepEqual(resolveLearnedZone([
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-1' },
]), {
  confidence: 'medium',
  evidence: 'One prior driver-approved exact-address review assigned this stop to West.',
  proposedMicroZone: null,
  proposedZone: 'West',
})
assert.equal(resolveLearnedZone([
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-1' },
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-1' },
]).confidence, 'medium')
assert.equal(resolveLearnedZone([
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-1' },
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-2' },
]).confidence, 'high')
assert.deepEqual(resolveLearnedZone([
  { addressKey: 'one', approvedZone: 'West', sourceRouteId: 'route-1' },
  { addressKey: 'one', approvedZone: 'East', sourceRouteId: 'route-2' },
]), {
  confidence: 'uncertain',
  evidence: 'Prior driver-approved exact-address reviews conflict and need current review.',
  proposedMicroZone: null,
  proposedZone: null,
})

assert.deepEqual(resolveLearnedMicroZone([
  { addressKey: 'one', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-1' },
]), {
  confidence: 'medium',
  evidence: 'One prior driver-approved exact-address review assigned this stop to West · West A.',
  proposedMicroZone: 'West A',
  proposedZone: 'West',
})
assert.equal(resolveLearnedMicroZone([
  { addressKey: 'one', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-1' },
  { addressKey: 'one', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-2' },
])?.confidence, 'high')
assert.equal(resolveLearnedMicroZone([
  { addressKey: 'one', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-1' },
  { addressKey: 'one', approvedZone: 'West', approvedMicroZone: 'Hole A', sourceRouteId: 'route-2' },
])?.proposedMicroZone, 'West A')

assert.deepEqual(resolveLearnedMicroZone([
  { addressKey: 'ophir', approvedZone: 'Mountain Village', approvedMicroZone: 'Ophir', sourceRouteId: 'route-1' },
]), {
  confidence: 'medium',
  evidence: 'One prior driver-approved exact-address review assigned this stop to Mountain Village · Ophir.',
  proposedMicroZone: 'Ophir',
  proposedZone: 'Mountain Village',
})
assert.equal(resolveLearnedMicroZone([
  { addressKey: 'town', approvedZone: 'Downtown Telluride', approvedMicroZone: 'Zone 1 South', sourceRouteId: 'route-1' },
  { addressKey: 'town', approvedZone: 'Downtown Telluride', approvedMicroZone: 'Zone 2 East', sourceRouteId: 'route-2' },
])?.confidence, 'uncertain')

console.log('Shared Micro Zone learning checks passed.')
