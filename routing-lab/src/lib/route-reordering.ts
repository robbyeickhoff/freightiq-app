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
