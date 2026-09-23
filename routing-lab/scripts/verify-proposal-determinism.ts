import assert from 'node:assert/strict'

import {
  buildDeterministicTransitions,
  enforceMacroZoneBlocks,
  hasExactStopMembership,
} from '../src/lib/proposal-determinism.ts'

const stops = [
  { id: 'ridgway-1', zone: 'Ridgway Proper' },
  { id: 'placerville-1', zone: 'Placerville / Sawpit' },
  { id: 'lawson-1', zone: 'Lawson Hill / Society' },
  { id: 'downtown-1', zone: 'Downtown Telluride' },
  { id: 'downtown-2', zone: 'Downtown Telluride' },
]
const flow = [
  'Ridgway Proper',
  'Placerville / Sawpit',
  'Lawson Hill / Society',
  'Downtown Telluride',
]

assert.equal(hasExactStopMembership(stops.map(({ id }) => id), stops), true)
assert.equal(hasExactStopMembership(['ridgway-1', 'placerville-1'], stops), false)
assert.equal(hasExactStopMembership([
  'ridgway-1', 'placerville-1', 'lawson-1', 'downtown-1', 'invented',
], stops), false)

assert.deepEqual(enforceMacroZoneBlocks([
  'downtown-2',
  'ridgway-1',
  'downtown-1',
  'lawson-1',
  'placerville-1',
], stops, flow), [
  'ridgway-1',
  'placerville-1',
  'lawson-1',
  'downtown-2',
  'downtown-1',
])
assert.equal(enforceMacroZoneBlocks(['ridgway-1'], stops, flow), null)
assert.deepEqual(buildDeterministicTransitions(flow), [
  { fromZone: 'Ridgway Proper', reason: 'Documented active macro-zone flow.', toZone: 'Placerville / Sawpit' },
  { fromZone: 'Placerville / Sawpit', reason: 'Documented active macro-zone flow.', toZone: 'Lawson Hill / Society' },
  { fromZone: 'Lawson Hill / Society', reason: 'Documented active macro-zone flow.', toZone: 'Downtown Telluride' },
])

console.log('Proposal determinism checks passed.')
