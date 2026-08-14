import fixture from './gr-001.fixture.json'
import type { RouteProposal, RouteStop } from '../lib/route-domain'

export type GoldenRouteStop = RouteStop

type GoldenRouteStopInput = Omit<GoldenRouteStop, 'id'>

type AcceptableVariation = {
  reason: string
  stops: string[]
}

type MeaningfulAiCorrection = {
  ai_sequence: string[]
  area: string
  driver_sequence: string[]
  lesson: string
}

type GoldenRouteRoutes = {
  ai_proposed_before_driver_correction: string[]
  driver_validated_actual: string[]
  office_proposed: string[]
}

type GoldenRouteFixture = {
  acceptable_variations: AcceptableVariation[]
  end: string
  expected_macro_zone_order: string[]
  fixture_id: string
  meaningful_ai_correction: MeaningfulAiCorrection
  required_expectations: string[]
  return_to_terminal_affects_order: boolean
  route_date: string
  route_type: string
  routes: GoldenRouteRoutes
  start: string
  stops: GoldenRouteStopInput[]
  title: string
}

const rawFixture = fixture satisfies GoldenRouteFixture

function stopId(name: string) {
  return `gr-001:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
}

export const gr001Fixture = {
  ...rawFixture,
  stops: rawFixture.stops.map((stop) => ({
    ...stop,
    id: stopId(stop.name),
  })),
}

function stopsForRoute(routeNames: string[]) {
  const stopsByName = new Map(
    gr001Fixture.stops.map((stop) => [stop.name, stop]),
  )
  const routeStops = routeNames.map((name) => stopsByName.get(name))

  if (
    routeStops.some((stop) => !stop) ||
    new Set(routeNames).size !== gr001Fixture.stops.length ||
    routeStops.length !== gr001Fixture.stops.length
  ) {
    throw new Error('GR-001 baseline proposal does not match the frozen stops.')
  }

  return routeStops as GoldenRouteStop[]
}

export const gr001BaselineProposal: RouteProposal<GoldenRouteStop> = {
  id: 'gr-001-historical-ai-baseline',
  label: 'Historical AI baseline',
  stops: stopsForRoute(
    gr001Fixture.routes.ai_proposed_before_driver_correction,
  ),
}

const correctionNames = new Set(
  gr001Fixture.meaningful_ai_correction.ai_sequence,
)
const baselineNames = gr001Fixture.routes.ai_proposed_before_driver_correction
const firstCorrectionIndex = baselineNames.findIndex((name) =>
  correctionNames.has(name),
)
const learnedRouteNames = baselineNames.filter(
  (name) => !correctionNames.has(name),
)

learnedRouteNames.splice(
  firstCorrectionIndex,
  0,
  ...gr001Fixture.meaningful_ai_correction.driver_sequence,
)

export const gr001LearnedProposal: RouteProposal<GoldenRouteStop> = {
  id: 'gr-001-approved-sandbox-lesson',
  label: 'Approved lesson applied',
  stops: stopsForRoute(learnedRouteNames),
}
