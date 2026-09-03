export type PolygonDecisionAudit = {
  boundaryDistanceMeters: number | null
  proposedMicroZone: string | null
  proposedZone: string | null
  reason: string
  revision: string
}

export type GeocodingAudit = {
  attemptedAt: string
  coordinates: { latitude: number; longitude: number } | null
  featureType: string | null
  geometryRevision: string | null
  matchCode: Record<string, string>
  matchConfidence: string | null
  originalInput: GeocodingInputStop
  pointAccuracy: string | null
  polygonDecision: PolygonDecisionAudit | null
  provider: 'mapbox-geocoding-v6'
  reason: string
  standardizedLabel: string | null
  status: 'accepted' | 'rejected' | 'unavailable'
}

export type GeocodingInputStop = {
  address: string
  city: string
  id: string
  postalCode: string
  state: string
}

type MapboxFeature = {
  geometry?: { coordinates?: unknown; type?: unknown }
  properties?: Record<string, unknown>
  type?: unknown
}

const GRAND_JUNCTION_CITIES = new Set([
  'clifton', 'fruita', 'grand junction', 'loma', 'mack', 'palisade',
])
const TELLURIDE_ROUTE_CITIES = new Set([
  'mountain village', 'ophir', 'ouray', 'placerville', 'ridgway', 'telluride',
])
const MATCH_CONFIDENCE = new Set(['exact', 'high', 'medium', 'low'])
const POINT_ACCURACY = new Set(['rooftop', 'parcel', 'point', 'interpolated', 'approximate'])
const MAPBOX_BATCH_URL = 'https://api.mapbox.com/search/geocode/v6/batch'

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

const LEADING_SECONDARY_ADDRESS = /^\s*(?:apt|apartment|bldg|building|dept|department|floor|fl|hangar|lot|room|rm|ste|suite|trailer|unit)\b[^,]*,\s*/iu

export function physicalStreetAddress(value: string) {
  return value.replace(LEADING_SECONDARY_ADDRESS, '').trim()
}

