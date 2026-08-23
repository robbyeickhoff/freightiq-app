export const grandJunctionParentZones = [
  'Fruita',
  'West',
  'River Road',
  'Airport',
  'Downtown / The Hole',
  'East',
] as const

export const documentedOperationalZones = [
  'Grand Junction',
  ...grandJunctionParentZones,
  'Delta',
  'Olathe',
  'Montrose',
  'Ridgway — North of Highway 62',
  'Ouray',
  'Ridgway Proper',
  'Log Hill',
  'Placerville / Sawpit',
  'Wilson Mesa Ranch Zone',
  'South Park',
  'Lawson Hill / Society',
  'Mountain Village',
  'Downtown Telluride',
  'Airport / Aldasoro',
  'Norwood',
  'Nucla / Naturita',
  'Gateway',
] as const

export const selectableOperationalZones = documentedOperationalZones.filter(
  (zone) => zone !== 'Grand Junction',
)

export type GrandJunctionParentZone = (typeof grandJunctionParentZones)[number]
export type DocumentedOperationalZone = (typeof documentedOperationalZones)[number]

export type ZoneEvidence = {
  addressKey: string
  approvedZone: string
  sourceRouteId: string
}

export type LearnedZoneResolution = {
  confidence: 'high' | 'medium' | 'uncertain'
  evidence: string
  proposedZone: GrandJunctionParentZone | null
}

export function isGrandJunctionParentZone(value: string): value is GrandJunctionParentZone {
  return grandJunctionParentZones.includes(value as GrandJunctionParentZone)
}

export function normalizeAddressComponent(value: string) {
  return value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

export function buildAddressKey(stop: {
  address: string
  city: string
  postalCode: string
  state: string
}) {
  return [stop.address, stop.city, stop.state, stop.postalCode]
    .map(normalizeAddressComponent)
    .join('|')
}

export function resolveLearnedZone(evidence: ZoneEvidence[]): LearnedZoneResolution | null {
  if (evidence.length === 0) return null

  const routesByZone = new Map<string, Set<string>>()
  for (const item of evidence) {
    if (!isGrandJunctionParentZone(item.approvedZone)) continue
    const routes = routesByZone.get(item.approvedZone) ?? new Set<string>()
    routes.add(item.sourceRouteId)
    routesByZone.set(item.approvedZone, routes)
  }

  if (routesByZone.size === 0) return null
  if (routesByZone.size > 1) {
    return {
      confidence: 'uncertain',
      evidence: 'Prior driver-approved exact-address reviews conflict and need current review.',
      proposedZone: null,
    }
  }

  const [[zone, routes]] = routesByZone.entries()
  const count = routes.size
  return {
    confidence: count >= 2 ? 'high' : 'medium',
    evidence: count >= 2
      ? `${count} prior driver-approved exact-address reviews agree on ${zone}.`
      : `One prior driver-approved exact-address review assigned this stop to ${zone}.`,
    proposedZone: zone as GrandJunctionParentZone,
  }
}
