export const grandJunctionParentZones = [
  'Fruita',
  'West',
  'River Road',
  'Airport',
  'Downtown / The Hole',
  'East',
] as const

export const legacyOperationalZoneNames = {
  'Ridgway — North of Highway 62': 'Ridgway North',
} as const

export const documentedOperationalZones = [
  'Grand Junction',
  ...grandJunctionParentZones,
  'Delta',
  'Olathe',
  'Montrose',
  'Ridgway North',
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

export function normalizeOperationalZoneName(value: string) {
  return legacyOperationalZoneNames[value as keyof typeof legacyOperationalZoneNames] ?? value
}

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

const stateAbbreviations: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca', colorado: 'co',
  connecticut: 'ct', delaware: 'de', florida: 'fl', georgia: 'ga', hawaii: 'hi', idaho: 'id',
  illinois: 'il', indiana: 'in', iowa: 'ia', kansas: 'ks', kentucky: 'ky', louisiana: 'la',
  maine: 'me', maryland: 'md', massachusetts: 'ma', michigan: 'mi', minnesota: 'mn',
  mississippi: 'ms', missouri: 'mo', montana: 'mt', nebraska: 'ne', nevada: 'nv',
  'new hampshire': 'nh', 'new jersey': 'nj', 'new mexico': 'nm', 'new york': 'ny',
  'north carolina': 'nc', 'north dakota': 'nd', ohio: 'oh', oklahoma: 'ok', oregon: 'or',
  pennsylvania: 'pa', 'rhode island': 'ri', 'south carolina': 'sc', 'south dakota': 'sd',
  tennessee: 'tn', texas: 'tx', utah: 'ut', vermont: 'vt', virginia: 'va', washington: 'wa',
  'west virginia': 'wv', wisconsin: 'wi', wyoming: 'wy',
}

const streetTokenAliases: Record<string, string> = {
  alley: 'aly', avenue: 'ave', boulevard: 'blvd', circle: 'cir', court: 'ct', drive: 'dr',
  expressway: 'expy', freeway: 'fwy', lane: 'ln', parkway: 'pkwy', place: 'pl', road: 'rd',
  square: 'sq', street: 'st', terrace: 'ter', trail: 'trl',
  north: 'n', south: 's', east: 'e', west: 'w', northeast: 'ne', northwest: 'nw',
  southeast: 'se', southwest: 'sw',
}

function normalizeStreetAddress(value: string) {
  const withoutSecondary = value
    .toLocaleLowerCase('en-US')
    .replace(/\s+(?:apt|apartment|bldg|building|dept|department|floor|fl|hangar|lot|room|rm|ste|suite|trailer|unit)\b[\s#.:,-]*.*$/iu, '')
    .replace(/\s+#\s*[\p{L}\p{N}-]+.*$/iu, '')
  const normalizedHighway = withoutSecondary
    .replace(/\b(?:united states|u\.?\s*s\.?)\s+(?:highway|hwy|route|rte)\b/giu, 'us')
    .replace(/\b(?:state|st)\s+(?:highway|hwy|route|rte)\b/giu, 'state')
    .replace(/\b(?:county|co)\s+(?:road|rd|route|rte)\b/giu, 'county rd')
    .replace(/\b(?:highway|hwy)\b/giu, 'hwy')
  return normalizedHighway
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/u)
    .map((token) => streetTokenAliases[token] ?? token)
    .join(' ')
}

export function buildCanonicalPhysicalAddressKey(stop: {
  address: string
  city: string
  postalCode: string
  state: string
}) {
  const state = normalizeAddressComponent(stop.state).replace(/[^a-z]/g, '')
  const postalCode = stop.postalCode.match(/\b\d{5}\b/u)?.[0] ?? normalizeAddressComponent(stop.postalCode)
  return [
    normalizeStreetAddress(stop.address),
    normalizeAddressComponent(stop.city).replace(/[^\p{L}\p{N}]+/gu, ' ').trim(),
    stateAbbreviations[normalizeAddressComponent(stop.state)] ?? state,
    postalCode,
  ].join('|')
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

export function resolveLearnedAddressEvidence(
  exactEvidence: ZoneEvidence[],
  canonicalEvidence: ZoneEvidence[],
) {
  return resolveLearnedMicroZone(exactEvidence) ?? resolveLearnedMicroZone(canonicalEvidence)
}
