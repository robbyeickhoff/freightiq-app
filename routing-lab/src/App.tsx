import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { gr001BaselineProposal, gr001Fixture } from './data/gr-001'
import type { GoldenRouteStop } from './data/gr-001'
import { getRoutingLabConfig } from './lib/config'
import { getSupabase } from './lib/supabase'

type StopOutcome = 'complete' | 'unable'

type StopEvent = {
  actionOrder: number
  recordedAt: string
  status: StopOutcome
}

function formatRecordedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkRequested, setLinkRequested] = useState(false)
  const [fixtureLoaded, setFixtureLoaded] = useState(false)
  const [proposalGenerated, setProposalGenerated] = useState(false)
  const [draftRouteStops, setDraftRouteStops] = useState<GoldenRouteStop[]>([])
  const [activeRouteStops, setActiveRouteStops] = useState<GoldenRouteStop[]>([])
  const [routeStartedAt, setRouteStartedAt] = useState<string | null>(null)
  const [stopEvents, setStopEvents] = useState<Record<string, StopEvent>>({})
  const [message, setMessage] = useState('')
  const config = getRoutingLabConfig()
  const routeStarted = routeStartedAt !== null
  const proposalAdjusted = draftRouteStops.some(
    (stop, index) => stop.name !== gr001BaselineProposal.stops[index]?.name,
  )
  const remainingStops = activeRouteStops.filter((stop) => !stopEvents[stop.name])
  const resolvedStops = activeRouteStops
    .filter((stop) => stopEvents[stop.name])
    .sort(
      (first, second) =>
        stopEvents[first.name].actionOrder -
        stopEvents[second.name].actionOrder,
    )

  useEffect(() => {
    const supabase = getSupabase()

    const acceptAuthorizedSession = async (nextSession: Session | null) => {
      const sessionEmail = nextSession?.user.email?.toLowerCase()

      if (nextSession && sessionEmail !== config.allowedEmail) {
        await supabase.auth.signOut()
        setSession(null)
        setMessage('This account is not approved for Routing Lab.')
        return
      }

      setSession(nextSession)
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message)
      } else {
        void acceptAuthorizedSession(data.session)
      }

      setIsCheckingSession(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void acceptAuthorizedSession(nextSession)
      setIsCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [config.allowedEmail])

  async function requestMagicLink() {
    setIsSubmitting(true)
    setMessage('')

    const { error } = await getSupabase().auth.signInWithOtp({
      email: config.allowedEmail,
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setLinkRequested(true)
      setMessage('Check your email and tap the private sign-in link.')
    }

    setIsSubmitting(false)
  }

  async function signOut() {
    setIsSubmitting(true)
    setMessage('')

    const { error } = await getSupabase().auth.signOut()

    if (error) {
      setMessage(error.message)
    } else {
      setLinkRequested(false)
    }

    setIsSubmitting(false)
  }

  function startRoute() {
    setActiveRouteStops([...draftRouteStops])
    setStopEvents({})
    setRouteStartedAt(new Date().toISOString())
  }

  function generateProposal() {
    setDraftRouteStops([...gr001BaselineProposal.stops])
    setProposalGenerated(true)
  }

  function moveDraftStop(currentIndex: number, direction: -1 | 1) {
    setDraftRouteStops((currentStops) => {
      const nextIndex = currentIndex + direction

      if (
        routeStarted ||
        nextIndex < 0 ||
        nextIndex >= currentStops.length
      ) {
        return currentStops
      }

      const reorderedStops = [...currentStops]
      const [movedStop] = reorderedStops.splice(currentIndex, 1)
      reorderedStops.splice(nextIndex, 0, movedStop)
      return reorderedStops
    })
  }

  function recordStopOutcome(stopName: string, status: StopOutcome) {
    setStopEvents((currentEvents) => {
      if (currentEvents[stopName]) {
        return currentEvents
      }

      return {
        ...currentEvents,
        [stopName]: {
          actionOrder: Object.keys(currentEvents).length + 1,
          recordedAt: new Date().toISOString(),
          status,
        },
      }
    })
  }

  if (isCheckingSession) {
    return (
      <main className="app-shell app-shell--centered">
        <p className="eyebrow">FreightIQ</p>
        <h1>Routing Lab</h1>
        <p className="status-message" role="status">
          Checking private access…
        </p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app-shell app-shell--centered">
        <section className="auth-card" aria-labelledby="sign-in-title">
          <div className="brand-mark" aria-hidden="true">
            FI
          </div>
          <p className="eyebrow">Private test environment</p>
          <h1 id="sign-in-title">Routing Lab</h1>
          <p className="lede">
            Learn from route corrections without touching production FreightIQ.
          </p>

          {!linkRequested ? (
            <button
              className="primary-button"
              type="button"
              disabled={isSubmitting}
              onClick={() => void requestMagicLink()}
            >
              {isSubmitting ? 'Sending link…' : 'Email my sign-in link'}
            </button>
          ) : (
            <div className="link-sent">
              <p>
                The link opens this private Routing Lab and signs you in. It can
                only be requested for the approved account.
              </p>
              <button
                className="text-button"
                type="button"
                disabled={isSubmitting}
                onClick={() => void requestMagicLink()}
              >
                {isSubmitting ? 'Sending…' : 'Send another link'}
              </button>
            </div>
          )}

          {message ? (
            <p className="status-message" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">FreightIQ</p>
          <h1>Routing Lab</h1>
        </div>
        <button
          className="text-button"
          type="button"
          disabled={isSubmitting}
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </header>

      <section className="mode-banner" aria-label="Current environment">
        <span className="status-dot" aria-hidden="true" />
        Test Route sandbox
      </section>

      <section className="fixture-card" aria-labelledby="fixture-title">
        <div className="fixture-card__heading">
          <div>
            <p className="eyebrow">Frozen golden route</p>
            <h2 id="fixture-title">{gr001Fixture.fixture_id}</h2>
          </div>
          <span className="stop-count">{gr001Fixture.stops.length} stops</span>
        </div>
        <p className="fixture-name">{gr001Fixture.title}</p>
        <p className="fixture-flow">
          {gr001Fixture.expected_macro_zone_order.join(' → ')}
        </p>
        <button
          className="primary-button"
          type="button"
          disabled={fixtureLoaded}
          onClick={() => setFixtureLoaded(true)}
        >
          {fixtureLoaded ? 'GR-001 loaded' : 'Load GR-001'}
        </button>
      </section>

      {fixtureLoaded ? (
        <section
          className="proposal-launch"
          aria-labelledby="proposal-launch-title"
        >
          <div>
            <p className="eyebrow">Controlled learning test</p>
            <h2 id="proposal-launch-title">Replay the baseline proposal</h2>
            <p>
              Keep the verified driver order intact while replaying the frozen
              AI proposal that existed before the Downtown correction.
            </p>
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={proposalGenerated}
            onClick={generateProposal}
          >
            {proposalGenerated
              ? 'Baseline proposal generated'
              : 'Generate proposed route'}
          </button>
        </section>
      ) : null}

      {proposalGenerated ? (
        <section
          className="proposal-card"
          aria-labelledby="proposed-route-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Baseline replay</p>
              <h2 id="proposed-route-title">Proposed route</h2>
            </div>
            <span className="baseline-badge">
              {proposalAdjusted
                ? 'Driver-adjusted plan'
                : gr001BaselineProposal.label}
            </span>
          </div>

          <p className="proposal-explanation">
            {proposalAdjusted
              ? 'This is your adjusted starting plan. The original historical AI proposal remains preserved for comparison.'
              : 'This is the preserved historical AI proposal—not the correct driver route. Reorder it before starting if you want to make a planned correction.'}
          </p>

          <div className="proposal-summary" aria-label="Proposal summary">
            <div>
              <span>Stops</span>
              <strong>{draftRouteStops.length}</strong>
            </div>
            <div>
              <span>Macro zones</span>
              <strong>{gr001Fixture.expected_macro_zone_order.length}</strong>
            </div>
            <div>
              <span>Return</span>
              <strong>Grand Junction</strong>
            </div>
          </div>

          <div className="proposal-insights">
            <article className="insight-card">
              <p className="insight-label">Macro flow</p>
              <p>
                {gr001Fixture.expected_macro_zone_order.join(' → ')}
              </p>
            </article>

            <article className="insight-card">
              <p className="insight-label">Accepted flexibility</p>
              <ul>
                {gr001Fixture.acceptable_variations.map((variation) => (
                  <li key={variation.stops.join('-')}>
                    {variation.stops.join(' / ')}: {variation.reason}
                  </li>
                ))}
              </ul>
            </article>

            <article className="review-flag">
              <div>
                <p className="insight-label">Needs driver review</p>
                <h3>{gr001Fixture.meaningful_ai_correction.area}</h3>
              </div>
              <p>
                The frozen AI baseline ends with Brandon Quattrone. The
                driver-validated order places that stop first in Downtown and
                finishes with FCI Constructors.
              </p>
            </article>
          </div>

          <div className="stop-list-heading">
            <h3>
              {proposalAdjusted
                ? 'Driver-approved starting order'
                : 'Baseline stop order'}
            </h3>
            <span>{routeStarted ? 'Locked' : 'Adjustable'}</span>
          </div>

          <ol className="stop-list proposal-list">
            {draftRouteStops.map((stop, index) => (
              <li
                key={`${stop.name}-${stop.address}`}
                className={
                  stop.name === 'Brandon Quattrone'
                    ? 'proposal-list__learning-stop'
                    : undefined
                }
              >
                <div className="stop-index" aria-hidden="true" />
                <div className="stop-copy">
                  <strong>{stop.name}</strong>
                  <span>
                    {stop.address}, {stop.city}
                  </span>
                </div>
                <span className="zone-badge">{stop.zone}</span>
                {!routeStarted ? (
                  <div
                    className="proposal-reorder-controls"
                    aria-label={`Reorder ${stop.name}`}
                  >
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveDraftStop(index, -1)}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={index === draftRouteStops.length - 1}
                      onClick={() => moveDraftStop(index, 1)}
                    >
                      Move down
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          <p className="next-step-note">
            {routeStarted
              ? 'Route started. The baseline proposal is locked for later comparison.'
              : 'Review the baseline proposal, then lock it as today’s active route.'}
          </p>

          <button
            className="primary-button start-route-button"
            type="button"
            disabled={routeStarted}
            onClick={startRoute}
          >
            {routeStarted
              ? 'Route in progress'
              : proposalAdjusted
                ? 'Start Driver-Adjusted Test Route'
                : 'Start Baseline Test Route'}
          </button>
        </section>
      ) : null}

      {routeStarted ? (
        <section className="active-route" aria-labelledby="active-route-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active test route</p>
              <h2 id="active-route-title">Track the run</h2>
            </div>
            <span className="active-badge">In progress</span>
          </div>

          <div className="active-route-summary" aria-label="Active route summary">
            <div>
              <span>Started</span>
              <strong>{formatRecordedTime(routeStartedAt)}</strong>
            </div>
            <div>
              <span>Resolved</span>
              <strong>
                {resolvedStops.length} of {activeRouteStops.length}
              </strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong>{remainingStops.length}</strong>
            </div>
          </div>

          <p className="active-route-guidance">
            Tap the result for the stop you actually service. Unfinished stops
            stay in the locked proposal order.
          </p>

          {remainingStops.length > 0 ? (
            <>
              <div className="stop-list-heading">
                <h3>Remaining stops</h3>
                <span>{remainingStops.length} open</span>
              </div>

              <ol className="active-stop-list">
                {remainingStops.map((stop) => {
                  const proposedPosition =
                    activeRouteStops.findIndex(
                      (activeStop) => activeStop.name === stop.name,
                    ) + 1

                  return (
                    <li key={`${stop.name}-${stop.address}`}>
                      <div className="active-stop-heading">
                        <span className="proposed-position">
                          {proposedPosition}
                        </span>
                        <div className="stop-copy">
                          <strong>{stop.name}</strong>
                          <span>
                            {stop.address}, {stop.city}
                          </span>
                        </div>
                        <span className="zone-badge">{stop.zone}</span>
                      </div>
                      <div className="stop-actions">
                        <button
                          className="complete-button"
                          type="button"
                          onClick={() =>
                            recordStopOutcome(stop.name, 'complete')
                          }
                        >
                          Complete
                        </button>
                        <button
                          className="unable-button"
                          type="button"
                          onClick={() =>
                            recordStopOutcome(stop.name, 'unable')
                          }
                        >
                          Unable
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          ) : (
            <p className="route-resolved-message">
              Every stop has been resolved. Finishing and reviewing the route
              comes in the next Slice 1 step.
            </p>
          )}

          {resolvedStops.length > 0 ? (
            <details className="resolved-stops">
              <summary>
                Resolved stops
                <span>{resolvedStops.length}</span>
              </summary>
              <ol>
                {resolvedStops.map((stop) => {
                  const stopEvent = stopEvents[stop.name]

                  return (
                    <li key={`${stop.name}-${stopEvent.recordedAt}`}>
                      <span className="actual-position">
                        {stopEvent.actionOrder}
                      </span>
                      <div className="stop-copy">
                        <strong>{stop.name}</strong>
                        <span>
                          {stopEvent.status === 'complete'
                            ? 'Completed'
                            : 'Unable'}{' '}
                          at {formatRecordedTime(stopEvent.recordedAt)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </details>
          ) : null}
        </section>
      ) : null}

      {fixtureLoaded ? (
        <details className="route-details reference-route">
          <summary className="reference-summary">
            <div>
              <p className="eyebrow">Reference outcome</p>
              <h2>Driver-verified route</h2>
            </div>
            <span className="verified-badge">Reference only</span>
          </summary>

          <div className="reference-route-content">
            <p className="reference-explanation">
              This known result is used later to evaluate the learning test. It
              is not an active route and does not have a Start button.
            </p>

            <div className="section-heading">
              <div>
                <p className="eyebrow">Verified fixture data</p>
                <h2>Route setup</h2>
              </div>
              <span className="verified-badge">Verified</span>
            </div>

            <dl className="route-facts">
              <div>
                <dt>Date</dt>
                <dd>{gr001Fixture.route_date}</dd>
              </div>
              <div>
                <dt>Route type</dt>
                <dd>{gr001Fixture.route_type}</dd>
              </div>
              <div>
                <dt>Start and return</dt>
                <dd>{gr001Fixture.start}</dd>
              </div>
              <div>
                <dt>Return affects order</dt>
                <dd>
                  {gr001Fixture.return_to_terminal_affects_order ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>

            <div className="stop-list-heading">
              <h3>Driver-verified order</h3>
              <span>{gr001Fixture.stops.length} total</span>
            </div>

            <ol className="stop-list">
              {gr001Fixture.stops.map((stop) => (
                <li key={`${stop.name}-${stop.address}`}>
                  <div className="stop-index" aria-hidden="true" />
                  <div className="stop-copy">
                    <strong>{stop.name}</strong>
                    <span>
                      {stop.address}, {stop.city}
                    </span>
                  </div>
                  <span className="zone-badge">{stop.zone}</span>
                </li>
              ))}
            </ol>
          </div>
        </details>
      ) : null}

      <p className="safety-note">
        Sandbox routes and lessons cannot affect production FreightIQ.
      </p>

      {message ? (
        <p className="status-message" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </main>
  )
}

export default App
