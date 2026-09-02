import zoneData from '../data/grand-junction-zones.v2.json' with { type: 'json' }
import { isValidMicroZonePair } from './zone-learning.ts'

export const GRAND_JUNCTION_GEOMETRY_REVISION = 'gj-v2'
export const GRAND_JUNCTION_BOUNDARY_SAFETY_METERS = 75

type Position = [number, number]
type ZoneLevel = 'parent' | 'micro'

type ZoneFeature = {
  geometry: { coordinates: Position[][]; type: 'Polygon' }
  id: string
  properties: {
    level: ZoneLevel
    name: string
    parent: string
    revision: string
    sourceSha256: string
  }
  type: 'Feature'
}

type ZoneFeatureCollection = {
  features: ZoneFeature[]
  name: string
  type: 'FeatureCollection'
}

export type GrandJunctionPolygonDecision = {
  boundaryDistanceMeters: number | null
  microCandidates: string[]
  parentCandidates: string[]
  proposedMicroZone: string | null
  proposedZone: string | null
  reason: string
  revision: string
}

const EXPECTED_SOURCE_SHA = 'c2903ea51481b3d163de8ac94af01a2172d7283dece50866837956f208ac90cc'
const WESTERN_COLORADO_BOUNDS = { minLongitude: -110, maxLongitude: -107, minLatitude: 37, maxLatitude: 40 }
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

