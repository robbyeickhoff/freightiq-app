import assert from 'node:assert/strict'

import {
  moveStopToPosition,
  sameStopOrder,
} from '../src/lib/route-reordering.ts'

const aiProposal = ['a', 'b', 'c', 'd', 'e']

const firstMove = moveStopToPosition(aiProposal, 4, 1)
assert.deepEqual(firstMove, ['a', 'e', 'b', 'c', 'd'])
assert.deepEqual(aiProposal, ['a', 'b', 'c', 'd', 'e'])

const secondMove = moveStopToPosition(firstMove, 3, 0)
assert.deepEqual(secondMove, ['c', 'a', 'e', 'b', 'd'])

const undoSecondMove = firstMove
assert.deepEqual(undoSecondMove, ['a', 'e', 'b', 'c', 'd'])

assert.equal(sameStopOrder(aiProposal, [...aiProposal]), true)
assert.equal(sameStopOrder(aiProposal, firstMove), false)
assert.equal(sameStopOrder(aiProposal, ['a', 'b', 'c', 'd']), false)

assert.equal(moveStopToPosition(aiProposal, 2, 2), aiProposal)
assert.equal(moveStopToPosition(aiProposal, -1, 2), aiProposal)
assert.equal(moveStopToPosition(aiProposal, 1, 8), aiProposal)

console.log('Route-reordering checks passed.')
