import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { evaluateOperationsEncounter } from "../utils/operations-proximity.ts";

const nearby = { id: "hazard", revision: 1, distance: 100, directionAllowed: true };

test("prompts once, resets after half a mile, and prompts on a later approach", () => {
  const firstApproach = evaluateOperationsEncounter({}, [nearby], "2026-09-04T12:00:00Z");
  assert.equal(firstApproach.candidateId, "hazard");

  const sameEncounter = evaluateOperationsEncounter(firstApproach.encounters, [nearby]);
  assert.equal(sameEncounter.candidateId, null);

  const afterLeaving = evaluateOperationsEncounter(sameEncounter.encounters, [
    { ...nearby, distance: 805 },
  ]);
  assert.equal(afterLeaving.candidateId, null);
  assert.equal(afterLeaving.encounters.hazard, undefined);

  const laterApproach = evaluateOperationsEncounter(afterLeaving.encounters, [nearby]);
  assert.equal(laterApproach.candidateId, "hazard");
});

test("a new revision starts a new encounter", () => {
  const first = evaluateOperationsEncounter({}, [nearby]);
  const revised = evaluateOperationsEncounter(first.encounters, [{ ...nearby, revision: 2 }]);
  assert.equal(revised.candidateId, "hazard");
  assert.equal(revised.encounters.hazard.revision, 2);
});

test("rejects an approach that is outside the prompt radius or wrong direction", () => {
  assert.equal(evaluateOperationsEncounter({}, [{ ...nearby, distance: 403 }]).candidateId, null);
  assert.equal(
    evaluateOperationsEncounter({}, [{ ...nearby, directionAllowed: false }]).candidateId,
    null,
  );
});
