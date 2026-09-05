export const OPERATIONS_PROMPT_RADIUS_METERS = 402.336;
export const OPERATIONS_ENCOUNTER_RESET_METERS = 804.672;

export type OperationsEncounterRecord = {
  revision: number;
  promptedAt: string;
};

export type OperationsEncounterState = Record<string, OperationsEncounterRecord>;

export type OperationsEncounterCandidate = {
  id: string;
  revision: number;
  distance: number;
  directionAllowed: boolean;
};

export function evaluateOperationsEncounter(
  encounters: OperationsEncounterState,
  candidates: OperationsEncounterCandidate[],
  now = new Date().toISOString(),
) {
  const nextEncounters = { ...encounters };
  for (const candidate of candidates) {
    const recorded = nextEncounters[candidate.id];
    if (
      recorded &&
      (recorded.revision !== candidate.revision ||
        candidate.distance > OPERATIONS_ENCOUNTER_RESET_METERS)
    ) {
      delete nextEncounters[candidate.id];
    }
  }

  const nextCandidate = candidates
    .filter(
      (candidate) =>
        candidate.distance <= OPERATIONS_PROMPT_RADIUS_METERS &&
        candidate.directionAllowed &&
        !nextEncounters[candidate.id],
    )
    .sort((a, b) => a.distance - b.distance)[0];

  if (nextCandidate) {
    nextEncounters[nextCandidate.id] = {
      revision: nextCandidate.revision,
      promptedAt: now,
    };
  }

  return { candidateId: nextCandidate?.id ?? null, encounters: nextEncounters };
}