function houseNumber(value: string) {
  return physicalStreetAddress(value).match(/^\d+[a-z]?\b/i)?.[0]?.toLowerCase() ?? null
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function unavailable(
  stop: GeocodingInputStop,
  reason: string,
  attemptedAt: string,
): GeocodingAudit {
  return {
    attemptedAt, coordinates: null, featureType: null, geometryRevision: null,
    matchCode: {}, matchConfidence: null, pointAccuracy: null, polygonDecision: null,
    originalInput: { ...stop }, provider: 'mapbox-geocoding-v6', reason,
    standardizedLabel: null, status: 'unavailable',
  }
}

export function isGrandJunctionGeocodingCandidate(stop: GeocodingInputStop) {
  return normalize(stop.state) === 'co' || normalize(stop.state) === 'colorado'
    ? GRAND_JUNCTION_CITIES.has(normalize(stop.city))
    : false
}

export function isTellurideRouteGeocodingCandidate(stop: GeocodingInputStop) {
  return normalize(stop.state) === 'co' || normalize(stop.state) === 'colorado'
    ? TELLURIDE_ROUTE_CITIES.has(normalize(stop.city))
    : false
}

export function parseMapboxGeocodingResponse(
  stop: GeocodingInputStop,
  value: unknown,
  attemptedAt: string,
): GeocodingAudit {
  const features = value && typeof value === 'object' && Array.isArray((value as { features?: unknown }).features)
    ? (value as { features: unknown[] }).features
    : []
  const feature = features[0] as MapboxFeature | undefined
  const properties = feature?.properties ?? {}
  const coordinatesObject = properties.coordinates && typeof properties.coordinates === 'object'
    ? properties.coordinates as Record<string, unknown>
    : {}
  const geometryCoordinates = Array.isArray(feature?.geometry?.coordinates)
    ? feature.geometry.coordinates
    : []
  const longitude = typeof coordinatesObject.longitude === 'number'
    ? coordinatesObject.longitude
    : geometryCoordinates[0]
  const latitude = typeof coordinatesObject.latitude === 'number'
    ? coordinatesObject.latitude
    : geometryCoordinates[1]
  const featureType = readString(properties.feature_type)
  const matchCode = properties.match_code && typeof properties.match_code === 'object'
    ? Object.fromEntries(Object.entries(properties.match_code as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}
  const matchConfidence = readString(matchCode.confidence)
  const pointAccuracy = readString(coordinatesObject.accuracy)
  const standardizedLabel = readString(properties.full_address) ?? readString(properties.name)
  const inputHouseNumber = houseNumber(stop.address)
  const returnedHouseNumber = standardizedLabel ? houseNumber(standardizedLabel) : null
  const context = properties.context && typeof properties.context === 'object'
    ? properties.context as Record<string, unknown>
    : {}
  const region = context.region && typeof context.region === 'object'
    ? context.region as Record<string, unknown>
    : {}
  const regionCode = normalize(readString(region.region_code) ?? '')
  const regionName = normalize(readString(region.name) ?? '')

  let reason = ''
  if (!feature) reason = 'Mapbox returned no address result.'
  else if (featureType !== 'address') reason = 'Mapbox did not return an address-level result.'
  else if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) reason = 'Mapbox returned invalid coordinates.'
  else if (regionCode !== 'us-co' && regionCode !== 'co' && regionName !== 'colorado') {
    reason = 'Mapbox did not resolve the address to Colorado.'
  } else if (!inputHouseNumber || !returnedHouseNumber || inputHouseNumber !== returnedHouseNumber) {
    reason = 'Mapbox did not preserve the manifest house number.'
  } else if (matchCode.address_number === 'unmatched' || matchCode.region === 'unmatched') {
    reason = 'Mapbox marked the house number or region as unmatched.'
  } else if (!matchConfidence || !MATCH_CONFIDENCE.has(matchConfidence)) {
    reason = 'Mapbox did not return a recognized match confidence.'
  } else if (!pointAccuracy || !POINT_ACCURACY.has(pointAccuracy)) {
    reason = 'Mapbox did not return a recognized point accuracy.'
  }

  return {
    attemptedAt,
    coordinates: reason ? null : { latitude: latitude as number, longitude: longitude as number },
    featureType,
    geometryRevision: null,
    matchCode,
    matchConfidence,
    originalInput: { ...stop },
    pointAccuracy,
    polygonDecision: null,
    provider: 'mapbox-geocoding-v6',
    reason: reason || 'Mapbox returned an eligible address-level result.',
    standardizedLabel,
    status: reason ? 'rejected' : 'accepted',
  }
}

async function geocodeStops(
  stops: GeocodingInputStop[],
  accessToken: string,
  isEligible: (stop: GeocodingInputStop) => boolean,
  bbox: [number, number, number, number],
  outsideScopeReason: string,
  fetcher: typeof fetch = fetch,
) {
  const attemptedAt = new Date().toISOString()
  if (!accessToken) return new Map(stops.map((stop) => [stop.id, unavailable(
    stop, 'Permanent geocoding is not configured; manual review remains available.', attemptedAt,
  )]))
  const eligible = stops.filter(isEligible)
  const skipped = stops.filter((stop) => !isEligible(stop))
  const results = new Map(skipped.map((stop) => [stop.id, unavailable(
    stop, outsideScopeReason, attemptedAt,
  )]))
  if (eligible.length === 0) return results

  let response: Response
  try {
    const url = new URL(MAPBOX_BATCH_URL)
    url.searchParams.set('access_token', accessToken)
    url.searchParams.set('permanent', 'true')
    response = await fetcher(url, {
      body: JSON.stringify(eligible.map((stop) => ({
        autocomplete: false,
        bbox,
        country: 'us',
        limit: 1,
        q: `${physicalStreetAddress(stop.address)}, ${stop.city}, ${stop.state} ${stop.postalCode}`.trim(),
        types: ['address'],
      }))),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(8_000),
    })
  } catch {
    for (const stop of eligible) results.set(stop.id, unavailable(
      stop, 'Permanent geocoding could not be reached; manual review remains available.', attemptedAt,
    ))
    return results
  }
  if (!response.ok) {
    console.error('Permanent geocoding provider error', response.status)
    for (const stop of eligible) results.set(stop.id, unavailable(
      stop, 'Permanent geocoding was unavailable; manual review remains available.', attemptedAt,
    ))
    return results
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  const batch = payload && typeof payload === 'object' && Array.isArray((payload as { batch?: unknown }).batch)
    ? (payload as { batch: unknown[] }).batch
    : []
  if (batch.length !== eligible.length) {
    for (const stop of eligible) results.set(stop.id, unavailable(
      stop, 'Permanent geocoding did not preserve the stop list; manual review remains available.', attemptedAt,
    ))
    return results
  }
  eligible.forEach((stop, index) => results.set(
    stop.id, parseMapboxGeocodingResponse(stop, batch[index], attemptedAt),
  ))
  return results
}

export function geocodeGrandJunctionStops(
  stops: GeocodingInputStop[],
  accessToken: string,
  fetcher: typeof fetch = fetch,
) {
  return geocodeStops(
    stops, accessToken, isGrandJunctionGeocodingCandidate,
    [-109.2, 38.8, -108.1, 39.5],
    'The stop is outside the approved Grand Junction V1 city scope.', fetcher,
  )
}

export function geocodeTellurideRouteStops(
  stops: GeocodingInputStop[],
  accessToken: string,
  fetcher: typeof fetch = fetch,
) {
  return geocodeStops(
    stops, accessToken, isTellurideRouteGeocodingCandidate,
    [-108.1, 37.75, -107.55, 38.4],
    'The stop is outside the approved Telluride-route polygon city scope.', fetcher,
  )
}
