import { useMemo, useState } from 'react'

import ReasonPrompt from './ReasonPrompt'
import {
  recordRouteStopOutcome,
  reorderItem,
  resolveStopsById,
} from '../lib/route-domain'
import type { PendingReason, StopOutcome } from '../lib/route-domain'
import type {
  ManifestDraftRoute,
  ManifestRouteRunState,
} from '../lib/route-persistence'

type ManifestRouteExecutionProps = {
  route: ManifestDraftRoute
  onSave: (runState: ManifestRouteRunState) => Promise<void>
}

function formatRecordedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function ManifestRouteExecution({ route, onSave }: ManifestRouteExecutionProps) {
  if (!route.runState) throw new Error('The manifest route has not been started.')

  const [runState, setRunState] = useState(route.runState)
  const [selectedReasons, setSelectedReasons] = useState(route.runState.selectedReasons)
  const [reasonNote, setReasonNote] = useState(route.runState.reasonNote)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const activeStops = useMemo(
    () => resolveStopsById(route.adjustedStopIds, route.sourceStops),
    [route.adjustedStopIds, route.sourceStops],
  )
  const remainingStops = resolveStopsById(runState.remainingStopIds, activeStops)
  const resolvedStops = activeStops
    .filter((stop) => runState.stopEvents[stop.id])
    .sort((first, second) =>
      runState.stopEvents[first.id].actionOrder - runState.stopEvents[second.id].actionOrder,
    )

  async function persist(next: ManifestRouteRunState) {
    setRunState(next)
    setIsSaving(true)
    setError('')
    try {
      await onSave(next)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The active route could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  async function recordOutcome(stopId: string, status: StopOutcome) {
    const result = recordRouteStopOutcome(
      runState.remainingStopIds,
      runState.stopEvents,
      stopId,
      status,
      new Date().toISOString(),
    )
    const stop = activeStops.find((item) => item.id === stopId)
    const expectedStop = activeStops.find((item) => item.id === result.expectedStopId)
    const pendingReason: PendingReason | null = result.outOfOrder
      ? {
          description: `${stop?.name ?? 'This stop'} was completed while ${expectedStop?.name ?? 'another stop'} was next. Why was this the better sequence?`,
          kind: 'active',
        }
      : null

    await persist({
      ...runState,
      pendingReason,
      reasonNote: '',
      remainingStopIds: result.remainingStopIds,
      selectedReasons: [],
      stopEvents: result.stopEvents,
    })
    setSelectedReasons([])
    setReasonNote('')
  }

  async function moveRemainingStop(index: number, direction: -1 | 1) {
    const remainingStopIds = reorderItem(runState.remainingStopIds, index, direction)
    if (remainingStopIds === runState.remainingStopIds) return
    await persist({
      ...runState,
      pendingReason: {
        description: 'You changed the order of the unfinished route. Why is this the better active sequence?',
        kind: 'active',
      },
      reasonNote: '',
      remainingStopIds,
      selectedReasons: [],
    })
    setSelectedReasons([])
    setReasonNote('')
  }

  async function saveReason() {
    if (!runState.pendingReason || selectedReasons.length === 0) return
    const next = {
      ...runState,
      pendingReason: null,
      reasonNote: '',
      reasonRecords: [
        ...runState.reasonRecords,
        {
          ...runState.pendingReason,
          note: reasonNote.trim(),
          reasons: selectedReasons,
          recordedAt: new Date().toISOString(),
        },
      ],
      selectedReasons: [],
    }
    setSelectedReasons([])
    setReasonNote('')
    await persist(next)
  }

  async function finishRoute() {
    if (runState.remainingStopIds.length > 0 || runState.pendingReason || runState.routeFinishedAt) return
    await persist({ ...runState, routeFinishedAt: new Date().toISOString() })
  }

  return (
    <section className="active-route" aria-labelledby="manifest-active-route-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Manifest-derived Test Route</p>
          <h2 id="manifest-active-route-title">Track the run</h2>
        </div>
        <span className="active-badge">{runState.routeFinishedAt ? 'Complete' : 'In progress'}</span>
      </div>

      <div className="active-route-summary" aria-label="Active route summary">
        <div><span>Started</span><strong>{formatRecordedTime(runState.routeStartedAt)}</strong></div>
        <div><span>Completed</span><strong>{resolvedStops.length} of {activeStops.length}</strong></div>
        <div>
          <span>{runState.routeFinishedAt ? 'Finished' : 'Remaining'}</span>
          <strong>{runState.routeFinishedAt ? formatRecordedTime(runState.routeFinishedAt) : remainingStops.length}</strong>
        </div>
      </div>

      <p className="active-route-guidance">
        Tap the result for the stop you actually service. The original AI proposal and your locked
        starting order remain preserved separately.
      </p>

      {runState.reasonRecords.length > 0 ? (
        <p className="reason-capture-status">
          {runState.reasonRecords.length} {runState.reasonRecords.length === 1 ? 'reason' : 'reasons'} saved.
        </p>
      ) : null}

      {runState.pendingReason ? (
        <ReasonPrompt
          description={runState.pendingReason.description}
          kind="active"
          note={reasonNote}
          onNoteChange={setReasonNote}
          onReasonToggle={(reason) => setSelectedReasons((current) =>
            current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]
          )}
          onSave={() => void saveReason()}
          selectedReasons={selectedReasons}
        />
      ) : null}

      {remainingStops.length > 0 ? (
        <>
          <div className="stop-list-heading"><h3>Remaining stops</h3><span>{remainingStops.length} open</span></div>
          <ol className="active-stop-list">
            {remainingStops.map((stop, index) => (
              <li key={stop.id}>
                <div className="active-stop-heading">
                  <span className="proposed-position">{activeStops.findIndex((item) => item.id === stop.id) + 1}</span>
                  <div className="stop-copy">
                    <strong>{stop.name}</strong>
                    <span>{stop.address}, {stop.city}</span>
                  </div>
                  <span className="zone-badge">{stop.zone}</span>
                </div>
                <div className="stop-actions">
                  <button className="complete-button" type="button" disabled={isSaving || Boolean(runState.pendingReason)} onClick={() => void recordOutcome(stop.id, 'complete')}>Complete</button>
                  <button className="unable-button" type="button" disabled={isSaving || Boolean(runState.pendingReason)} onClick={() => void recordOutcome(stop.id, 'unable')}>Unable</button>
                </div>
                <div className="active-reorder-controls" aria-label={`Reorder unfinished stop ${stop.name}`}>
                  <button type="button" disabled={isSaving || Boolean(runState.pendingReason) || index === 0} onClick={() => void moveRemainingStop(index, -1)}>Move up</button>
                  <button type="button" disabled={isSaving || Boolean(runState.pendingReason) || index === remainingStops.length - 1} onClick={() => void moveRemainingStop(index, 1)}>Move down</button>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="route-finish-panel">
          <p className="route-resolved-message">Every stop has been completed or marked unable. Finish the route to preserve the completed run.</p>
          <button className="primary-button" type="button" disabled={isSaving || Boolean(runState.pendingReason) || Boolean(runState.routeFinishedAt)} onClick={() => void finishRoute()}>
            {runState.routeFinishedAt ? 'Route finished' : 'Finish Route'}
          </button>
        </div>
      )}

      {resolvedStops.length > 0 ? (
        <details className="resolved-stops">
          <summary>Completed stops <span>{resolvedStops.length}</span></summary>
          <ol>
            {resolvedStops.map((stop) => {
              const event = runState.stopEvents[stop.id]
              return (
                <li key={`${stop.id}-${event.recordedAt}`}>
                  <span className="actual-position">{event.actionOrder}</span>
                  <div className="stop-copy">
                    <strong>{stop.name}</strong>
                    <span>{event.status === 'complete' ? 'Completed' : 'Unable'} at {formatRecordedTime(event.recordedAt)}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        </details>
      ) : null}

      {error ? <p className="photo-error" role="alert">{error}</p> : null}
      <p className="safety-note">This run remains in the private Routing Lab and cannot affect production FreightIQ.</p>
    </section>
  )
}

export default ManifestRouteExecution
