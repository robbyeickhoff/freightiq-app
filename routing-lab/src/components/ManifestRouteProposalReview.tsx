import { useEffect, useState } from 'react'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'

import ReasonPrompt from './ReasonPrompt'
import type {
  ManifestRouteProposal,
  PlannedRouteCorrection,
} from '../lib/manifest-route-proposal'
import {
  findIntentionalStopChanges,
  moveStopToPosition,
  sameStopOrder,
} from '../lib/route-reordering'
import type { ManifestDraftRoute } from '../lib/route-persistence'

type PendingCorrection = {
  afterStopIds: string[]
  beforeStopIds: string[]
  description: string
  stopId?: string
}

type EditSnapshot = {
  corrections: PlannedRouteCorrection[]
  movedStopIds: string[]
  stopIds: string[]
}

type ManifestRouteProposalReviewProps = {
  route: ManifestDraftRoute
  onBackToZones: () => void
  onStart: () => Promise<void>
  onSave: (
    adjustedStopIds: string[],
    corrections: PlannedRouteCorrection[],
    complete: boolean,
  ) => Promise<void>
}

type SortableStopCardProps = {
  disabled: boolean
  index: number
  onMoveTo: (position: number) => void
  stop: ManifestDraftRoute['sourceStops'][number]
  totalStops: number
  zone: string | null | undefined
}

function SortableStopCard({
  disabled,
  index,
  onMoveTo,
  stop,
  totalStops,
  zone,
}: SortableStopCardProps) {
  const sortable = useSortable({ id: stop.id, index, disabled })

  return (
    <li ref={sortable.ref} className={sortable.isDragging ? 'manifest-proposal-stop--dragging' : undefined}>
      <button
        className="proposal-drag-handle"
        type="button"
        ref={sortable.handleRef}
        disabled={disabled}
        aria-label={`Drag ${stop.name} to a new position`}
      >
        <span aria-hidden="true">⠿</span>
        Drag
      </button>
      <span className="stop-index">{index + 1}</span>
      <div className="stop-copy">
        <strong>{stop.name}</strong>
        <span>{stop.address}, {stop.city}</span>
        <small>{zone}</small>
      </div>
      <label className="proposal-position-select">
        Position
        <select
          aria-label={`Move ${stop.name} to position`}
          value={index + 1}
          disabled={disabled}
          onChange={(event) => onMoveTo(Number(event.target.value) - 1)}
        >
          {Array.from({ length: totalStops }, (_, position) => (
            <option key={position + 1} value={position + 1}>{position + 1}</option>
          ))}
        </select>
      </label>
    </li>
  )
}

