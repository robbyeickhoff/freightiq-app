import assert from 'node:assert/strict'

import { preservesVerifiedMacroFlow } from '../src/lib/macro-flow-validation.ts'

const expectedGrandJunctionFlow = ['Airport', 'West', 'River Road']

assert.equal(
  preservesVerifiedMacroFlow(['River Road', 'West', 'Airport'], expectedGrandJunctionFlow),
  true,
  'a driver-approved Grand Junction parent-zone order may replace manifest first-appearance order',
)
assert.equal(
  preservesVerifiedMacroFlow(['Airport', 'River Road', 'West'], expectedGrandJunctionFlow),
  true,
  'another complete Grand Junction parent-zone order remains valid',
)
assert.equal(
  preservesVerifiedMacroFlow(['River Road', 'West'], expectedGrandJunctionFlow),
  false,
  'an approved order may not omit an active parent zone',
)
assert.equal(
  preservesVerifiedMacroFlow(['Airport', 'West', 'Airport', 'River Road'], expectedGrandJunctionFlow),
  false,
  'an approved order may not split one parent zone into multiple visits',
)
assert.equal(
  preservesVerifiedMacroFlow(
    ['River Road', 'West', 'Airport', 'Delta', 'Montrose'],
    ['Airport', 'West', 'River Road', 'Delta', 'Montrose'],
  ),
  true,
  'Grand Junction parent order may change while documented downstream flow is preserved',
)
assert.equal(
  preservesVerifiedMacroFlow(
    ['River Road', 'West', 'Airport', 'Montrose', 'Delta'],
    ['Airport', 'West', 'River Road', 'Delta', 'Montrose'],
  ),
  false,
  'documented non-Grand-Junction macro flow remains protected',
)
assert.equal(
  preservesVerifiedMacroFlow(
    ['River Road', 'Delta', 'West', 'Airport', 'Montrose'],
    ['Airport', 'West', 'River Road', 'Delta', 'Montrose'],
  ),
  false,
  'Grand Junction parent zones must remain one continuous route block',
)

console.log('Macro-flow lesson validation passed.')
