import type { ManifestExtraction, ReviewState } from './manifest-extraction'

export type EditableShipment = {
  id: string
  sourcePhotoId: string | null
  sourceRecordIndex: number | null
  consigneeName: string
  streetAddress: string
  city: string
  state: string
  postalCode: string
  proNumber: string
  consigneeReviewState: ReviewState
  addressReviewState: ReviewState
  originalEvidence: {
    consigneeName: string | null
    streetAddress: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    proNumber: string | null
    evidenceNote: string | null
  }
}

export type ProposedStop = {
  id: string
  consigneeName: string
  streetAddress: string
  city: string
  state: string
  postalCode: string
  consigneeReviewState: ReviewState
  addressReviewState: ReviewState
  shipments: EditableShipment[]
}

export type MergeProposal = {
  id: string
  stopIds: [string, string]
  reason: 'possible_same_address' | 'similar_address'
}

export type GroupingResult = {
  stops: ProposedStop[]
  proposals: MergeProposal[]
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(street|st)\b/g, 'st')
    .replace(/\b(road|rd)\b/g, 'rd')
    .replace(/\b(avenue|ave)\b/g, 'ave')
    .replace(/\b(drive|dr)\b/g, 'dr')
    .replace(/\b(lane|ln)\b/g, 'ln')
    .replace(/\b(company|co)\b/g, 'co')
    .replace(/[^a-z0-9]/g, '')
}

function normalizedAddress(shipment: EditableShipment) {
  return normalizeText([
    shipment.streetAddress,
    shipment.city,
    shipment.state,
    shipment.postalCode,
  ].join(' '))
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}

function addressesLookSimilar(left: ProposedStop, right: ProposedStop) {
  const leftAddress = normalizeText(`${left.streetAddress} ${left.city}`)
  const rightAddress = normalizeText(`${right.streetAddress} ${right.city}`)
  if (!leftAddress || !rightAddress) return false
  if (normalizeText(left.city) !== normalizeText(right.city)) return false

  return editDistance(leftAddress, rightAddress) <= 2
}

function createStop(shipment: EditableShipment): ProposedStop {
  return {
    id: crypto.randomUUID(),
    consigneeName: shipment.consigneeName,
    streetAddress: shipment.streetAddress,
    city: shipment.city,
    state: shipment.state,
    postalCode: shipment.postalCode,
    consigneeReviewState: shipment.consigneeReviewState,
    addressReviewState: shipment.addressReviewState,
    shipments: [shipment],
  }
}

export function groupExtractedShipments(extraction: ManifestExtraction): GroupingResult {
  const shipments: EditableShipment[] = extraction.photos.flatMap((photo) =>
    photo.shipments.map((shipment) => ({
      id: crypto.randomUUID(),
      sourcePhotoId: photo.sourcePhotoId,
      sourceRecordIndex: shipment.sourceRecordIndex,
      consigneeName: shipment.consigneeName ?? '',
      streetAddress: shipment.streetAddress ?? '',
      city: shipment.city ?? '',
      state: shipment.state ?? '',
      postalCode: shipment.postalCode ?? '',
      proNumber: shipment.proNumber ?? '',
      consigneeReviewState: shipment.consigneeReviewState,
      addressReviewState: shipment.addressReviewState,
      originalEvidence: {
        consigneeName: shipment.consigneeName,
        streetAddress: shipment.streetAddress,
        city: shipment.city,
        state: shipment.state,
        postalCode: shipment.postalCode,
        proNumber: shipment.proNumber,
        evidenceNote: shipment.evidenceNote,
      },
    })),
  )

  const stops: ProposedStop[] = []
  for (const shipment of shipments) {
    const existingStop = stops.find((stop) =>
      normalizedAddress(stop.shipments[0]) === normalizedAddress(shipment) &&
      normalizeText(stop.consigneeName) === normalizeText(shipment.consigneeName),
    )

    if (existingStop && normalizedAddress(shipment)) {
      existingStop.shipments.push(shipment)
    } else {
      stops.push(createStop(shipment))
    }
  }

  const proposals: MergeProposal[] = []
  for (let leftIndex = 0; leftIndex < stops.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < stops.length; rightIndex += 1) {
      const left = stops[leftIndex]
      const right = stops[rightIndex]
      const sameAddress = normalizedAddress(left.shipments[0]) !== '' &&
        normalizedAddress(left.shipments[0]) === normalizedAddress(right.shipments[0])

      if (sameAddress || addressesLookSimilar(left, right)) {
        proposals.push({
          id: crypto.randomUUID(),
          stopIds: [left.id, right.id],
          reason: sameAddress ? 'possible_same_address' : 'similar_address',
        })
      }
    }
  }

  return { stops, proposals }
}

export function createManualStop(): ProposedStop {
  const shipment: EditableShipment = {
    id: crypto.randomUUID(),
    sourcePhotoId: null,
    sourceRecordIndex: null,
    consigneeName: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    proNumber: '',
    consigneeReviewState: 'needs_review',
    addressReviewState: 'needs_review',
    originalEvidence: {
      consigneeName: null,
      streetAddress: null,
      city: null,
      state: null,
      postalCode: null,
      proNumber: null,
      evidenceNote: 'Added manually by the driver.',
    },
  }

  return createStop(shipment)
}
