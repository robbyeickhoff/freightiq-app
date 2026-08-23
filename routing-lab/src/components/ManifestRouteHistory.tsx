import { useState } from 'react'

import type { ManifestDraftRoute } from '../lib/route-persistence'

type ManifestRouteHistoryProps = {
  onDelete: (route: ManifestDraftRoute) => Promise<void>
  onReview: (route: ManifestDraftRoute) => void
  routes: ManifestDraftRoute[]
}

const statusLabels: Record<ManifestDraftRoute['status'], string> = {
  draft_setup: 'Setup not finished',
  zone_review: 'Zone review in progress',
  zone_approved: 'Zones approved',
  proposal_review: 'Route review in progress',
  proposal_reviewed: 'Ready to run',
  route_active: 'Route in progress',
  route_completed: 'Completed',
}

function routeZones(route: ManifestDraftRoute) {
  return [...new Set(route.zoneReview.flatMap((review) => review.selectedZone ? [review.selectedZone] : []))]
}

function formatRouteDate(routeDate: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
    .format(new Date(`${routeDate}T12:00:00`))
}

function ManifestRouteHistory({ onDelete, onReview, routes }: ManifestRouteHistoryProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  async function removeRoute(route: ManifestDraftRoute) {
    setIsDeleting(true)
    setError('')
    try {
      await onDelete(route)
      setPendingDeleteId(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The Test Route could not be deleted.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="route-history" aria-labelledby="route-history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Saved Test Routes</p>
          <h2 id="route-history-title">Past Routes</h2>
        </div>
        <span className="stop-count">{routes.length}</span>
      </div>
      <p className="route-history__lede">Open any saved route to review it, or remove a route you no longer need.</p>

      {routes.length === 0 ? (
        <div className="route-history__empty">
          <strong>No saved Test Routes</strong>
          <p>Routes you build from confirmed manifests will appear here.</p>
        </div>
      ) : (
        <ol className="route-history__list">
          {routes.map((route) => {
            const zones = routeZones(route)
            const pendingDelete = pendingDeleteId === route.id
            return (
              <li key={route.id}>
                <div className="route-history__heading">
                  <div>
                    <strong>{formatRouteDate(route.setup.routeDate)}</strong>
                    <span>{route.sourceStops.length} {route.sourceStops.length === 1 ? 'stop' : 'stops'} · {statusLabels[route.status]}</span>
                  </div>
                  <span className="verified-badge">{route.status === 'route_completed' ? 'Complete' : 'Saved'}</span>
                </div>
                <p className="route-history__zones">{zones.length > 0 ? zones.join(' · ') : 'No approved zones saved'}</p>
                <div className="route-history__actions">
                  <button className="secondary-button" type="button" onClick={() => onReview(route)}>Review route</button>
                  <button className="text-button" type="button" onClick={() => { setError(''); setPendingDeleteId(route.id) }}>Delete Test Route</button>
                </div>
                {pendingDelete ? (
                  <div className="manifest-reset-confirmation">
                    <strong>Delete this Test Route?</strong>
                    <p>This permanently removes this route and the zone learning and route lessons saved from it. Its original saved manifest will remain.</p>
                    <button className="danger-button" type="button" disabled={isDeleting} onClick={() => void removeRoute(route)}>
                      {isDeleting ? 'Deleting…' : 'Yes, delete this Test Route'}
                    </button>
                    <button type="button" disabled={isDeleting} onClick={() => setPendingDeleteId(null)}>Keep it</button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}
      {error ? <p className="photo-error" role="alert">{error}</p> : null}
    </section>
  )
}

export default ManifestRouteHistory
