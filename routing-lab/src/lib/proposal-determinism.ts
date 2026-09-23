export type ProposalStop = {
  id: string
  zone: string
}

export type RouteTransition = {
  fromZone: string
  reason: string
  toZone: string
}

export function hasExactStopMembership(proposedStopIds: string[], stops: ProposalStop[]) {
  const sourceIds = stops.map((stop) => stop.id)
  return proposedStopIds.length === sourceIds.length &&
    new Set(proposedStopIds).size === sourceIds.length &&
    sourceIds.every((id) => proposedStopIds.includes(id))
}

export function enforceMacroZoneBlocks(
  proposedStopIds: string[],
  stops: ProposalStop[],
  expectedFlow: string[],
) {
  if (!hasExactStopMembership(proposedStopIds, stops)) return null

  const stopsById = new Map(stops.map((stop) => [stop.id, stop]))
  const zoneRank = new Map(expectedFlow.map((zone, index) => [zone, index]))
  if (stops.some((stop) => !zoneRank.has(stop.zone))) return null

  return proposedStopIds
    .map((id, modelIndex) => ({ id, modelIndex, zone: stopsById.get(id)?.zone ?? '' }))
    .sort((left, right) =>
      (zoneRank.get(left.zone) ?? Number.MAX_SAFE_INTEGER) -
        (zoneRank.get(right.zone) ?? Number.MAX_SAFE_INTEGER) ||
      left.modelIndex - right.modelIndex,
    )
    .map(({ id }) => id)
}

export function buildDeterministicTransitions(expectedFlow: string[]): RouteTransition[] {
  return expectedFlow.slice(0, -1).map((fromZone, index) => ({
    fromZone,
    reason: 'Documented active macro-zone flow.',
    toZone: expectedFlow[index + 1],
  }))
}
