import type { Json } from './database'
import type { ManifestDraftRoute } from './route-persistence'
import { getSupabase } from './supabase'

export type LessonImpact = 'Critical' | 'Moderate' | 'Minor' | 'Equivalent'
export type LessonScope = 'Stop' | 'Road' | 'Micro Zone' | 'Zone' | 'Macro Zone'
export type ManifestLesson = {
  category: string
  evidence: { actualStopIds: string[]; afterStopIds: string[]; beforeStopIds: string[]; sourceStopIds: string[] }
  id: string
  impact: LessonImpact
  knownExceptions: string
  operationalReason: string
  scopeType: LessonScope
  scopeValue: string
  sourceRouteId: string
  strength: 'Hard rule' | 'Preferred' | 'Situational'
  text: string
}

async function userId() {
  const { data, error } = await getSupabase().auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Your Routing Lab session expired. Sign in again.')
  return data.user.id
}

export async function approveManifestLesson(route: ManifestDraftRoute, lesson: ManifestLesson) {
  const owner = await userId()
  const { error } = await getSupabase().from('routing_lab_manifest_lessons').insert({
    id: lesson.id, user_id: owner, source_route_id: route.id, status: 'approved',
    lesson_text: lesson.text, strength: lesson.strength, scope_type: lesson.scopeType,
    scope_value: lesson.scopeValue, category: lesson.category,
    operational_reason: lesson.operationalReason, impact: lesson.impact,
    known_exceptions: lesson.knownExceptions, evidence: lesson.evidence as unknown as Json,
  })
  if (error) throw error
}

export async function loadManifestLessons() {
  const owner = await userId()
  const { data, error } = await getSupabase().from('routing_lab_manifest_lessons')
    .select('id,source_route_id,lesson_text,strength,scope_type,scope_value,category,operational_reason,impact,known_exceptions,evidence')
    .eq('user_id', owner).eq('status', 'approved').order('approved_at')
  if (error) throw error
  return data.map((row) => ({ id: row.id, sourceRouteId: row.source_route_id, text: row.lesson_text,
    strength: row.strength, scopeType: row.scope_type, scopeValue: row.scope_value,
    category: row.category, operationalReason: row.operational_reason, impact: row.impact,
    knownExceptions: row.known_exceptions, evidence: row.evidence })) as ManifestLesson[]
}
