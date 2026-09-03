import assert from 'node:assert/strict'

import {
  classifyTellurideRoutePoint,
  tellurideRouteZoneFeatures,
  TELLURIDE_ROUTE_BOUNDARY_SAFETY_METERS,
  validateTellurideRouteZoneData,
} from '../src/lib/telluride-route-zone-geography.ts'
import {
  geocodeTellurideRouteStops,
  isTellurideRouteGeocodingCandidate,
} from '../src/lib/mapbox-geocoding.ts'

const features = tellurideRouteZoneFeatures()
assert.deepEqual(validateTellurideRouteZoneData(), [])
assert.equal(features.length, 23)
assert.equal(features.filter((feature) => feature.properties.level === 'operational').length, 9)
assert.equal(features.filter((feature) => feature.properties.level === 'parent').length, 2)
assert.equal(features.filter((feature) => feature.properties.level === 'micro').length, 11)
assert.equal(features.filter((feature) => feature.properties.level === 'group').length, 1)

function matchingInteriorPoint(
  feature: (typeof features)[number],
  proposedZone: string,
  proposedMicroZone: string | null,
) {
  const ring = feature.geometry.coordinates[0]
  const longitudes = ring.map((position) => position[0])
  const latitudes = ring.map((position) => position[1])
  const [minimumLongitude, maximumLongitude] = [Math.min(...longitudes), Math.max(...longitudes)]
  const [minimumLatitude, maximumLatitude] = [Math.min(...latitudes), Math.max(...latitudes)]
  for (let row = 1; row < 40; row += 1) {
    for (let column = 1; column < 40; column += 1) {
      const point = [
        minimumLongitude + (maximumLongitude - minimumLongitude) * column / 40,
        minimumLatitude + (maximumLatitude - minimumLatitude) * row / 40,
      ] as const
      const decision = classifyTellurideRoutePoint(point[0], point[1])
      if (decision.proposedZone === proposedZone &&
        decision.proposedMicroZone === proposedMicroZone) return point
    }
  }
  throw new Error(`No unambiguous interior test point was found for ${feature.id}.`)
}

for (const feature of features.filter((item) => item.properties.level === 'micro')) {
  const [longitude, latitude] = matchingInteriorPoint(
    feature, feature.properties.parent, feature.properties.name,
  )
  const decision = classifyTellurideRoutePoint(longitude, latitude)
  assert.equal(decision.proposedZone, feature.properties.parent, `${feature.id} interior parent`)
  assert.equal(decision.proposedMicroZone, feature.properties.name, `${feature.id} interior Micro Zone`)
}

for (const feature of features.filter((item) => item.properties.level === 'operational')) {
  const [longitude, latitude] = matchingInteriorPoint(
    feature, feature.properties.name, null,
  )
  const decision = classifyTellurideRoutePoint(longitude, latitude)
  assert.equal(decision.proposedZone, feature.properties.name, `${feature.id} operational interior`)
  assert.equal(decision.proposedMicroZone, null, `${feature.id} has no Micro Zone`)
}

const ophir = features.find((feature) => feature.properties.name === 'Ophir')
assert.ok(ophir)
const [ophirLongitude, ophirLatitude] = matchingInteriorPoint(ophir, 'Mountain Village', 'Ophir')
const ophirDecision = classifyTellurideRoutePoint(ophirLongitude, ophirLatitude)
assert.equal(ophirDecision.proposedZone, 'Mountain Village')
assert.equal(ophirDecision.proposedMicroZone, 'Ophir')

const skiRanchSouth = features.find((feature) => feature.properties.name === 'Ski Ranch South')
assert.ok(skiRanchSouth)
const skiBoundary = skiRanchSouth.geometry.coordinates[0][0]
const boundaryDecision = classifyTellurideRoutePoint(skiBoundary[0], skiBoundary[1])
assert.ok(boundaryDecision.boundaryDistanceMeters === null ||
  boundaryDecision.boundaryDistanceMeters < TELLURIDE_ROUTE_BOUNDARY_SAFETY_METERS)

const outsideDecision = classifyTellurideRoutePoint(-108.3, 38.5)
assert.equal(outsideDecision.proposedZone, null)

const tellurideStop = {
  address: '230 South Fir Street', city: 'Telluride', id: 'telluride-stop',
  postalCode: '81435', state: 'CO',
}
assert.equal(isTellurideRouteGeocodingCandidate(tellurideStop), true)
assert.equal(isTellurideRouteGeocodingCandidate({ ...tellurideStop, city: 'Montrose' }), false)

let requestedBody = ''
const geocoded = await geocodeTellurideRouteStops(
  [tellurideStop],
  'server-only-token',
  async (_input, init) => {
    requestedBody = String(init?.body)
    return new Response(JSON.stringify({ batch: [{ features: [{
      geometry: { coordinates: [-107.81, 37.94], type: 'Point' },
      properties: {
        context: { region: { name: 'Colorado', region_code: 'US-CO' } },
        coordinates: { accuracy: 'rooftop', latitude: 37.94, longitude: -107.81 },
        feature_type: 'address',
        full_address: '230 South Fir Street, Telluride, Colorado 81435',
        match_code: { address_number: 'matched', confidence: 'exact', region: 'matched' },
      },
    }] }] }), { status: 200 })
  },
)
assert.match(requestedBody, /230 South Fir Street/)
assert.match(requestedBody, /-108\.1,37\.75,-107\.55,38\.4/)
assert.equal(geocoded.get(tellurideStop.id)?.status, 'accepted')

console.log('Telluride-route geocoding and polygon checks passed.')
