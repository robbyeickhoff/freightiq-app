import { FunctionsHttpError } from '@supabase/supabase-js'

import { getSupabase } from './supabase'

export type ReviewState =
  | 'confident'
  | 'handwritten_correction'
  | 'needs_review'
  | 'unreadable'

export type ExtractedShipment = {
  sourceRecordIndex: number
  consigneeName: string | null
  streetAddress: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  proNumber: string | null
  consigneeReviewState: ReviewState
  addressReviewState: ReviewState
  proReviewState: Exclude<ReviewState, 'handwritten_correction'>
  evidenceNote: string | null
}

export type ExtractedPhoto = {
  sourcePhotoId: string
  status: 'complete' | 'partial' | 'unreadable'
  message: string | null
  shipments: ExtractedShipment[]
}

export type ManifestExtraction = {
  model: string
  photos: ExtractedPhoto[]
}

type ExtractionPhoto = {
  id: string
  name: string
  blob: Blob
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('A prepared photo could not be read.'))
    reader.readAsDataURL(blob)
  })
}

export async function extractManifestPhotos(photos: ExtractionPhoto[]) {
  const payloadPhotos = await Promise.all(
    photos.map(async (photo) => ({
      id: photo.id,
      name: photo.name,
      dataUrl: await blobToDataUrl(photo.blob),
    })),
  )

  const { data, error } = await getSupabase().functions.invoke<ManifestExtraction>(
    'extract-manifest',
    { body: { photos: payloadPhotos } },
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

    throw new Error('Manifest extraction failed. Check your connection and try again.')
  }

  if (!data || !Array.isArray(data.photos)) {
    throw new Error('Manifest extraction returned an invalid result.')
  }

  return data
}
