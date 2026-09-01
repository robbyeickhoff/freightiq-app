import type { ManifestRouteProposal } from './manifest-route-proposal'
import type { ZoneClassification } from './zone-classification'
import { normalizeOperationalZoneName } from './zone-learning.ts'

export function normalizeStoredRouteProposal(routeProposal: ManifestRouteProposal) {
  return {
    ...routeProposal,
    macroZoneFlow: routeProposal.macroZoneFlow.map(normalizeOperationalZoneName),
    transitions: routeProposal.transitions.map((transition) => ({
      ...transition,
      fromZone: normalizeOperationalZoneName(transition.fromZone),
      toZone: normalizeOperationalZoneName(transition.toZone),
    })),
    uncertainSequences: routeProposal.uncertainSequences.map((sequence) => ({
      ...sequence,
      zone: normalizeOperationalZoneName(sequence.zone),
    })),
  }
}

export function normalizeStoredRouteStop<T extends { zone: string }>(stop: T) {
  return { ...stop, zone: normalizeOperationalZoneName(stop.zone) }
}

export function normalizeStoredZoneClassification(classification: ZoneClassification) {
  return {
    ...classification,
    proposedZone: classification.proposedZone
      ? normalizeOperationalZoneName(classification.proposedZone)
      : null,
    selectedZone: classification.selectedZone
      ? normalizeOperationalZoneName(classification.selectedZone)
      : null,
  }
}
