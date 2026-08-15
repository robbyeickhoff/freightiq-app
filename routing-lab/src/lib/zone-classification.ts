import { FunctionsHttpError } from '@supabase/supabase-js'

import type { ManifestRouteStop } from './route-persistence'
import { getSupabase } from './supabase'

export const documentedOperationalZones = [
  'Grand Junction',
  'Delta',
  'Olathe',
  'Montrose',
  'Ridgway — North of Highway 62',
  'Ouray',
  'Ridgway Proper',
  'Log Hill',
  'Placerville / Sawpit',
  'Wilson Mesa Ranch Zone',
  'South Park',
  'Lawson Hill / Society',
  'Mountain Village',
  'Downtown Telluride',
  'Airport / Aldasoro',
  'Norwood',
  'Nucla / Naturita',
  'Gateway',
] as const

export type ZoneConfidence = 'high' | 'medium' | 'low' | 'uncertain'
export type ZoneReviewStatus = 'proposed' | 'approved' | 'unresolved'

export type ZoneClassification = {
  confidence: ZoneConfidence
  evidence: string
  proposedZone: string | null
  selectedZone: string | null
  status: ZoneReviewStatus
  stopId: string
}

type ZoneClassificationResponse = {
  classifications: Array<{
    confidence: ZoneConfidence
    evidence: string
    proposedZone: string | null
    stopId: string
  }>
  model: string
}

export async function proposeZoneClassifications(stops: ManifestRouteStop[]) {
  const { data, error } = await getSupabase().functions.invoke<ZoneClassificationResponse>(
    'classify-route-zones',
    {
      body: {
        stops: stops.map((stop) => ({
          address: stop.address,
          city: stop.city,
          id: stop.id,
          postalCode: stop.postalCode,
          state: stop.state,
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

    throw new Error('Zone classification failed. Check your connection and try again.')
  }

  if (!data || !Array.isArray(data.classifications)) {
    throw new Error('Zone classification returned an invalid result.')
  }

  const classificationsByStop = new Map(
    data.classifications.map((classification) => [classification.stopId, classification]),
  )

  return stops.map<ZoneClassification>((stop) => {
    const classification = classificationsByStop.get(stop.id)
    if (!classification) {
      return {
        confidence: 'uncertain',
        evidence: 'The classifier did not return a result for this stop.',
        proposedZone: null,
        selectedZone: null,
        status: 'unresolved',
        stopId: stop.id,
      }
    }

    return {
      ...classification,
      selectedZone: classification.proposedZone,
      status: classification.proposedZone ? 'proposed' : 'unresolved',
    }
  })
}
