import type { ProposedStop } from './manifest-grouping'
import type { Json } from './database'
import type { RouteStop } from './route-domain'
import { getSupabase } from './supabase'
import type { ZoneClassification } from './zone-classification'

export type ManifestRouteStop = RouteStop & {
  postalCode: string
  state: string
}

export type RouteSetup = {
  routeDate: string
  startLocation: string
  returnLocation: string
  returnAffectsOrder: boolean
  wholeRouteConstraint: string
}

export type ManifestDraftRoute = {
  id: string
  manifestImportId: string
  setup: RouteSetup
  sourceStops: ManifestRouteStop[]
  status: 'draft_setup' | 'zone_review' | 'zone_approved'
  zoneReview: ZoneClassification[]
}

function defaultRouteDate() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function createDefaultSetup(): RouteSetup {
  return {
    routeDate: defaultRouteDate(),
    startLocation: '',
    returnLocation: '',
    returnAffectsOrder: false,
    wholeRouteConstraint: '',
  }
}

function toRouteStops(stops: ProposedStop[]): ManifestRouteStop[] {
  return stops.map((stop) => ({
    id: stop.id,
    address: stop.streetAddress,
    city: stop.city,
    name: stop.consigneeName,
    postalCode: stop.postalCode,
    state: stop.state,
    zone: '',
  }))
}

function fromRow(row: {
  id: string
  manifest_import_id: string
  setup: Json
  source_stops: Json
  status: string
  zone_review: Json
}): ManifestDraftRoute {
  return {
    id: row.id,
    manifestImportId: row.manifest_import_id,
    setup: row.setup as unknown as RouteSetup,
    sourceStops: row.source_stops as unknown as ManifestRouteStop[],
    status: row.status as ManifestDraftRoute['status'],
    zoneReview: row.zone_review as unknown as ZoneClassification[],
  }
}

async function currentUserId() {
  const { data, error } = await getSupabase().auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Your Routing Lab session expired. Sign in again.')
  return data.user.id
}

export async function buildManifestDraftRoute(
  manifestImportId: string,
  confirmedStops: ProposedStop[],
) {
  const userId = await currentUserId()
  const supabase = getSupabase()
  const existing = await supabase
    .from('routing_lab_routes')
    .select('id,manifest_import_id,status,source_stops,setup,zone_review')
    .eq('user_id', userId)
    .eq('manifest_import_id', manifestImportId)
    .maybeSingle()

  if (existing.error) throw existing.error
  if (existing.data) return fromRow(existing.data)

  const route = {
    id: crypto.randomUUID(),
    manifest_import_id: manifestImportId,
    setup: createDefaultSetup() as unknown as Json,
    source_stops: toRouteStops(confirmedStops) as unknown as Json,
    user_id: userId,
  }
  const { data, error } = await supabase
    .from('routing_lab_routes')
    .insert(route)
    .select('id,manifest_import_id,status,source_stops,setup,zone_review')
    .single()

  if (error) throw error
  return fromRow(data)
}

export async function loadLatestManifestDraftRoute() {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .select('id,manifest_import_id,status,source_stops,setup,zone_review')
    .eq('user_id', userId)
    .in('status', ['draft_setup', 'zone_review', 'zone_approved'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? fromRow(data) : null
}

export async function saveManifestRouteSetup(routeId: string, setup: RouteSetup) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .update({ setup: setup as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', routeId)
    .eq('user_id', userId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The draft route could not be saved.')
}

export async function saveManifestZoneReview(
  routeId: string,
  zoneReview: ZoneClassification[],
  complete: boolean,
) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .update({
      status: complete ? 'zone_approved' : 'zone_review',
      updated_at: new Date().toISOString(),
      zone_review: zoneReview as unknown as Json,
    })
    .eq('id', routeId)
    .eq('user_id', userId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The zone review could not be saved.')
}