function ManifestRouteProposalReview({ route, onBackToZones, onSave, onStart }: ManifestRouteProposalReviewProps) {
  const proposal = route.routeProposal as ManifestRouteProposal
  const [stopIds, setStopIds] = useState(
    route.adjustedStopIds.length > 0 ? route.adjustedStopIds : proposal.orderedStopIds,
  )
  const [corrections, setCorrections] = useState(route.plannedCorrections)
  const [movedStopIds, setMovedStopIds] = useState(
    route.plannedCorrections.flatMap((correction) => correction.stopId ? [correction.stopId] : []),
  )
  const [pendingCorrections, setPendingCorrections] = useState<PendingCorrection[]>([])
  const [draftCorrections, setDraftCorrections] = useState<PlannedRouteCorrection[]>([])
  const [orderHistory, setOrderHistory] = useState<EditSnapshot[]>([])
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [reasonNote, setReasonNote] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setStopIds(route.adjustedStopIds.length > 0 ? route.adjustedStopIds : proposal.orderedStopIds)
    setCorrections(route.plannedCorrections)
    setMovedStopIds(route.plannedCorrections.flatMap((correction) => correction.stopId ? [correction.stopId] : []))
    setOrderHistory([])
    setPendingCorrections([])
    setDraftCorrections([])
  }, [proposal.orderedStopIds, route.adjustedStopIds, route.plannedCorrections])

  const stopsById = new Map(route.sourceStops.map((stop) => [stop.id, stop]))
  const zonesByStopId = new Map(route.zoneReview.map((item) => [
    item.stopId,
    item.selectedMicroZone
      ? `${item.selectedZone} · ${item.selectedMicroZone}`
      : item.selectedZone,
  ]))
  const pending = pendingCorrections[0] ?? null
  const pendingTotal = draftCorrections.length + pendingCorrections.length

  function moveStop(fromIndex: number, toIndex: number) {
    if (pending || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= stopIds.length) return
    const next = moveStopToPosition(stopIds, fromIndex, toIndex)
    const movedStopId = stopIds[fromIndex]

    setOrderHistory((current) => [...current, { corrections, movedStopIds, stopIds }])
    setStopIds(next)
    setCorrections([])
    setMovedStopIds((current) => current.includes(movedStopId) ? current : [...current, movedStopId])
    setSelectedReasons([])
    setReasonNote('')
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled || pending) return
    const { source } = event.operation
    if (!isSortable(source) || source.initialIndex === source.index) return
    moveStop(source.initialIndex, source.index)
  }

  function undoLastMove() {
    const previous = orderHistory.at(-1)
    if (!previous || pending) return
    setStopIds(previous.stopIds)
    setCorrections(previous.corrections)
    setMovedStopIds(previous.movedStopIds)
    setOrderHistory((current) => current.slice(0, -1))
    setSelectedReasons([])
    setReasonNote('')
  }

  function resetToProposal() {
    if (pending || sameStopOrder(stopIds, proposal.orderedStopIds)) return
    setOrderHistory((current) => [...current, { corrections, movedStopIds, stopIds }])
    setStopIds(proposal.orderedStopIds)
    setCorrections([])
    setMovedStopIds([])
    setSelectedReasons([])
    setReasonNote('')
  }

  function finishReordering() {
    if (pending || sameStopOrder(stopIds, proposal.orderedStopIds)) return
    const changes = findIntentionalStopChanges(proposal.orderedStopIds, stopIds, movedStopIds)
    if (changes.length === 0) return
    setPendingCorrections(changes.map((change) => ({
      afterStopIds: stopIds,
      beforeStopIds: proposal.orderedStopIds,
      description: `${stopsById.get(change.stopId)?.name ?? 'This stop'} moved from position ${change.beforePosition} to ${change.afterPosition}. Why is this the better position?`,
      stopId: change.stopId,
    })))
    setDraftCorrections([])
    setSelectedReasons([])
    setReasonNote('')
  }

  function keepEditing() {
    setPendingCorrections([])
    setDraftCorrections([])
    setSelectedReasons([])
    setReasonNote('')
  }

  async function saveReason() {
    if (!pending || selectedReasons.length === 0) return
    const answeredCorrection = {
      ...pending,
      note: reasonNote.trim(),
      reasons: selectedReasons,
      recordedAt: new Date().toISOString(),
    }
    const nextCorrections = [...draftCorrections, answeredCorrection]

    if (pendingCorrections.length > 1) {
      setDraftCorrections(nextCorrections)
      setPendingCorrections((current) => current.slice(1))
      setSelectedReasons([])
      setReasonNote('')
      return
    }

    setSaveState('saving')
    setError('')
    try {
      await onSave(stopIds, nextCorrections, false)
      setCorrections(nextCorrections)
      setPendingCorrections([])
      setDraftCorrections([])
      setSelectedReasons([])
      setReasonNote('')
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'The planned correction could not be saved.')
    }
  }

  async function applyReasonToRemaining() {
    if (!pending || selectedReasons.length === 0) return
    const recordedAt = new Date().toISOString()
    const nextCorrections = [
      ...draftCorrections,
      ...pendingCorrections.map((correction) => ({
        ...correction,
        note: reasonNote.trim(),
        reasons: selectedReasons,
        recordedAt,
      })),
    ]

    setSaveState('saving')
    setError('')
    try {
      await onSave(stopIds, nextCorrections, false)
      setCorrections(nextCorrections)
      setPendingCorrections([])
      setDraftCorrections([])
      setSelectedReasons([])
      setReasonNote('')
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'The planned corrections could not be saved.')
    }
  }

  async function completeReview() {
    const orderAdjusted = !sameStopOrder(stopIds, proposal.orderedStopIds)
    const correctionMatchesOrder = corrections.some((correction) =>
      sameStopOrder(correction.afterStopIds, stopIds),
    )
    if (pending || (orderAdjusted && !correctionMatchesOrder)) return
    setSaveState('saving')
    setError('')
    try {
      await onSave(stopIds, orderAdjusted ? corrections : [], true)
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'The route review could not be completed.')
    }
  }

  async function startReviewedRoute() {
    setSaveState('saving')
    setError('')
    try {
      await onStart()
    } catch (startError) {
      setSaveState('idle')
      setError(startError instanceof Error ? startError.message : 'The route could not be started.')
    }
  }

  const orderAdjusted = !sameStopOrder(stopIds, proposal.orderedStopIds)
  const correctionMatchesOrder = corrections.some((correction) =>
    sameStopOrder(correction.afterStopIds, stopIds),
  )
  const localReviewMatchesSaved = route.status === 'proposal_reviewed' &&
    sameStopOrder(stopIds, route.adjustedStopIds) &&
    JSON.stringify(corrections) === JSON.stringify(route.plannedCorrections)

  return (
    <section className="manifest-proposal-review" aria-labelledby="manifest-proposal-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Slice 3 · Driver review</p>
          <h2 id="manifest-proposal-title">Proposed route</h2>
        </div>
        <span className="verified-badge">{stopIds.length} stops preserved</span>
      </div>

      <p className="manifest-route-setup__lede">
        Review the AI proposal before starting. The original proposal stays preserved while your
        planned corrections are saved separately.
      </p>

      <div className="manifest-proposal-summary">
        <div>
          <span>Verified macro flow</span>
          <strong>{proposal.macroZoneFlow.join(' → ')}</strong>
        </div>
        <div>
          <span>Approved lessons applied</span>
          <strong>{proposal.appliedLessonIds.length > 0 ? proposal.appliedLessonIds.join(', ') : 'None yet'}</strong>
        </div>
      </div>

      {proposal.transitions.length > 0 ? (
        <details className="proposal-supporting-details">
          <summary>Important transitions</summary>
          <ul>
            {proposal.transitions.map((transition) => (
              <li key={`${transition.fromZone}-${transition.toZone}`}>
                <strong>{transition.fromZone} → {transition.toZone}:</strong> {transition.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {proposal.operationalExceptions.length > 0 ? (
        <details className="proposal-supporting-details">
          <summary>Operational exceptions</summary>
          <ul>
            {proposal.operationalExceptions.map((exception) => <li key={exception}>{exception}</li>)}
          </ul>
        </details>
      ) : null}

      <details className="proposal-supporting-details">
        <summary>Routing documents used</summary>
        <ul>
          {proposal.documentsUsed.map((document) => <li key={document}>{document}</li>)}
        </ul>
      </details>

      <details className="proposal-supporting-details">
        <summary>Original AI proposal</summary>
        <ol className="original-proposal-order">
          {proposal.orderedStopIds.map((stopId) => (
            <li key={stopId}>{stopsById.get(stopId)?.name ?? 'Unknown stop'}</li>
          ))}
        </ol>
      </details>

      {proposal.uncertainSequences.length > 0 ? (
        <div className="zone-review-alert">
          <strong>Local order needs driver judgment</strong>
          {proposal.uncertainSequences.map((item) => (
            <span key={item.zone}>{item.zone}: {item.reason}</span>
          ))}
        </div>
      ) : null}

      <div className="section-heading section-heading--compact">
        <div>
          <p className="eyebrow">Adjustable</p>
          <h3>Driver starting order</h3>
        </div>
      </div>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <ol className="manifest-proposal-stop-list">
          {stopIds.map((stopId, index) => {
            const stop = stopsById.get(stopId)
            if (!stop) return null
            return (
              <SortableStopCard
                key={stopId}
                disabled={Boolean(pending) || saveState === 'saving'}
                index={index}
                onMoveTo={(position) => moveStop(index, position)}
                stop={stop}
                totalStops={stopIds.length}
                zone={zonesByStopId.get(stop.id)}
              />
            )
          })}
        </ol>
      </DragDropProvider>

      <div className="proposal-edit-actions">
        <button
          className="secondary-button"
          type="button"
          disabled={Boolean(pending) || saveState === 'saving' || orderHistory.length === 0}
          onClick={undoLastMove}
        >
          Undo Last Move
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={Boolean(pending) || saveState === 'saving' || !orderAdjusted}
          onClick={resetToProposal}
        >
          Reset to AI Proposal
        </button>
      </div>

      {orderAdjusted && !correctionMatchesOrder && !pending ? (
        <button className="primary-button" type="button" onClick={finishReordering}>
          Done Reordering
        </button>
      ) : null}

      {pending ? (
        <div className="proposal-final-reason">
          <div className="proposal-reason-progress">
            <strong>Change {draftCorrections.length + 1} of {pendingTotal}</strong>
            <span>Explain each stop you intentionally moved.</span>
          </div>
          <ReasonPrompt
            description={pending.description}
            kind="planned"
            note={reasonNote}
            onNoteChange={setReasonNote}
            onReasonToggle={(reason) => setSelectedReasons((current) =>
              current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]
            )}
            onSave={() => void saveReason()}
            saveLabel={pendingCorrections.length > 1 ? 'Save and Continue' : 'Save Final Starting Order'}
            selectedReasons={selectedReasons}
          />
          {pendingCorrections.length > 1 && selectedReasons.length > 0 ? (
            <button className="secondary-button" type="button" onClick={() => void applyReasonToRemaining()}>
              Use This Reason for All {pendingCorrections.length} Remaining Changes
            </button>
          ) : null}
          <button className="text-button" type="button" onClick={keepEditing}>Keep Editing</button>
        </div>
      ) : null}

      {!orderAdjusted ? (
        <p className="next-step-note">This matches the AI proposal, so no planned-correction reason is needed.</p>
      ) : null}

      {corrections.length > 0 ? (
        <p className="reason-capture-status">
          {corrections.length} planned {corrections.length === 1 ? 'correction reason' : 'correction reasons'} saved.
        </p>
      ) : null}
      {saveState === 'saved' && !pending ? <p className="reason-capture-status">Route review saved privately.</p> : null}
      {error ? <p className="photo-error" role="alert">{error}</p> : null}

      <button
        className="primary-button"
        type="button"
        disabled={Boolean(pending) || saveState === 'saving' || (orderAdjusted && !correctionMatchesOrder) || localReviewMatchesSaved}
        onClick={() => void completeReview()}
      >
        {localReviewMatchesSaved ? 'Driver Review Complete' : 'Complete Driver Review'}
      </button>

      {localReviewMatchesSaved ? (
        <button
          className="primary-button start-route-button"
          type="button"
          disabled={saveState === 'saving'}
          onClick={() => void startReviewedRoute()}
        >
          {saveState === 'saving' ? 'Starting route…' : 'Start Manifest Test Route'}
        </button>
      ) : (
        <p className="next-step-note">Complete Driver Review before starting this route.</p>
      )}

      <button className="text-button" type="button" onClick={onBackToZones}>
        Return to Zone Review
      </button>
      <p className="safety-note">This remains a private sandbox proposal and cannot affect production FreightIQ.</p>
    </section>
  )
}

export default ManifestRouteProposalReview
