import fixture from '../../../docs/routing/golden-routes/GR-001-Telluride-Multi-Zone/fixture.json'

export type GoldenRouteStop = {
  address: string
  city: string
  name: string
  zone: string
}

type GoldenRouteFixture = {
  end: string
  expected_macro_zone_order: string[]
  fixture_id: string
  return_to_terminal_affects_order: boolean
  route_date: string
  route_type: string
  start: string
  stops: GoldenRouteStop[]
  title: string
}

export const gr001Fixture = fixture satisfies GoldenRouteFixture
