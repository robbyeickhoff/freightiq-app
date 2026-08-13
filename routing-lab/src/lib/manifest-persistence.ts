import type { User } from '@supabase/supabase-js'

import type { ManifestPhoto } from '../components/ManifestIntake'
import type { GroupingResult, ProposedStop } from './manifest-grouping'
import type { ManifestExtraction } from './manifest-extraction'
import { getSupabase } from './supabase'

const MANIFEST_BUCKET = 'routing-lab-manifests'

export type StoredPhoto = {
  id: string
  name: string
  path: string
}

export type SavedManifestImport = {
  id: string
  status: 'review' | 'confirmed'
  photos: StoredPhoto[]
  extraction: ManifestExtraction
  workingState: GroupingResult
  confirmedStops: ProposedStop[] | null
}

function requireUser(user: User | null) {
  if (!user) throw new Error('Your Routing Lab session expired. Sign in again.')
  return user
}

async function currentUser() {
  const { data, error } = await getSupabase().auth.getUser()
  if (error) throw error
  return requireUser(data.user)
}

export async function createSavedManifestImport(
  photos: ManifestPhoto[],
  extraction: ManifestExtraction,
  workingState: GroupingResult,
) {
  const supabase = getSupabase()
  const user = await currentUser()
  const importId = crypto.randomUUID()
  const storedPhotos = photos.map((photo): StoredPhoto => ({
    id: photo.id,
    name: photo.name,
    path: `${user.id}/${importId}/${photo.id}.jpg`,
  }))
  const uploadedPaths: string[] = []

  try {
    for (let index = 0; index < photos.length; index += 1) {
      const { error } = await supabase.storage
        .from(MANIFEST_BUCKET)
        .upload(storedPhotos[index].path, photos[index].preparedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        })
      if (error) throw error
      uploadedPaths.push(storedPhotos[index].path)
    }

    const { error } = await supabase.from('routing_lab_manifest_imports').insert({
      id: importId,
      user_id: user.id,
      status: 'review',
      photo_manifest: storedPhotos,
      extraction,
      working_state: workingState,
    })
    if (error) throw error
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.storage.from(MANIFEST_BUCKET).remove(uploadedPaths)
    }
    throw error
  }

  return { importId, storedPhotos }
}

export async function loadLatestSavedManifest(): Promise<SavedManifestImport | null> {
  const user = await currentUser()
  const { data, error } = await getSupabase()
    .from('routing_lab_manifest_imports')
    .select('id,status,photo_manifest,extraction,working_state,confirmed_stops')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: data.id,
    status: data.status as SavedManifestImport['status'],
    photos: data.photo_manifest as unknown as StoredPhoto[],
    extraction: data.extraction as unknown as ManifestExtraction,
    workingState: data.working_state as unknown as GroupingResult,
    confirmedStops: data.confirmed_stops as unknown as ProposedStop[] | null,
  }
}

export async function downloadSavedPhotos(photos: StoredPhoto[]) {
  const supabase = getSupabase()
  return Promise.all(photos.map(async (photo): Promise<ManifestPhoto> => {
    const { data, error } = await supabase.storage.from(MANIFEST_BUCKET).download(photo.path)
    if (error) throw error
    return {
      id: photo.id,
      name: photo.name,
      previewUrl: URL.createObjectURL(data),
      preparedBlob: data,
    }
  }))
}

export async function saveManifestWorkingState(importId: string, workingState: GroupingResult) {
  const user = await currentUser()
  const { error } = await getSupabase()
    .from('routing_lab_manifest_imports')
    .update({ working_state: workingState, updated_at: new Date().toISOString() })
    .eq('id', importId)
    .eq('user_id', user.id)
    .select('id')
    .single()
  if (error) throw error
}

export async function confirmSavedManifest(importId: string, stops: ProposedStop[]) {
  const user = await currentUser()
  const { error } = await getSupabase()
    .from('routing_lab_manifest_imports')
    .update({
      status: 'confirmed',
      confirmed_stops: stops,
      working_state: { stops, proposals: [] },
      updated_at: new Date().toISOString(),
    })
    .eq('id', importId)
    .eq('user_id', user.id)
    .select('id')
    .single()
  if (error) throw error
}

export async function deleteSavedManifest(importId: string, photos: StoredPhoto[]) {
  const supabase = getSupabase()
  const user = await currentUser()
  const paths = photos.map((photo) => photo.path)

  if (paths.length) {
    const { error } = await supabase.storage.from(MANIFEST_BUCKET).remove(paths)
    if (error) throw error
  }

  const { error } = await supabase
    .from('routing_lab_manifest_imports')
    .delete()
    .eq('id', importId)
    .eq('user_id', user.id)
    .select('id')
    .single()
  if (error) throw error
}
