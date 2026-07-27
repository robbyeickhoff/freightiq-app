import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import { gr001Fixture } from './data/gr-001'
import { getRoutingLabConfig } from './lib/config'
import { getSupabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkRequested, setLinkRequested] = useState(false)
  const [fixtureLoaded, setFixtureLoaded] = useState(false)
  const [message, setMessage] = useState('')
  const config = getRoutingLabConfig()

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
        <section className="route-details" aria-labelledby="route-details-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Verified fixture data</p>
              <h2 id="route-details-title">Route setup</h2>
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
            <h3>Verified stops</h3>
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
        </section>
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
