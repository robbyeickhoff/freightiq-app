import { useEffect, useState } from 'react'

import type { LessonImpact, LessonScope, ManifestLesson } from '../lib/manifest-lessons'
import type { ManifestDraftRoute } from '../lib/route-persistence'

type Props = { route: ManifestDraftRoute; onApprove: (lesson: ManifestLesson) => Promise<void>; onReplay: () => Promise<void> }
const impacts: LessonImpact[] = ['Critical', 'Moderate', 'Minor', 'Equivalent']
const scopes: LessonScope[] = ['Stop', 'Road', 'Micro Zone', 'Zone', 'Macro Zone']
const strengths: ManifestLesson['strength'][] = ['Hard rule', 'Preferred', 'Situational']

function Sequence({ label, ids, route }: { label: string; ids: string[]; route: ManifestDraftRoute }) {
  const names = new Map(route.sourceStops.map((stop) => [stop.id, stop.name]))
  return <div className="review-sequence"><span>{label}</span><p>{ids.map((id) => names.get(id) ?? id).join(' → ')}</p></div>
}

function ManifestLessonReview({ route, onApprove, onReplay }: Props) {
  const [stage, setStage] = useState<'choice' | 'draft'>('choice')
  const [reviewedCorrections, setReviewedCorrections] = useState<number[]>([])
  const [approvedCorrections, setApprovedCorrections] = useState<number[]>([])
  const [correctionIndex, setCorrectionIndex] = useState(0)
  const correction = route.plannedCorrections[correctionIndex]
  const actualStopIds = Object.entries(route.runState?.stopEvents ?? {})
    .sort(([, first], [, second]) => first.actionOrder - second.actionOrder).map(([id]) => id)
  const beforeStopIds = correction?.beforeStopIds ?? route.routeProposal?.orderedStopIds ?? []
  const afterStopIds = correction?.afterStopIds ?? route.adjustedStopIds
  const firstChanged = afterStopIds.find((id, index) => beforeStopIds[index] !== id)
  const stop = route.sourceStops.find((item) => item.id === firstChanged) ?? route.sourceStops[0]
  const correctionZone = route.zoneReview.find((item) => item.stopId === stop?.id)?.selectedZone
  const [text, setText] = useState(`When this route context repeats, use the driver-approved stop sequence shown in this evidence.`)
  const [impact, setImpact] = useState<LessonImpact>('Moderate')
  const [scopeType, setScopeType] = useState<LessonScope>('Zone')
  const [scopeValue, setScopeValue] = useState(correctionZone ?? 'Current route')
  const [strength, setStrength] = useState<ManifestLesson['strength']>('Preferred')
  const [category, setCategory] = useState(correction?.reasons.includes('Vehicle positioning') ? 'Vehicle positioning' : 'Route flow')
  const [operationalReason, setOperationalReason] = useState(correction?.reasons.join(' · ') || route.runState?.reasonRecords.at(-1)?.reasons.join(' · ') || '')
  const [exceptions, setExceptions] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const moved = route.sourceStops.find((item) => item.id === correction?.stopId)
    setText(moved
      ? `In ${correctionZone ?? 'this route context'}, place ${moved.name} in the driver-approved position shown by this correction.`
      : 'When this route context repeats, use the driver-approved stop sequence shown by this correction.')
    setOperationalReason(correction?.reasons.join(' · ') || '')
  }, [correction, correctionZone, route.sourceStops])

  async function approve() {
    if (!text.trim() || !operationalReason.trim() || !scopeValue.trim()) return
    try {
      await onApprove({ id: crypto.randomUUID(), sourceRouteId: route.id, text: text.trim(), strength,
        scopeType, scopeValue: scopeValue.trim(), category, operationalReason: operationalReason.trim(),
        impact, knownExceptions: exceptions.trim(), evidence: { actualStopIds, afterStopIds, beforeStopIds,
          sourceStopIds: route.sourceStops.map((item) => item.id) } })
      setReviewedCorrections((current) => [...current, correctionIndex])
      setApprovedCorrections((current) => [...current, correctionIndex])
      setStage('choice')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'The lesson could not be saved.') }
  }

  return (
    <section className="end-review" aria-labelledby="manifest-lesson-review-title">
      <div className="section-heading"><div><p className="eyebrow">End-of-route review</p><h2 id="manifest-lesson-review-title">Review the learning event</h2></div><span className="review-badge">Route complete</span></div>
      {stage === 'choice' ? <div className="review-choice"><p>Review one saved correction at a time. Replay stays locked until every correction is reviewed.</p>{route.plannedCorrections.map((item, index) => <article className="meaningful-difference" key={item.recordedAt}><p className="insight-label">Correction {index + 1} · {approvedCorrections.includes(index) ? 'Lesson approved' : reviewedCorrections.includes(index) ? 'Not reusable' : 'Needs review'}</p><h3>{item.description}</h3><p><strong>Reasons you saved:</strong> {item.reasons.join(' · ')}</p>{item.note ? <p>“{item.note}”</p> : null}{!reviewedCorrections.includes(index) ? <div className="review-actions"><button className="primary-button" type="button" onClick={() => { setCorrectionIndex(index); setStage('draft') }}>Review this correction</button></div> : null}</article>)}{reviewedCorrections.length === route.plannedCorrections.length ? <div className="review-state-message review-state-message--success"><h3>Every correction reviewed</h3><p>{approvedCorrections.length} reusable {approvedCorrections.length === 1 ? 'lesson was' : 'lessons were'} approved.</p><button className="primary-button" type="button" onClick={() => void onReplay()}>Replay manifest with approved lessons</button></div> : null}</div> : null}
      {stage === 'draft' ? <div className="lesson-draft">
        <article className="meaningful-difference"><p className="insight-label">Correction being reviewed</p><h3>{correction?.description}</h3><p><strong>Reasons you saved:</strong> {correction?.reasons.join(' · ')}</p></article>
        <details className="lesson-evidence"><summary>View full route comparison</summary><Sequence label="Original AI proposal" ids={route.routeProposal?.orderedStopIds ?? []} route={route} /><Sequence label="Driver-adjusted starting route" ids={route.adjustedStopIds} route={route} /><Sequence label="Actual route" ids={actualStopIds} route={route} /></details>
        <label className="lesson-editor"><span>Lesson text</span><textarea value={text} maxLength={500} onChange={(event) => setText(event.target.value)} /></label>
        <div className="lesson-evidence"><strong>Operational reason being taught</strong><p>{operationalReason}</p></div>
        <label className="lesson-editor"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Route flow</option><option>Vehicle positioning</option></select></label>
        <label className="lesson-editor"><span>Scope</span><select value={scopeType} onChange={(event) => setScopeType(event.target.value as LessonScope)}>{scopes.map((item) => <option key={item}>{item}</option>)}</select><input value={scopeValue} onChange={(event) => setScopeValue(event.target.value)} /></label>
        <label className="lesson-editor"><span>Known exceptions (optional)</span><textarea value={exceptions} onChange={(event) => setExceptions(event.target.value)} /></label>
        <fieldset className="strength-picker"><legend>Rule strength</legend><div>{strengths.map((item) => <label key={item}><input type="radio" name="manifest-strength" checked={strength === item} onChange={() => setStrength(item)} /><span>{item}</span></label>)}</div></fieldset>
        <fieldset className="strength-picker"><legend>Correction impact — your decision</legend><div>{impacts.map((item) => <label key={item}><input type="radio" name="manifest-impact" checked={impact === item} onChange={() => setImpact(item)} /><span>{item}</span></label>)}</div></fieldset>
        <button className="primary-button" type="button" disabled={!text.trim() || !operationalReason.trim() || !scopeValue.trim()} onClick={() => void approve()}>Approve this correction as a lesson</button>
        <button className="secondary-button" type="button" onClick={() => { setReviewedCorrections((current) => [...current, correctionIndex]); setStage('choice') }}>This correction is not reusable</button>
        <button className="text-button" type="button" onClick={() => setStage('choice')}>Back to correction list</button>
        {error ? <p className="photo-error" role="alert">{error}</p> : null}
      </div> : null}
    </section>
  )
}

export default ManifestLessonReview