export function validateGrandJunctionZoneData(collection: ZoneFeatureCollection = zones) {
  const errors: string[] = []
  const ids = new Set<string>()

  if (collection.type !== 'FeatureCollection') errors.push('The zone artifact is not a FeatureCollection.')
  for (const feature of collection.features) {
    if (!feature.id || ids.has(feature.id)) errors.push(`Duplicate or blank feature id: ${feature.id}`)
    ids.add(feature.id)
    if (feature.geometry.type !== 'Polygon') errors.push(`${feature.id} is not a Polygon.`)
    if (feature.properties.revision !== GRAND_JUNCTION_GEOMETRY_REVISION) {
      errors.push(`${feature.id} has the wrong geometry revision.`)
    }
    if (feature.properties.sourceSha256 !== EXPECTED_SOURCE_SHA) {
      errors.push(`${feature.id} has the wrong source checksum.`)
    }
    if (feature.properties.level !== 'parent' && feature.properties.level !== 'micro') {
      errors.push(`${feature.id} has an invalid zone level.`)
    }
    if (feature.properties.level === 'micro' &&
      !isValidMicroZonePair(feature.properties.parent, feature.properties.name)) {
      errors.push(`${feature.id} has an invalid Parent/Micro Zone pair.`)
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

function pointOnSegment(point: Position, start: Position, end: Position) {
  const lengthSquared = (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2
  if (lengthSquared === 0) return positionsEqual(point, start)
  const cross = (point[1] - start[1]) * (end[0] - start[0]) -
    (point[0] - start[0]) * (end[1] - start[1])
  if (Math.abs(cross) > 1e-10) return false
  const dot = (point[0] - start[0]) * (end[0] - start[0]) +
    (point[1] - start[1]) * (end[1] - start[1])
  if (dot < 0) return false
  return dot <= lengthSquared
}

export function pointInRing(point: Position, ring: Position[]) {
  let inside = false
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const start = ring[previous]
    const end = ring[current]
    if (pointOnSegment(point, start, end)) return true
    const crosses = (end[1] > point[1]) !== (start[1] > point[1]) &&
      point[0] < ((start[0] - end[0]) * (point[1] - end[1])) / (start[1] - end[1]) + end[0]
    if (crosses) inside = !inside
  }
  return inside
}

function projectMeters(position: Position, referenceLatitude: number): Position {
  const radians = Math.PI / 180
  return [
    position[0] * 111_320 * Math.cos(referenceLatitude * radians),
    position[1] * 110_540,
  ]
}

function distanceToSegmentMeters(point: Position, start: Position, end: Position) {
  const projectedPoint = projectMeters(point, point[1])
  const projectedStart = projectMeters(start, point[1])
  const projectedEnd = projectMeters(end, point[1])
  const dx = projectedEnd[0] - projectedStart[0]
  const dy = projectedEnd[1] - projectedStart[1]
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return Math.hypot(
    projectedPoint[0] - projectedStart[0], projectedPoint[1] - projectedStart[1],
  )
  const fraction = Math.max(0, Math.min(1,
    ((projectedPoint[0] - projectedStart[0]) * dx +
      (projectedPoint[1] - projectedStart[1]) * dy) / lengthSquared,
  ))
  const closestX = projectedStart[0] + fraction * dx
  const closestY = projectedStart[1] + fraction * dy
  return Math.hypot(projectedPoint[0] - closestX, projectedPoint[1] - closestY)
}

export function distanceToRingMeters(point: Position, ring: Position[]) {
  let minimum = Number.POSITIVE_INFINITY
  for (let index = 1; index < ring.length; index += 1) {
    minimum = Math.min(minimum, distanceToSegmentMeters(point, ring[index - 1], ring[index]))
  }
  return minimum
}

export function classifyGrandJunctionPoint(longitude: number, latitude: number): GrandJunctionPolygonDecision {
  const point: Position = [longitude, latitude]
  if (!isFinitePosition(point)) {
    return {
      boundaryDistanceMeters: null, microCandidates: [], parentCandidates: [],
      proposedMicroZone: null, proposedZone: null,
      reason: 'The geocoded point is outside the supported Western Colorado extent.',
      revision: GRAND_JUNCTION_GEOMETRY_REVISION,
    }
  }

  const containing = zones.features.filter((feature) => pointInRing(point, feature.geometry.coordinates[0]))
  const parents = containing.filter((feature) => feature.properties.level === 'parent')
  const micros = containing.filter((feature) => feature.properties.level === 'micro')
  const parentCandidates = parents.map((feature) => feature.properties.name)
  const microCandidates = micros.map((feature) => feature.properties.name)
  if (parents.length !== 1) {
    return {
      boundaryDistanceMeters: null, microCandidates, parentCandidates,
      proposedMicroZone: null, proposedZone: null,
      reason: parents.length === 0
        ? 'The point is outside every Grand Junction Parent Zone.'
        : 'The point overlaps multiple Grand Junction Parent Zones.',
      revision: GRAND_JUNCTION_GEOMETRY_REVISION,
    }
  }

  const parent = parents[0]
  const matchingMicros = micros.filter((feature) => feature.properties.parent === parent.properties.name)
  const wrongParentMicros = micros.filter((feature) => feature.properties.parent !== parent.properties.name)
  if (wrongParentMicros.length > 0) {
    return {
      boundaryDistanceMeters: null, microCandidates, parentCandidates,
      proposedMicroZone: null, proposedZone: null,
      reason: 'The point creates an incompatible Parent/Micro Zone geometry match.',
      revision: GRAND_JUNCTION_GEOMETRY_REVISION,
    }
  }

  const relevant = [parent, ...matchingMicros]
  const boundaryDistanceMeters = Math.min(...relevant.map((feature) =>
    distanceToRingMeters(point, feature.geometry.coordinates[0]),
  ))
  if (matchingMicros.length !== 1) {
    return {
      boundaryDistanceMeters, microCandidates, parentCandidates,
      proposedMicroZone: null, proposedZone: parent.properties.name,
      reason: matchingMicros.length === 0
        ? 'The point has one Parent Zone but no matching Micro Zone.'
        : 'The point overlaps multiple Micro Zones under the same Parent Zone.',
      revision: GRAND_JUNCTION_GEOMETRY_REVISION,
    }
  }

  return {
    boundaryDistanceMeters,
    microCandidates,
    parentCandidates,
    proposedMicroZone: matchingMicros[0].properties.name,
    proposedZone: parent.properties.name,
    reason: boundaryDistanceMeters < GRAND_JUNCTION_BOUNDARY_SAFETY_METERS
      ? `The point is within ${GRAND_JUNCTION_BOUNDARY_SAFETY_METERS} meters of a zone boundary.`
      : 'The point is inside one matching Grand Junction Parent and Micro Zone.',
    revision: GRAND_JUNCTION_GEOMETRY_REVISION,
  }
}

export function grandJunctionZoneFeatures() {
  return zones.features
}
