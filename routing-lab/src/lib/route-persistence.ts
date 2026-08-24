import type { ProposedStop } from './manifest-grouping'
import type { Json } from './database'
import type { PendingReason, ReasonRecord, RouteStop, StopEvent } from './route-domain'
import { getSupabase } from './supabase'
import type { ZoneClassification } from './zone-classification'
import type {
  ManifestRouteProposal,
  PlannedRouteCorrection,
} from './manifest-route-proposal'
import { buildAddressKey, isGrandJunctionParentZone } from './zone-learning'

export type ManifestRouteStop = RouteStop & {
  postalCode: string
  state: string
}

export type RouteSetup = {
  primaryParentZone: string
  routeDate: string
  startLocation: string
  returnLocation: string
  returnAffectsOrder: boolean
  wholeRouteConstraint: string
}

export type ManifestRouteRunState = {
  pendingReason: PendingReason | null
  reasonNote: string
  reasonRecords: ReasonRecord[]
  remainingStopIds: string[]
  routeFinishedAt: string | null
  routeStartedAt: string
  selectedReasons: string[]
  stopEvents: Record<string, StopEvent>
}

export type ManifestDraftRoute = {
  adjustedStopIds: string[]
  id: string
  manifestImportId: string
  plannedCorrections: PlannedRouteCorrection[]
  routeProposal: ManifestRouteProposal | null
  runState: ManifestRouteRunState | null
  setup: RouteSetup
  sourceStops: ManifestRouteStop[]
  status: 'draft_setup' | 'zone_review' | 'zone_approved' | 'proposal_review' | 'proposal_reviewed' | 'route_active' | 'route_completed'
  zoneReview: ZoneClassification[]
}

function defaultRouteDate() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function createDefaultSetup(): RouteSetup {
  return {
    primaryParentZone: '',
    routeDate: defaultRouteDate(),
    startLocation: '788 22 Rd, Grand Junction, CO 81505',
    returnLocation: '788 22 Rd, Grand Junction, CO 81505',
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
  adjusted_stop_ids: Json
  id: string
  manifest_import_id: string
  planned_corrections: Json
  route_proposal: Json
  run_state: Json
  setup: Json
  source_stops: Json
  status: string
  zone_review: Json
}): ManifestDraftRoute {
  return {
    adjustedStopIds: row.adjusted_stop_ids as unknown as string[],
    id: row.id,
    manifestImportId: row.manifest_import_id,
    plannedCorrections: row.planned_corrections as unknown as PlannedRouteCorrection[],
    routeProposal: Object.keys(row.route_proposal as Record<string, Json>).length > 0
      ? row.route_proposal as unknown as ManifestRouteProposal
      : null,
    runState: Object.keys(row.run_state as Record<string, Json>).length > 0
      ? row.run_state as unknown as ManifestRouteRunState
      : null,
    setup: row.setup as unknown as RouteSetup,
    sourceStops: row.source_stops as unknown as ManifestRouteStop[],
    status: row.status as ManifestDraftRoute['status'],
    zoneReview: row.zone_review as unknown as ZoneClassification[],
  }
}

const routeSelect = 'id,manifest_import_id,status,source_stops,setup,zone_review,route_proposal,adjusted_stop_ids,planned_corrections,run_state'

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
    .select(routeSelect)
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
    .select(routeSelect)
    .single()

  if (error) throw error
  return fromRow(data)
}

export async function loadLatestManifestDraftRoute() {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .select(routeSelect)
    .eq('user_id', userId)
    .in('status', ['draft_setup', 'zone_review', 'zone_approved', 'proposal_review', 'proposal_reviewed', 'route_active', 'route_completed'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? fromRow(data) : null
}

export async function loadManifestRoutes() {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .select(routeSelect)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data.map(fromRow)
}

export async function deleteManifestRoute(routeId: string) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .delete()
    .eq('id', routeId)
    .eq('user_id', userId)
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The Test Route could not be deleted.')
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
  route: ManifestDraftRoute,
  zoneReview: ZoneClassification[],
  complete: boolean,
) {
  await currentUserId()
  const approvedZones = new Map(
    zoneReview
      .filter((item) => item.status === 'approved' && item.selectedZone)
      .map((item) => [item.stopId, item.selectedZone as string]),
  )
  const evidence = complete
    ? route.sourceStops.flatMap((stop) => {
        const approvedZone = approvedZones.get(stop.id)
        if (!approvedZone || !isGrandJunctionParentZone(approvedZone)) return []
        return [{
          address: stop.address,
          address_key: buildAddressKey(stop),
          approved_zone: approvedZone,
          approved_micro_zone: zoneReview.find((item) => item.stopId === stop.id)?.selectedMicroZone,
          city: stop.city,
          postal_code: stop.postalCode,
          state: stop.state,
          stop_id: stop.id,
        }]
      })
    : []
  const { error } = await getSupabase().rpc('save_routing_lab_zone_review', {
    p_complete: complete,
    p_evidence: evidence as unknown as Json,
    p_route_id: route.id,
    p_zone_review: zoneReview as unknown as Json,
  })

  if (error) throw error
}

export async function saveManifestRouteProposal(
  routeId: string,
  proposal: ManifestRouteProposal,
) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .update({
      adjusted_stop_ids: proposal.orderedStopIds as unknown as Json,
      planned_corrections: [] as unknown as Json,
      route_proposal: proposal as unknown as Json,
      status: 'proposal_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId)
    .eq('user_id', userId)
    .eq('status', 'zone_approved')
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The route proposal could not be saved.')
}

export async function saveManifestProposalReview(
  routeId: string,
  adjustedStopIds: string[],
  corrections: PlannedRouteCorrection[],
  complete: boolean,
) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .update({
      adjusted_stop_ids: adjustedStopIds as unknown as Json,
      planned_corrections: corrections as unknown as Json,
      status: complete ? 'proposal_reviewed' : 'proposal_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId)
    .eq('user_id', userId)
    .in('status', ['proposal_review', 'proposal_reviewed'])
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The route proposal review could not be saved.')
}

export async function saveManifestRouteRun(
  routeId: string,
  runState: ManifestRouteRunState,
) {
  const userId = await currentUserId()
  const { data, error } = await getSupabase()
    .from('routing_lab_routes')
    .update({
      run_state: runState as unknown as Json,
      status: runState.routeFinishedAt ? 'route_completed' : 'route_active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', routeId)
    .eq('user_id', userId)
    .in('status', ['proposal_reviewed', 'route_active', 'route_completed'])
    .select('id')
    .single()

  if (error) throw error
  if (!data) throw new Error('The active route could not be saved.')
}

export async function prepareManifestRouteReplay(routeId: string) {
  const userId = await currentUserId()
  const { error } = await getSupabase().from('routing_lab_routes').update({
    adjusted_stop_ids: [] as unknown as Json, planned_corrections: [] as unknown as Json,
    route_proposal: {} as Json, run_state: {} as Json, status: 'zone_approved',
    updated_at: new Date().toISOString(),
  }).eq('id', routeId).eq('user_id', userId).eq('status', 'route_completed')
  if (error) throw error
}
