import fixture from '../../../docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/fixture.json'

export type GoldenRouteStop = {
  address: string
  city: string
  name: string
  zone: string
}

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
  stops: GoldenRouteStop[]
  title: string
}

export const gr001Fixture = fixture satisfies GoldenRouteFixture

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

export const gr001BaselineProposal = {
  id: 'gr-001-historical-ai-baseline',
  label: 'Historical AI baseline',
  stops: stopsForRoute(
    gr001Fixture.routes.ai_proposed_before_driver_correction,
  ),
}
