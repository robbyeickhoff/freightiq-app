import { useEffect, useState, type ReactNode } from 'react'
import { DragDropProvider, type DragEndEvent } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'

import ReasonPrompt from './ReasonPrompt'
import type {
  ManifestRouteProposal,
  PlannedRouteCorrection,
} from '../lib/manifest-route-proposal'
import type { ManifestDraftRoute } from '../lib/route-persistence'

type PendingCorrection = {
  afterStopIds: string[]
  beforeStopIds: string[]
  description: string
  stopId: string
}

type ManifestRouteProposalReviewProps = {
  route: ManifestDraftRoute
  onBackToZones: () => void
  onSave: (
    adjustedStopIds: string[],
    corrections: PlannedRouteCorrection[],
    complete: boolean,
  ) => Promise<void>
}

type SortableStopCardProps = {
  children?: ReactNode
  disabled: boolean
  index: number
  onMoveTo: (position: number) => void
  stop: ManifestDraftRoute['sourceStops'][number]
  totalStops: number
  zone: string | null | undefined
}

function SortableStopCard({
  children,
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
      {children}
    </li>
  )
}

function ManifestRouteProposalReview({ route, onBackToZones, onSave }: ManifestRouteProposalReviewProps) {
  const proposal = route.routeProposal as ManifestRouteProposal
  const [stopIds, setStopIds] = useState(
    route.adjustedStopIds.length > 0 ? route.adjustedStopIds : proposal.orderedStopIds,
  )
  const [corrections, setCorrections] = useState(route.plannedCorrections)
  const [pending, setPending] = useState<PendingCorrection | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [reasonNote, setReasonNote] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setStopIds(route.adjustedStopIds.length > 0 ? route.adjustedStopIds : proposal.orderedStopIds)
    setCorrections(route.plannedCorrections)
  }, [proposal.orderedStopIds, route.adjustedStopIds, route.plannedCorrections])

  const stopsById = new Map(route.sourceStops.map((stop) => [stop.id, stop]))
  const zonesByStopId = new Map(route.zoneReview.map((item) => [item.stopId, item.selectedZone]))

  function moveStop(fromIndex: number, toIndex: number, stopId: string) {
    if (pending || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= stopIds.length) return
    const next = [...stopIds]
    const [movedStopId] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, movedStopId)

    setStopIds(next)
    const movedStop = stopsById.get(stopId)
    setPending({
      afterStopIds: next,
      beforeStopIds: stopIds,
      description: `${movedStop?.name ?? 'This stop'} moved from position ${fromIndex + 1} to position ${toIndex + 1}. Why is this the better sequence?`,
      stopId,
    })
    setSelectedReasons([])
    setReasonNote('')
  }

  function handleDragEnd(event: DragEndEvent) {
    if (event.canceled || pending) return
    const { source } = event.operation
    if (!isSortable(source) || source.initialIndex === source.index) return
    moveStop(source.initialIndex, source.index, String(source.id))
  }

  function undoPendingMove() {
    if (!pending) return
    setStopIds(pending.beforeStopIds)
    setPending(null)
    setSelectedReasons([])
    setReasonNote('')
  }

  async function saveReason() {
    if (!pending || selectedReasons.length === 0) return
    const nextCorrections = [
      ...corrections,
      {
        ...pending,
        note: reasonNote.trim(),
        reasons: selectedReasons,
        recordedAt: new Date().toISOString(),
      },
    ]

    setSaveState('saving')
    setError('')
    try {
      await onSave(stopIds, nextCorrections, false)
      setCorrections(nextCorrections)
      setPending(null)
      setSelectedReasons([])
      setReasonNote('')
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'The planned correction could not be saved.')
    }
  }

  async function completeReview() {
    setSaveState('saving')
    setError('')
    try {
      await onSave(stopIds, corrections, true)
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'The route review could not be completed.')
    }
  }

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
            const isPendingStop = pending?.stopId === stopId
            return (
              <SortableStopCard
                key={stopId}
                disabled={Boolean(pending)}
                index={index}
                onMoveTo={(position) => moveStop(index, position, stopId)}
                stop={stop}
                totalStops={stopIds.length}
                zone={zonesByStopId.get(stop.id)}
              >
                {isPendingStop ? (
                  <div className="inline-position-reason">
                    <ReasonPrompt
                      description={pending.description}
                      kind="planned"
                      note={reasonNote}
                      onNoteChange={setReasonNote}
                      onReasonToggle={(reason) => setSelectedReasons((current) =>
                        current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]
                      )}
                      onSave={() => void saveReason()}
                      saveLabel="Save new position"
                      selectedReasons={selectedReasons}
                    />
                    <button className="text-button" type="button" onClick={undoPendingMove}>Undo move</button>
                  </div>
                ) : null}
              </SortableStopCard>
            )
          })}
        </ol>
      </DragDropProvider>

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
        disabled={Boolean(pending) || saveState === 'saving' || route.status === 'proposal_reviewed'}
        onClick={() => void completeReview()}
      >
        {route.status === 'proposal_reviewed' ? 'Driver Review Complete' : 'Complete Driver Review'}
      </button>
      <p className="next-step-note">Starting and running this route will be added in Slice 3 Unit 5.</p>

      <button className="text-button" type="button" onClick={onBackToZones}>
        Return to Zone Review
      </button>
      <p className="safety-note">This remains a private sandbox proposal and cannot affect production FreightIQ.</p>
    </section>
  )
}

export default ManifestRouteProposalReview
