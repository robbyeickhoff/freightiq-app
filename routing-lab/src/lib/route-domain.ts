export type RouteStop = {
  id: string
  address: string
  city: string
  name: string
  zone: string
}

export type RouteProposal<TStop extends RouteStop = RouteStop> = {
  id: string
  label: string
  stops: TStop[]
}

export type StopOutcome = 'complete' | 'unable'

export type StopEvent = {
  actionOrder: number
  recordedAt: string
  status: StopOutcome
}

export type RouteRunState = {
  remainingStopIds: string[]
  routeFinishedAt: string | null
  routeStartedAt: string
  stopEvents: Record<string, StopEvent>
}

export type StopOutcomeResult = {
  expectedStopId: string | null
  outOfOrder: boolean
  remainingStopIds: string[]
  stopEvents: Record<string, StopEvent>
}

export type PendingReason = {
  description: string
  kind: 'active' | 'planned'
}

export type ReasonRecord = PendingReason & {
  note: string
  reasons: string[]
  recordedAt: string
}

export function sequencesMatch(first: string[], second: string[]) {
  return (
    first.length === second.length &&
    first.every((stopId, index) => stopId === second[index])
  )
}

export function resolveStopsById<TStop extends RouteStop>(
  stopIds: string[],
  availableStops: TStop[],
) {
  const stopsById = new Map(availableStops.map((stop) => [stop.id, stop]))

  return stopIds
    .map((stopId) => stopsById.get(stopId))
    .filter((stop): stop is TStop => Boolean(stop))
}

export function reorderItem<T>(items: T[], currentIndex: number, direction: -1 | 1) {
  const nextIndex = currentIndex + direction

  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const reorderedItems = [...items]
  const [movedItem] = reorderedItems.splice(currentIndex, 1)
  reorderedItems.splice(nextIndex, 0, movedItem)
  return reorderedItems
}

export function startRouteRun(stopIds: string[], startedAt: string): RouteRunState {
  return {
    remainingStopIds: [...stopIds],
    routeFinishedAt: null,
    routeStartedAt: startedAt,
    stopEvents: {},
  }
}

export function recordRouteStopOutcome(
  remainingStopIds: string[],
  stopEvents: Record<string, StopEvent>,
  stopId: string,
  status: StopOutcome,
  recordedAt: string,
): StopOutcomeResult {
  if (stopEvents[stopId] || !remainingStopIds.includes(stopId)) {
    return {
      expectedStopId: remainingStopIds[0] ?? null,
      outOfOrder: false,
      remainingStopIds,
      stopEvents,
    }
  }

  const expectedStopId = remainingStopIds[0] ?? null
  const currentPosition = remainingStopIds.indexOf(stopId)

  return {
    expectedStopId,
    outOfOrder: status === 'complete' && currentPosition > 0,
    remainingStopIds: remainingStopIds.filter((id) => id !== stopId),
    stopEvents: {
      ...stopEvents,
      [stopId]: {
        actionOrder: Object.keys(stopEvents).length + 1,
        recordedAt,
        status,
      },
    },
  }
}
