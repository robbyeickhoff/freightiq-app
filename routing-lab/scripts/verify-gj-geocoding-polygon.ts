import assert from 'node:assert/strict'

import {
  GRAND_JUNCTION_BOUNDARY_SAFETY_METERS,
  classifyGrandJunctionPoint,
  grandJunctionZoneFeatures,
  validateGrandJunctionZoneData,
} from '../src/lib/grand-junction-zone-geography.ts'
import {
  geocodeGrandJunctionStops,
  isGrandJunctionGeocodingCandidate,
  parseMapboxGeocodingResponse,
  physicalStreetAddress,
} from '../src/lib/mapbox-geocoding.ts'

const features = grandJunctionZoneFeatures()
assert.deepEqual(validateGrandJunctionZoneData(), [])
assert.equal(features.filter((feature) => feature.properties.level === 'parent').length, 6)
assert.equal(features.filter((feature) => feature.properties.level === 'micro').length, 19)

function polygonCentroid(ring: [number, number][]) {
  let area = 0
  let longitude = 0
  let latitude = 0
  for (let index = 0; index < ring.length - 1; index += 1) {
    const cross = ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1]
    area += cross
    longitude += (ring[index][0] + ring[index + 1][0]) * cross
    latitude += (ring[index][1] + ring[index + 1][1]) * cross
  }
  return [longitude / (3 * area), latitude / (3 * area)] as const
}

for (const feature of features.filter((item) => item.properties.level === 'micro')) {
  const [longitude, latitude] = polygonCentroid(feature.geometry.coordinates[0])
  const decision = classifyGrandJunctionPoint(longitude, latitude)
  assert.equal(decision.proposedZone, feature.properties.parent, `${feature.id} parent centroid`)
  assert.equal(decision.proposedMicroZone, feature.properties.name, `${feature.id} micro centroid`)
}

const westA = features.find((feature) => feature.properties.name === 'West A')
assert.ok(westA)
const boundaryPoint = westA.geometry.coordinates[0][0]
const boundaryDecision = classifyGrandJunctionPoint(boundaryPoint[0], boundaryPoint[1])
assert.ok(boundaryDecision.boundaryDistanceMeters === null ||
  boundaryDecision.boundaryDistanceMeters < GRAND_JUNCTION_BOUNDARY_SAFETY_METERS)
const outsideDecision = classifyGrandJunctionPoint(-107.5, 38.5)
assert.equal(outsideDecision.proposedZone, null)

const ligraniDecision = classifyGrandJunctionPoint(-108.582078, 39.078795)
assert.equal(ligraniDecision.revision, 'gj-v2')
assert.equal(ligraniDecision.proposedZone, 'Downtown / The Hole')
assert.equal(ligraniDecision.proposedMicroZone, 'Hole A')
assert.ok(ligraniDecision.boundaryDistanceMeters !== null)
assert.ok(ligraniDecision.boundaryDistanceMeters < GRAND_JUNCTION_BOUNDARY_SAFETY_METERS)
assert.match(ligraniDecision.reason, /within 75 meters of a zone boundary/)

const stop = {
  address: '826 N Crest Dr Unit C', city: 'Grand Junction', id: 'stop-1',
  postalCode: '81506', state: 'CO',
}
assert.equal(isGrandJunctionGeocodingCandidate(stop), true)
assert.equal(isGrandJunctionGeocodingCandidate({ ...stop, city: 'Telluride' }), false)

const accepted = parseMapboxGeocodingResponse(stop, {
  features: [{
    geometry: { coordinates: [-108.55, 39.12], type: 'Point' },
    properties: {
      context: { region: { name: 'Colorado', region_code: 'US-CO' } },
      coordinates: { accuracy: 'rooftop', latitude: 39.12, longitude: -108.55 },
      feature_type: 'address',
      full_address: '826 N Crest Dr, Grand Junction, Colorado 81506',
      match_code: { address_number: 'matched', confidence: 'exact', region: 'matched' },
    },
  }],
}, '2026-09-01T00:00:00.000Z')
assert.equal(accepted.status, 'accepted')
assert.deepEqual(accepted.coordinates, { latitude: 39.12, longitude: -108.55 })
assert.deepEqual(accepted.originalInput, stop)

for (const [input, expected] of [
  ['STE 20, 710 Wellington Avenue', '710 Wellington Avenue'],
  ['STE 2232, 2635 N 7th Street', '2635 N 7th Street'],
  ['Unit #111B, 2454 Highway 6 and 50', '2454 Highway 6 and 50'],
  ['826 N Crest Dr Unit C', '826 N Crest Dr Unit C'],
] as const) assert.equal(physicalStreetAddress(input), expected)

