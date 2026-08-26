export function sameStopOrder(first: string[], second: string[]) {
  return first.length === second.length &&
    first.every((stopId, index) => stopId === second[index])
}

export function moveStopToPosition(stopIds: string[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= stopIds.length ||
    toIndex >= stopIds.length
  ) return stopIds

  const next = [...stopIds]
  const [movedStopId] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, movedStopId)
  return next
}

export type IntentionalStopChange = {
  afterPosition: number
  beforePosition: number
  stopId: string
}

export function findIntentionalStopChanges(
  originalStopIds: string[],
  adjustedStopIds: string[],
  movedStopIds: string[],
) {
  const seen = new Set<string>()

  return movedStopIds.reduce<IntentionalStopChange[]>((changes, stopId) => {
    if (seen.has(stopId)) return changes
    seen.add(stopId)

    const beforeIndex = originalStopIds.indexOf(stopId)
    const afterIndex = adjustedStopIds.indexOf(stopId)
    if (beforeIndex < 0 || afterIndex < 0 || beforeIndex === afterIndex) return changes

    changes.push({
      afterPosition: afterIndex + 1,
      beforePosition: beforeIndex + 1,
      stopId,
    })
    return changes
  }, [])
}
