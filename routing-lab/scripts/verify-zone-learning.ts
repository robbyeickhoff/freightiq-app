import assert from 'node:assert/strict'

import {
  buildAddressKey,
  buildCanonicalPhysicalAddressKey,
  grandJunctionParentZones,
  grandJunctionMicroZones,
  isMicroZoneParent,
  isValidMicroZonePair,
  microZonesByParent,
  resolveLearnedMicroZone,
  resolveLearnedAddressEvidence,
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

const canonicalCases = [
  ['123 Main Street, Suite 200', '123 Main St #9'],
  ['123 Main St.', '123 MAIN STREET'],
  ['123 North Main Avenue', '123 N Main Ave.'],
  ['123 U.S. Highway 550', '123 US Hwy 550'],
  ['123 County Road 63L', '123 Co Rd 63L'],
] as const
for (const [firstAddress, secondAddress] of canonicalCases) {
  assert.equal(
    buildCanonicalPhysicalAddressKey({ address: firstAddress, city: 'Grand Junction', state: 'Colorado', postalCode: '81501-1234' }),
    buildCanonicalPhysicalAddressKey({ address: secondAddress, city: 'grand junction', state: 'CO', postalCode: '81501' }),
  )
}
assert.notEqual(
  buildCanonicalPhysicalAddressKey({ address: '123 Main St Unit 2', city: 'Grand Junction', state: 'CO', postalCode: '81501' }),
  buildCanonicalPhysicalAddressKey({ address: '124 Main Street', city: 'Grand Junction', state: 'Colorado', postalCode: '81501-1234' }),
)

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

const exactWest = [{ addressKey: 'exact', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-1' }]
const conflictingCanonical = [
  { addressKey: 'canonical', approvedZone: 'West', approvedMicroZone: 'West A', sourceRouteId: 'route-2' },
  { addressKey: 'canonical', approvedZone: 'East', approvedMicroZone: 'East A', sourceRouteId: 'route-3' },
]
assert.equal(resolveLearnedAddressEvidence(exactWest, conflictingCanonical)?.proposedZone, 'West')
assert.deepEqual(resolveLearnedAddressEvidence([], conflictingCanonical), {
  confidence: 'uncertain',
  evidence: 'Prior driver-approved exact-address reviews conflict and need current review.',
  proposedMicroZone: null,
  proposedZone: null,
})

console.log('Shared Micro Zone learning checks passed.')