const suiteStop = {
  address: 'STE 20, 710 Wellington Avenue', city: 'Grand Junction', id: 'suite-stop',
  postalCode: '81501', state: 'CO',
}
const acceptedSuite = parseMapboxGeocodingResponse(suiteStop, {
  features: [{
    geometry: { coordinates: [-108.57, 39.08], type: 'Point' },
    properties: {
      context: { region: { name: 'Colorado', region_code: 'US-CO' } },
      coordinates: { accuracy: 'rooftop', latitude: 39.08, longitude: -108.57 },
      feature_type: 'address',
      full_address: '710 Wellington Ave, Grand Junction, Colorado 81501',
      match_code: { address_number: 'matched', confidence: 'exact', region: 'matched' },
    },
  }],
}, '2026-09-01T00:00:00.000Z')
assert.equal(acceptedSuite.status, 'accepted')
assert.deepEqual(acceptedSuite.originalInput, suiteStop)

for (const [description, response] of [
  ['house-number correction', {
    features: [{ geometry: { coordinates: [-108.55, 39.12] }, properties: {
      context: { region: { region_code: 'US-CO' } },
      coordinates: { accuracy: 'rooftop', latitude: 39.12, longitude: -108.55 },
      feature_type: 'address', full_address: '828 N Crest Dr, Grand Junction, Colorado',
      match_code: { address_number: 'unmatched', confidence: 'low', region: 'matched' },
    } }],
  }],
  ['broad street result', {
    features: [{ geometry: { coordinates: [-108.55, 39.12] }, properties: {
      context: { region: { region_code: 'US-CO' } }, coordinates: { accuracy: 'point' },
      feature_type: 'street', full_address: 'N Crest Dr, Grand Junction, Colorado',
      match_code: { confidence: 'exact', region: 'matched' },
    } }],
  }],
  ['wrong state', {
    features: [{ geometry: { coordinates: [-111.89, 40.76] }, properties: {
      context: { region: { name: 'Utah', region_code: 'US-UT' } },
      coordinates: { accuracy: 'rooftop', latitude: 40.76, longitude: -111.89 },
      feature_type: 'address', full_address: '826 N Crest Dr, Salt Lake City, Utah',
      match_code: { address_number: 'matched', confidence: 'exact', region: 'unmatched' },
    } }],
  }],
] as const) {
  const result = parseMapboxGeocodingResponse(stop, response, '2026-09-01T00:00:00.000Z')
  assert.equal(result.status, 'rejected', description)
  assert.equal(result.coordinates, null, description)
}

let requestedUrl = ''
let requestedBody = ''
const geocoded = await geocodeGrandJunctionStops([stop], 'server-only-token', async (input, init) => {
  requestedUrl = String(input)
  requestedBody = String(init?.body)
  return new Response(JSON.stringify({ batch: [{
    features: [{ geometry: { coordinates: [-108.55, 39.12] }, properties: {
      context: { region: { region_code: 'US-CO' } },
      coordinates: { accuracy: 'point', latitude: 39.12, longitude: -108.55 },
      feature_type: 'address', full_address: '826 N Crest Dr, Grand Junction, Colorado',
      match_code: { address_number: 'matched', confidence: 'high', region: 'matched' },
    } }],
  }] }), { status: 200 })
})
assert.match(requestedUrl, /permanent=true/)
assert.match(requestedUrl, /access_token=server-only-token/)
assert.match(requestedBody, /"types":\["address"\]/)
assert.equal(geocoded.get(stop.id)?.status, 'accepted')

let suiteRequestedBody = ''
await geocodeGrandJunctionStops([suiteStop], 'server-only-token', async (_input, init) => {
  suiteRequestedBody = String(init?.body)
  return new Response(JSON.stringify({ batch: [{ features: [] }] }), { status: 200 })
})
assert.match(suiteRequestedBody, /710 Wellington Avenue/)
assert.doesNotMatch(suiteRequestedBody, /STE 20/)

const unavailable = await geocodeGrandJunctionStops([stop], '', async () => {
  throw new Error('The provider must not be called without a token.')
})
assert.equal(unavailable.get(stop.id)?.status, 'unavailable')
assert.deepEqual(unavailable.get(stop.id)?.originalInput, stop)

console.log('Grand Junction geocoding and polygon checks passed.')
