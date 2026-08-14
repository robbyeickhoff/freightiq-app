import { useState } from 'react'

import type { ManifestDraftRoute, RouteSetup } from '../lib/route-persistence'

type ManifestRouteSetupProps = {
  route: ManifestDraftRoute
  onBackToFixture: () => void
  onSave: (setup: RouteSetup) => Promise<void>
}

function ManifestRouteSetup({ route, onBackToFixture, onSave }: ManifestRouteSetupProps) {
  const [setup, setSetup] = useState(route.setup)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  function updateSetup<TKey extends keyof RouteSetup>(key: TKey, value: RouteSetup[TKey]) {
    setSetup((current) => ({ ...current, [key]: value }))
    setSaveState('idle')
  }

  async function saveSetup() {
    setSaveState('saving')
    setError('')

    try {
      await onSave(setup)
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'Route setup could not be saved.')
    }
  }

  const setupComplete = Boolean(
    setup.routeDate && setup.startLocation.trim() && setup.returnLocation.trim(),
  )

  return (
    <section className="manifest-route-setup" aria-labelledby="manifest-route-setup-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Slice 3 · Draft Test Route</p>
          <h2 id="manifest-route-setup-title">Route setup</h2>
        </div>
        <span className="verified-badge">{route.sourceStops.length} confirmed stops</span>
      </div>

      <p className="manifest-route-setup__lede">
        These stops were copied from the confirmed manifest. The manifest and its
        extraction evidence remain unchanged.
      </p>

      <div className="route-setup-fields">
        <label>
          Route date
          <input
            type="date"
            value={setup.routeDate}
            onChange={(event) => updateSetup('routeDate', event.target.value)}
          />
        </label>
        <label>
          Start location
          <input
            value={setup.startLocation}
            placeholder="Where the route begins"
            onChange={(event) => updateSetup('startLocation', event.target.value)}
          />
        </label>
        <label>
          Return location
          <input
            value={setup.returnLocation}
            placeholder="Where the route finishes"
            onChange={(event) => updateSetup('returnLocation', event.target.value)}
          />
        </label>
        <label className="route-setup-checkbox">
          <input
            type="checkbox"
            checked={setup.returnAffectsOrder}
            onChange={(event) => updateSetup('returnAffectsOrder', event.target.checked)}
          />
          The return path affects today’s route order
        </label>
        <label>
          Whole-route constraint <span>Optional</span>
          <textarea
            value={setup.wholeRouteConstraint}
            placeholder="Add only a constraint that affects the whole route."
            onChange={(event) => updateSetup('wholeRouteConstraint', event.target.value)}
          />
        </label>
      </div>

      <button
        className="primary-button"
        type="button"
        disabled={!setupComplete || saveState === 'saving'}
        onClick={() => void saveSetup()}
      >
        {saveState === 'saving' ? 'Saving route setup…' : 'Save Route Setup'}
      </button>

      {!setupComplete ? (
        <p className="next-step-note">Enter the date, start, and return location to save this draft.</p>
      ) : null}
      {saveState === 'saved' ? (
        <p className="reason-capture-status">Route setup saved privately. Zone review is the next Slice 3 unit.</p>
      ) : null}
      {error ? <p className="photo-error" role="alert">{error}</p> : null}

      <details className="manifest-route-stops">
        <summary>
          Confirmed stops copied into this route
          <span>{route.sourceStops.length}</span>
        </summary>
        <ol className="stop-list">
          {route.sourceStops.map((stop) => (
            <li key={stop.id}>
              <div className="stop-index" aria-hidden="true" />
              <div className="stop-copy">
                <strong>{stop.name}</strong>
                <span>{stop.address}, {stop.city}, {stop.state} {stop.postalCode}</span>
              </div>
            </li>
          ))}
        </ol>
      </details>

      <button className="text-button" type="button" onClick={onBackToFixture}>
        Return to GR-001 test
      </button>
      <p className="safety-note">
        This draft exists only in the private Routing Lab and cannot affect production FreightIQ.
      </p>
    </section>
  )
}

export default ManifestRouteSetup
