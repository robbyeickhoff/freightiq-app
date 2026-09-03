import zoneData from '../data/telluride-route-zones.v1.json' with { type: 'json' }
import { distanceToRingMeters, pointInRing } from './grand-junction-zone-geography.ts'
import { documentedOperationalZones, isValidMicroZonePair } from './zone-learning.ts'

export const TELLURIDE_ROUTE_GEOMETRY_REVISION = 'telluride-route-v1'
export const TELLURIDE_ROUTE_BOUNDARY_SAFETY_METERS = 75

type Position = [number, number]
type ZoneLevel = 'group' | 'micro' | 'operational' | 'parent'

type ZoneFeature = {
  geometry: { coordinates: Position[][]; type: 'Polygon' }
  id: string
  properties: {
    level: ZoneLevel
    name: string
    parent: string
    revision: string
    sourceFile: string
    sourceSha256: string
  }
  type: 'Feature'
}

type ZoneFeatureCollection = {
  features: ZoneFeature[]
  name: string
  type: 'FeatureCollection'
}

export type TellurideRoutePolygonDecision = {
  boundaryDistanceMeters: number | null
  microCandidates: string[]
  operationalCandidates: string[]
  proposedMicroZone: string | null
  proposedZone: string | null
  reason: string
  revision: string
}

const EXPECTED_SOURCE_SHA = new Map([
  ['FreightIQ - Downtown Telluride Route Zones.kmz', 'adb65d93e05a1d65ae9d57353cfed716af222b4b1966b8d22ed1dd6581954ce1'],
  ['FreightIQ - Mountain Village Zones.kmz', 'ea2bea4006d1790565b6ee77d91f93749a374cb56705ecf64b4d5741dc3e731f'],
  ['FreightIQ - PVilleSawpitWilson Mesa RanchRidgwayOuray Zones.kmz', '8e20eefa54ea059d99ba6476f70bf391e72a7d89680de082f1c6e8e9970b74be'],
])
const WESTERN_COLORADO_BOUNDS = { minLongitude: -110, maxLongitude: -107, minLatitude: 37, maxLatitude: 40 }
const operationalZoneNames = new Set<string>(documentedOperationalZones)
const zones = zoneData as ZoneFeatureCollection

function isFinitePosition(position: Position) {
  const [longitude, latitude] = position
  return Number.isFinite(longitude) && Number.isFinite(latitude) &&
    longitude >= WESTERN_COLORADO_BOUNDS.minLongitude &&
    longitude <= WESTERN_COLORADO_BOUNDS.maxLongitude &&
    latitude >= WESTERN_COLORADO_BOUNDS.minLatitude &&
    latitude <= WESTERN_COLORADO_BOUNDS.maxLatitude
}

function positionsEqual(left: Position, right: Position) {
  return left[0] === right[0] && left[1] === right[1]
}

export function validateTellurideRouteZoneData(collection: ZoneFeatureCollection = zones) {
  const errors: string[] = []
  const ids = new Set<string>()

  if (collection.type !== 'FeatureCollection') errors.push('The zone artifact is not a FeatureCollection.')
  for (const feature of collection.features) {
    if (!feature.id || ids.has(feature.id)) errors.push(`Duplicate or blank feature id: ${feature.id}`)
    ids.add(feature.id)
    if (feature.geometry.type !== 'Polygon') errors.push(`${feature.id} is not a Polygon.`)
    if (feature.properties.revision !== TELLURIDE_ROUTE_GEOMETRY_REVISION) {
      errors.push(`${feature.id} has the wrong geometry revision.`)
    }
    if (EXPECTED_SOURCE_SHA.get(feature.properties.sourceFile) !== feature.properties.sourceSha256) {
      errors.push(`${feature.id} has the wrong source checksum.`)
    }
    if (!['group', 'micro', 'operational', 'parent'].includes(feature.properties.level)) {
      errors.push(`${feature.id} has an invalid zone level.`)
    }
    if (feature.properties.level === 'micro' &&
      !isValidMicroZonePair(feature.properties.parent, feature.properties.name)) {
      errors.push(`${feature.id} has an invalid Parent/Micro Zone pair.`)
    }
    if (feature.properties.level === 'operational' && !operationalZoneNames.has(feature.properties.name)) {
      errors.push(`${feature.id} is not a documented operational zone.`)
    }
    if (feature.properties.level === 'parent' && !operationalZoneNames.has(feature.properties.parent)) {
      errors.push(`${feature.id} has an invalid parent.`)
    }
    const ring = feature.geometry.coordinates[0]
    if (!ring || ring.length < 4) errors.push(`${feature.id} has an invalid outer ring.`)
    else if (!positionsEqual(ring[0], ring[ring.length - 1])) errors.push(`${feature.id} is not closed.`)
    if (ring?.some((position) => !isFinitePosition(position))) {
      errors.push(`${feature.id} contains an invalid coordinate.`)
    }
  }

  return errors
}

