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

export const grandJunctionMicroZones = {
  Fruita: ['Fruita A', 'Fruita B', 'Fruita C'],
  West: ['West A', 'West B', 'West C'],
  'River Road': ['River Road A', 'River Road B'],
  Airport: ['Airport A', 'Airport B', 'Airport C'],
  'Downtown / The Hole': ['Hole A', 'Hole B', 'Hole C', 'Hole D', 'Hole E'],
  East: ['East A', 'East B', 'East C'],
} as const satisfies Record<GrandJunctionParentZone, readonly string[]>

export const tellurideMicroZones = {
  'Mountain Village': [
    'Ophir',
    'Ski Ranch South',
    'Ski Ranch North',
    'Mountain Village West',
    'Benchmark',
    'San Joaquin',
    'Mountain Village East',
    'Mountain Village North',
  ],
  'Downtown Telluride': ['Zone 1 South', 'Zone 2 East', 'Zone 3 Central / North'],
} as const

export const microZonesByParent = {
  ...grandJunctionMicroZones,
  ...tellurideMicroZones,
} as const

export type MicroZoneParent = keyof typeof microZonesByParent
export type MicroZone = (typeof microZonesByParent)[MicroZoneParent][number]

export function microZonesForParent(parentZone: string) {
  return isMicroZoneParent(parentZone) ? microZonesByParent[parentZone] : []
}

export function isValidMicroZonePair(parentZone: string, microZone: string) {
  return microZonesForParent(parentZone).includes(microZone as never)
}

export type ZoneEvidence = {
  addressKey: string
  approvedMicroZone?: string | null
  approvedZone: string
  sourceRouteId: string
}

export type LearnedZoneResolution = {
  confidence: 'high' | 'medium' | 'uncertain'
  evidence: string
  proposedMicroZone: MicroZone | null
  proposedZone: MicroZoneParent | null
}

export function isMicroZoneParent(value: string): value is MicroZoneParent {
  return Object.prototype.hasOwnProperty.call(microZonesByParent, value)
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
    if (!isMicroZoneParent(item.approvedZone)) continue
    const routes = routesByZone.get(item.approvedZone) ?? new Set<string>()
    routes.add(item.sourceRouteId)
    routesByZone.set(item.approvedZone, routes)
  }

  if (routesByZone.size === 0) return null
  if (routesByZone.size > 1) {
    return {
      confidence: 'uncertain',
      evidence: 'Prior driver-approved exact-address reviews conflict and need current review.',
      proposedMicroZone: null,
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
    proposedMicroZone: null,
    proposedZone: zone as MicroZoneParent,
  }
}

export function resolveLearnedMicroZone(evidence: ZoneEvidence[]): LearnedZoneResolution | null {
  const parentResolution = resolveLearnedZone(evidence)
  if (!parentResolution || !parentResolution.proposedZone) return parentResolution
  const validEvidence = evidence.filter((item) =>
    item.approvedZone === parentResolution.proposedZone && item.approvedMicroZone &&
      isValidMicroZonePair(item.approvedZone, item.approvedMicroZone),
  )
  if (validEvidence.length === 0) return parentResolution

  const routesByPair = new Map<string, Set<string>>()
  for (const item of validEvidence) {
    const key = `${item.approvedZone}|${item.approvedMicroZone}`
    const routes = routesByPair.get(key) ?? new Set<string>()
    routes.add(item.sourceRouteId)
    routesByPair.set(key, routes)
  }
  if (routesByPair.size > 1) {
    return {
      confidence: 'uncertain',
      evidence: 'Prior driver-approved exact-address Micro Zone reviews conflict and need current review.',
      proposedMicroZone: null,
      proposedZone: null,
    }
  }

  const [[pair, routes]] = routesByPair.entries()
  const [parentZone, microZone] = pair.split('|') as [MicroZoneParent, MicroZone]
  const count = routes.size
  return {
    confidence: count >= 2 ? 'high' : 'medium',
    evidence: count >= 2
      ? `${count} prior driver-approved exact-address reviews agree on ${parentZone} · ${microZone}.`
      : `One prior driver-approved exact-address review assigned this stop to ${parentZone} · ${microZone}.`,
    proposedMicroZone: microZone,
    proposedZone: parentZone,
  }
}
