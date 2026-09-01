import assert from 'node:assert/strict'

import {
  normalizeStoredRouteProposal,
  normalizeStoredRouteStop,
  normalizeStoredZoneClassification,
} from '../src/lib/route-taxonomy-compatibility.ts'

const oldName = 'Ridgway — North of Highway 62'

assert.deepEqual(normalizeStoredRouteStop({ id: 'stop-1', zone: oldName }), {
  id: 'stop-1',
  zone: 'Ridgway North',
})

assert.deepEqual(normalizeStoredZoneClassification({
  confidence: 'medium',
  evidence: 'Historical route evidence.',
  proposedMicroZone: null,
  proposedZone: oldName,
  selectedMicroZone: null,
  selectedZone: oldName,
  status: 'approved',
  stopId: 'stop-1',
}), {
  confidence: 'medium',
  evidence: 'Historical route evidence.',
  proposedMicroZone: null,
  proposedZone: 'Ridgway North',
  selectedMicroZone: null,
  selectedZone: 'Ridgway North',
  status: 'approved',
  stopId: 'stop-1',
})

assert.deepEqual(normalizeStoredRouteProposal({
  appliedLessonIds: [],
  documentsUsed: ['MacroZones.md'],
  macroZoneFlow: ['Montrose', oldName, 'Ouray', 'Ridgway Proper', 'Log Hill'],
  operationalExceptions: [],
  orderedStopIds: ['stop-1'],
  transitions: [
    { fromZone: 'Montrose', reason: 'Forward flow.', toZone: oldName },
    { fromZone: oldName, reason: 'Forward flow.', toZone: 'Ouray' },
  ],
  uncertainSequences: [{ reason: 'Historical estimate.', zone: oldName }],
}), {
  appliedLessonIds: [],
  documentsUsed: ['MacroZones.md'],
  macroZoneFlow: ['Montrose', 'Ridgway North', 'Ouray', 'Ridgway Proper', 'Log Hill'],
  operationalExceptions: [],
  orderedStopIds: ['stop-1'],
  transitions: [
    { fromZone: 'Montrose', reason: 'Forward flow.', toZone: 'Ridgway North' },
    { fromZone: 'Ridgway North', reason: 'Forward flow.', toZone: 'Ouray' },
  ],
  uncertainSequences: [{ reason: 'Historical estimate.', zone: 'Ridgway North' }],
})

console.log('Historical route taxonomy compatibility checks passed.')
