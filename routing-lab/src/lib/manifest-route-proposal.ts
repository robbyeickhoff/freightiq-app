import { FunctionsHttpError } from '@supabase/supabase-js'

import type { ManifestDraftRoute } from './route-persistence'
import { getSupabase } from './supabase'

export type RouteTransition = {
  fromZone: string
  reason: string
  toZone: string
}

export type UncertainSequence = {
  reason: string
  zone: string
}

export type ManifestRouteProposal = {
  appliedLessonIds: string[]
  documentsUsed: string[]
  macroZoneFlow: string[]
  operationalExceptions: string[]
  orderedStopIds: string[]
  transitions: RouteTransition[]
  uncertainSequences: UncertainSequence[]
}

export type PlannedRouteCorrection = {
  afterStopIds: string[]
  beforeStopIds: string[]
  description: string
  note: string
  reasons: string[]
  recordedAt: string
}

type RouteProposalResponse = ManifestRouteProposal & { model: string }

function validStopOrder(stopIds: string[], sourceStopIds: string[]) {
  return stopIds.length === sourceStopIds.length &&
    new Set(stopIds).size === sourceStopIds.length &&
    sourceStopIds.every((stopId) => stopIds.includes(stopId))
}

export async function proposeManifestRoute(route: ManifestDraftRoute) {
  if (route.status !== 'zone_approved') {
    throw new Error('Approve every zone before generating a route proposal.')
  }

  const approvedZones = new Map(
    route.zoneReview
      .filter((item) => item.status === 'approved' && item.selectedZone)
      .map((item) => [item.stopId, item.selectedZone as string]),
  )
  if (approvedZones.size !== route.sourceStops.length) {
    throw new Error('Every current stop must have one driver-approved zone.')
  }

  const { data, error } = await getSupabase().functions.invoke<RouteProposalResponse>(
    'propose-manifest-route',
    {
      body: {
        setup: route.setup,
        stops: route.sourceStops.map((stop) => ({
          address: stop.address,
          city: stop.city,
          id: stop.id,
          name: stop.name,
          postalCode: stop.postalCode,
          state: stop.state,
          zone: approvedZones.get(stop.id),
        })),
      },
    },
  )

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const response = error.context as Response
        const body = await response.clone().json() as { error?: unknown }
        if (typeof body.error === 'string') throw new Error(body.error)
      } catch (contextError) {
        if (contextError instanceof Error && contextError.message !== error.message) {
          throw contextError
        }
      }
    }
    throw new Error('Route proposal failed. Check your connection and try again.')
  }

  if (!data || !validStopOrder(data.orderedStopIds, route.sourceStops.map((stop) => stop.id))) {
    throw new Error('The proposal did not preserve every current stop exactly once.')
  }

  return data as ManifestRouteProposal
}