function decision(
  values: Omit<TellurideRoutePolygonDecision, 'revision'>,
): TellurideRoutePolygonDecision {
  return { ...values, revision: TELLURIDE_ROUTE_GEOMETRY_REVISION }
}

export function classifyTellurideRoutePoint(
  longitude: number,
  latitude: number,
): TellurideRoutePolygonDecision {
  const point: Position = [longitude, latitude]
  if (!isFinitePosition(point)) return decision({
    boundaryDistanceMeters: null, microCandidates: [], operationalCandidates: [],
    proposedMicroZone: null, proposedZone: null,
    reason: 'The geocoded point is outside the supported Western Colorado extent.',
  })

  const containing = zones.features.filter((feature) =>
    pointInRing(point, feature.geometry.coordinates[0]))
  const micros = containing.filter((feature) => feature.properties.level === 'micro')
  const operational = containing.filter((feature) => feature.properties.level === 'operational')
  const parents = containing.filter((feature) => feature.properties.level === 'parent')
  const microCandidates = micros.map((feature) => feature.properties.name)
  const operationalCandidates = operational.map((feature) => feature.properties.name)
  const derivedZones = new Set([
    ...micros.map((feature) => feature.properties.parent),
    ...operationalCandidates,
  ])

  if (micros.length > 1 || operational.length > 1 || derivedZones.size > 1) return decision({
    boundaryDistanceMeters: null, microCandidates, operationalCandidates,
    proposedMicroZone: null, proposedZone: null,
    reason: 'The point overlaps incompatible Telluride-route operational polygons.',
  })

  const matched = micros[0] ?? operational[0]
  if (matched) {
    const proposedZone = matched.properties.level === 'micro'
      ? matched.properties.parent
      : matched.properties.name
    const proposedMicroZone = matched.properties.level === 'micro'
      ? matched.properties.name
      : null
    const relevant = [matched, ...parents.filter((parent) => parent.properties.parent === proposedZone)]
    const boundaryDistanceMeters = Math.min(...relevant.map((feature) =>
      distanceToRingMeters(point, feature.geometry.coordinates[0])))
    return decision({
      boundaryDistanceMeters, microCandidates, operationalCandidates,
      proposedMicroZone, proposedZone,
      reason: boundaryDistanceMeters < TELLURIDE_ROUTE_BOUNDARY_SAFETY_METERS
        ? `The point is within ${TELLURIDE_ROUTE_BOUNDARY_SAFETY_METERS} meters of a zone boundary.`
        : proposedMicroZone
          ? 'The point is inside one documented Telluride-route Micro Zone.'
          : 'The point is inside one documented Telluride-route operational zone.',
    })
  }

  if (parents.length === 1) {
    const parent = parents[0]
    const boundaryDistanceMeters = distanceToRingMeters(point, parent.geometry.coordinates[0])
    return decision({
      boundaryDistanceMeters, microCandidates, operationalCandidates,
      proposedMicroZone: null, proposedZone: parent.properties.parent,
      reason: `The point is inside ${parent.properties.parent}, but the Micro Zone remains uncertain.`,
    })
  }

  return decision({
    boundaryDistanceMeters: null, microCandidates, operationalCandidates,
    proposedMicroZone: null, proposedZone: null,
    reason: 'The point is outside every supported Telluride-route classification polygon.',
  })
}

export function tellurideRouteZoneFeatures() {
  return zones.features
}
