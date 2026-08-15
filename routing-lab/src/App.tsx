import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'

import EndOfRouteReview from './components/EndOfRouteReview'
import type { ReviewStage, SandboxLesson } from './components/EndOfRouteReview'
import ManifestIntake from './components/ManifestIntake'
import ManifestRouteSetup from './components/ManifestRouteSetup'
import ReasonPrompt from './components/ReasonPrompt'
import {
  gr001BaselineProposal,
  gr001Fixture,
  gr001LearnedProposal,
} from './data/gr-001'
import type { GoldenRouteStop } from './data/gr-001'
import { getRoutingLabConfig } from './lib/config'
import type { Json } from './lib/database'
import {
  reorderItem,
  recordRouteStopOutcome,
  resolveStopsById,
  sequencesMatch,
  startRouteRun,
} from './lib/route-domain'
import type {
  PendingReason,
  ReasonRecord,
  StopEvent,
  StopOutcome,
} from './lib/route-domain'
import { getSupabase } from './lib/supabase'
import {
  loadLatestManifestDraftRoute,
  saveManifestRouteSetup,
} from './lib/route-persistence'
import type { ManifestDraftRoute, RouteSetup } from './lib/route-persistence'

type ProposalSource = 'baseline' | 'learned'
type Workspace = 'manifest-intake' | 'test-route'
type TestRouteMode = 'fixture' | 'manifest-draft'

type SavedFixtureState = {
  activeRouteStopIds?: string[]
  activeRouteStopNames?: string[]
  draftRouteStopIds?: string[]
  draftRouteStopNames?: string[]
  fixtureLoaded: boolean
  pendingReason: PendingReason | null
  proposalGenerated: boolean
  proposalSource: ProposalSource
  reasonNote: string
  reasonRecords: ReasonRecord[]
  remainingStopIds?: string[]
  remainingStopNames?: string[]
  reviewStage: ReviewStage
  routeFinishedAt: string | null
  routeStartedAt: string | null
  selectedReasons: string[]
  stopEvents: Record<string, StopEvent>
}

function formatRecordedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function passwordMeetsRequirements(password: string) {
  return (
    password.length >= 16 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

function App() {
  const [workspace, setWorkspace] = useState<Workspace>('test-route')
  const [testRouteMode, setTestRouteMode] = useState<TestRouteMode>('fixture')
  const [manifestDraftRoute, setManifestDraftRoute] = useState<ManifestDraftRoute | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmedPassword, setConfirmedPassword] = useState('')
  const [passwordRecoveryRequested, setPasswordRecoveryRequested] = useState(false)
  const [passwordEditorOpen, setPasswordEditorOpen] = useState(false)
  const [fixtureLoaded, setFixtureLoaded] = useState(false)
  const [proposalGenerated, setProposalGenerated] = useState(false)
  const [proposalSource, setProposalSource] =
    useState<ProposalSource>('baseline')
  const [draftRouteStops, setDraftRouteStops] = useState<GoldenRouteStop[]>([])
  const [activeRouteStops, setActiveRouteStops] = useState<GoldenRouteStop[]>([])
  const [remainingStopIds, setRemainingStopIds] = useState<string[]>([])
  const [routeStartedAt, setRouteStartedAt] = useState<string | null>(null)
  const [routeFinishedAt, setRouteFinishedAt] = useState<string | null>(null)
  const [stopEvents, setStopEvents] = useState<Record<string, StopEvent>>({})
  const [pendingReason, setPendingReason] = useState<PendingReason | null>(null)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [reasonNote, setReasonNote] = useState('')
  const [reasonRecords, setReasonRecords] = useState<ReasonRecord[]>([])
  const [approvedLesson, setApprovedLesson] = useState<SandboxLesson | null>(null)
  const [reviewStage, setReviewStage] = useState<ReviewStage>('choice')
  const [hasLoadedSavedState, setHasLoadedSavedState] = useState(false)
  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false)
  const [message, setMessage] = useState('')
  const config = getRoutingLabConfig()
  const routeStarted = routeStartedAt !== null
  const routeFinished = routeFinishedAt !== null
  const learnedRerun = proposalSource === 'learned'
  const sourceProposal = learnedRerun
    ? gr001LearnedProposal
    : gr001BaselineProposal
  const proposalAdjusted =
    !learnedRerun &&
    draftRouteStops.some(
      (stop, index) => stop.id !== gr001BaselineProposal.stops[index]?.id,
    )
  const remainingStops = resolveStopsById(remainingStopIds, activeRouteStops)
  const resolvedStops = activeRouteStops
    .filter((stop) => stopEvents[stop.id])
    .sort(
      (first, second) =>
        stopEvents[first.id].actionOrder -
        stopEvents[second.id].actionOrder,
    )
  const correctionStopNames = new Set(
    gr001Fixture.meaningful_ai_correction.ai_sequence,
  )
  const startingCorrectionOrder = activeRouteStops
    .filter((stop) => correctionStopNames.has(stop.name))
    .map((stop) => stop.name)
  const actualCorrectionOrder = resolvedStops
    .filter(
      (stop) =>
        correctionStopNames.has(stop.name) &&
        stopEvents[stop.id].status === 'complete',
    )
    .map((stop) => stop.name)
  const meaningfulCorrectionDetected =
    sequencesMatch(
      startingCorrectionOrder,
      gr001Fixture.meaningful_ai_correction.driver_sequence,
    ) ||
    sequencesMatch(
      actualCorrectionOrder,
      gr001Fixture.meaningful_ai_correction.driver_sequence,
    )
  const proposedCorrectionOrder = draftRouteStops
    .filter((stop) => correctionStopNames.has(stop.name))
    .map((stop) => stop.name)
  const learnedProposalPasses =
    learnedRerun &&
    sequencesMatch(
      proposedCorrectionOrder,
      gr001Fixture.meaningful_ai_correction.driver_sequence,
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
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordEditorOpen(true)
        setMessage('Create a new Routing Lab password to finish recovery.')
      }
      void acceptAuthorizedSession(nextSession)
      setIsCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [config.allowedEmail])

  useEffect(() => {
    if (!session) {
      setHasLoadedSavedState(false)
      return
    }

    const supabase = getSupabase()

    async function loadSavedState() {
      const [stateResult, lessonResult] = await Promise.all([
        supabase
          .from('routing_lab_fixture_state')
          .select('state')
          .eq('user_id', session!.user.id)
          .eq('fixture_id', gr001Fixture.fixture_id)
          .maybeSingle(),
        supabase
          .from('routing_lab_sandbox_lessons')
          .select('category, scope, strength, lesson_text')
          .eq('user_id', session!.user.id)
          .eq('fixture_id', gr001Fixture.fixture_id)
          .maybeSingle(),
      ])

      if (stateResult.error || lessonResult.error) {
        setMessage(stateResult.error?.message ?? lessonResult.error?.message ?? '')
        setHasLoadedSavedState(true)
        return
      }

      const saved = stateResult.data?.state as SavedFixtureState | undefined
      const stopIdForLegacyName = (name: string) =>
        gr001Fixture.stops.find((stop) => stop.name === name)?.id
      const migrateStopIds = (ids?: string[], names?: string[]) =>
        ids ?? names?.map(stopIdForLegacyName).filter((id): id is string => Boolean(id)) ?? []
      const migrateStopEvents = (events: Record<string, StopEvent>) =>
        Object.fromEntries(
          Object.entries(events).flatMap(([key, event]) => {
            const stopId = gr001Fixture.stops.some((stop) => stop.id === key)
              ? key
              : stopIdForLegacyName(key)

            return stopId ? [[stopId, event]] : []
          }),
        )

      if (saved) {
        const draftStopIds = migrateStopIds(
          saved.draftRouteStopIds,
          saved.draftRouteStopNames,
        )
        const activeStopIds = migrateStopIds(
          saved.activeRouteStopIds,
          saved.activeRouteStopNames,
        )

        setFixtureLoaded(saved.fixtureLoaded)
        setProposalGenerated(saved.proposalGenerated)
        setProposalSource(saved.proposalSource)
        setDraftRouteStops(resolveStopsById(draftStopIds, gr001Fixture.stops))
        setActiveRouteStops(resolveStopsById(activeStopIds, gr001Fixture.stops))
        setRemainingStopIds(
          migrateStopIds(saved.remainingStopIds, saved.remainingStopNames),
        )
        setRouteStartedAt(saved.routeStartedAt)
        setRouteFinishedAt(saved.routeFinishedAt)
        setStopEvents(migrateStopEvents(saved.stopEvents))
        setPendingReason(saved.pendingReason)
        setSelectedReasons(saved.selectedReasons)
        setReasonNote(saved.reasonNote)
        setReasonRecords(saved.reasonRecords)
        setReviewStage(saved.reviewStage ?? 'choice')
      }

      if (lessonResult.data) {
        setApprovedLesson({
          category: lessonResult.data.category,
          scope: lessonResult.data.scope,
          strength: lessonResult.data.strength as SandboxLesson['strength'],
          text: lessonResult.data.lesson_text,
        })
      }

      setHasLoadedSavedState(true)
    }

    void loadSavedState()
  }, [session])

  useEffect(() => {
    if (!session) {
      setManifestDraftRoute(null)
      setTestRouteMode('fixture')
      return
    }

    let active = true
    void loadLatestManifestDraftRoute()
      .then((route) => {
        if (!active || !route) return
        setManifestDraftRoute(route)
        setTestRouteMode('manifest-draft')
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Saved draft route could not be restored.')
        }
      })

    return () => { active = false }
  }, [session])

  function openManifestDraftRoute(route: ManifestDraftRoute) {
    setManifestDraftRoute(route)
    setTestRouteMode('manifest-draft')
    setWorkspace('test-route')
  }

  async function saveDraftRouteSetup(setup: RouteSetup) {
    if (!manifestDraftRoute) return
    await saveManifestRouteSetup(manifestDraftRoute.id, setup)
    setManifestDraftRoute({ ...manifestDraftRoute, setup })
  }

  useEffect(() => {
    if (!session || !hasLoadedSavedState) {
      return
    }

    const state: SavedFixtureState = {
      activeRouteStopIds: activeRouteStops.map((stop) => stop.id),
      draftRouteStopIds: draftRouteStops.map((stop) => stop.id),
      fixtureLoaded,
      pendingReason,
      proposalGenerated,
      proposalSource,
      reasonNote,
      reasonRecords,
      remainingStopIds,
      reviewStage,
      routeFinishedAt,
      routeStartedAt,
      selectedReasons,
      stopEvents,
    }

    const saveTimer = window.setTimeout(() => {
      void getSupabase()
        .from('routing_lab_fixture_state')
        .upsert({
          fixture_id: gr001Fixture.fixture_id,
          state: state as unknown as Json,
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
        })
        .then(({ error }) => {
          if (error) {
            setMessage(`Could not save test progress: ${error.message}`)
          }
        })
    }, 250)

    return () => window.clearTimeout(saveTimer)
  }, [
    activeRouteStops, draftRouteStops, fixtureLoaded, hasLoadedSavedState,
    pendingReason, proposalGenerated, proposalSource, reasonNote, reasonRecords,
    remainingStopIds, reviewStage, routeFinishedAt, routeStartedAt,
    selectedReasons, session, stopEvents,
  ])

  async function signInWithPassword() {
    setIsSubmitting(true)
    setMessage('')

    const { error } = await getSupabase().auth.signInWithPassword({
      email: config.allowedEmail,
      password,
    })

    if (error) {
      setMessage('The email or password is incorrect.')
    } else {
      setPassword('')
    }

    setIsSubmitting(false)
  }

  async function requestPasswordRecovery() {
    setIsSubmitting(true)
    setMessage('')

    const { error } = await getSupabase().auth.resetPasswordForEmail(
      config.allowedEmail,
      { redirectTo: window.location.origin },
    )

    if (error) {
      setMessage(error.message)
    } else {
      setPasswordRecoveryRequested(true)
      setMessage('Check your email for the private password-recovery link.')
    }

    setIsSubmitting(false)
  }

  async function saveNewPassword() {
    if (!passwordMeetsRequirements(newPassword)) {
      setMessage(
        'Use at least 16 characters with uppercase, lowercase, a number, and a symbol.',
      )
      return
    }

    if (newPassword !== confirmedPassword) {
      setMessage('The two password entries do not match.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    const { error } = await getSupabase().auth.updateUser({ password: newPassword })

    if (error) {
      setMessage(error.message)
    } else {
      setNewPassword('')
      setConfirmedPassword('')
      setPasswordEditorOpen(false)
      setMessage('Routing Lab password saved.')
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
      setPassword('')
      setPasswordEditorOpen(false)
    }

    setIsSubmitting(false)
  }

  function startRoute() {
    const routeRun = startRouteRun(
      draftRouteStops.map((stop) => stop.id),
      new Date().toISOString(),
    )

    setActiveRouteStops([...draftRouteStops])
    setRemainingStopIds(routeRun.remainingStopIds)
    setStopEvents(routeRun.stopEvents)
    setRouteStartedAt(routeRun.routeStartedAt)
    setRouteFinishedAt(routeRun.routeFinishedAt)
  }

  function generateProposal() {
    setDraftRouteStops([...gr001BaselineProposal.stops])
    setProposalSource('baseline')
    setProposalGenerated(true)
  }

  function rerunWithApprovedLesson() {
    if (!approvedLesson) {
      return
    }

    setProposalSource('learned')
    setDraftRouteStops([...gr001LearnedProposal.stops])
    setProposalGenerated(true)
    setActiveRouteStops([])
    setRemainingStopIds([])
    setRouteStartedAt(null)
    setRouteFinishedAt(null)
    setStopEvents({})
    setPendingReason(null)
    setSelectedReasons([])
    setReasonNote('')
    setReasonRecords([])
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

      const reorderedStops = reorderItem(currentStops, currentIndex, direction)

      const stillAdjusted = reorderedStops.some(
        (stop, index) =>
          stop.id !== sourceProposal.stops[index]?.id,
      )

      setPendingReason(
        stillAdjusted
          ? {
              description:
                'Your starting plan no longer matches the original AI proposal. Finish arranging it, then tell Routing Lab why you changed the order.',
              kind: 'planned',
            }
          : null,
      )

      if (!stillAdjusted) {
        setSelectedReasons([])
        setReasonNote('')
      }

      return reorderedStops
    })
  }

  function moveRemainingStop(currentIndex: number, direction: -1 | 1) {
    setRemainingStopIds((currentStopIds) => {
      const reorderedStopIds = reorderItem(
        currentStopIds,
        currentIndex,
        direction,
      )

      if (reorderedStopIds === currentStopIds) {
        return currentStopIds
      }

      setPendingReason({
        description:
          'You changed the order of the unfinished route. Finish arranging the stops, then tell Routing Lab why the active plan changed.',
        kind: 'active',
      })

      return reorderedStopIds
    })
  }

  function recordStopOutcome(stopId: string, status: StopOutcome) {
    const result = recordRouteStopOutcome(
      remainingStopIds,
      stopEvents,
      stopId,
      status,
      new Date().toISOString(),
    )
    const stop = activeRouteStops.find((routeStop) => routeStop.id === stopId)
    const expectedStop = activeRouteStops.find(
      (routeStop) => routeStop.id === result.expectedStopId,
    )

    setStopEvents(result.stopEvents)
    setRemainingStopIds(result.remainingStopIds)

    if (result.outOfOrder) {
      setPendingReason({
        description: `${stop?.name ?? 'This stop'} was completed while ${expectedStop?.name ?? 'another stop'} was next in the active plan. Tell Routing Lab why the stop was completed out of order.`,
        kind: 'active',
      })
    }
  }

  function toggleReason(reason: string) {
    setSelectedReasons((currentReasons) =>
      currentReasons.includes(reason)
        ? currentReasons.filter((currentReason) => currentReason !== reason)
        : [...currentReasons, reason],
    )
  }

  function savePendingReason() {
    if (!pendingReason || selectedReasons.length === 0) {
      return
    }

    setReasonRecords((currentRecords) => [
      ...currentRecords,
      {
        ...pendingReason,
        note: reasonNote.trim(),
        reasons: selectedReasons,
        recordedAt: new Date().toISOString(),
      },
    ])
    setPendingReason(null)
    setSelectedReasons([])
    setReasonNote('')
  }

  function finishRoute() {
    if (
      remainingStops.length > 0 ||
      pendingReason ||
      !routeStarted ||
      routeFinished
    ) {
      return
    }

    setRouteFinishedAt(new Date().toISOString())
  }

  async function approveSandboxLesson(lesson: SandboxLesson) {
    if (!session) return false

    const { error } = await getSupabase()
      .from('routing_lab_sandbox_lessons')
      .upsert({
        approved_at: new Date().toISOString(),
        category: lesson.category,
        fixture_id: gr001Fixture.fixture_id,
        lesson_text: lesson.text,
        scope: lesson.scope,
        strength: lesson.strength,
        user_id: session.user.id,
      })

    if (error) {
      setMessage(`Could not save sandbox lesson: ${error.message}`)
      return false
    }

    setApprovedLesson(lesson)
    setReviewStage('approved')
    return true
  }

  async function resetFixture() {
    if (!session) return

    const supabase = getSupabase()
    const [stateResult, lessonResult] = await Promise.all([
      supabase.from('routing_lab_fixture_state').delete()
        .eq('user_id', session.user.id).eq('fixture_id', gr001Fixture.fixture_id),
      supabase.from('routing_lab_sandbox_lessons').delete()
        .eq('user_id', session.user.id).eq('fixture_id', gr001Fixture.fixture_id),
    ])

    if (stateResult.error || lessonResult.error) {
      setMessage(`Could not reset saved test data: ${stateResult.error?.message ?? lessonResult.error?.message}`)
      return
    }

    setHasLoadedSavedState(false)
    setFixtureLoaded(false)
    setProposalGenerated(false)
    setProposalSource('baseline')
    setDraftRouteStops([])
    setActiveRouteStops([])
    setRemainingStopIds([])
    setRouteStartedAt(null)
    setRouteFinishedAt(null)
    setStopEvents({})
    setPendingReason(null)
    setSelectedReasons([])
    setReasonNote('')
    setReasonRecords([])
    setApprovedLesson(null)
    setReviewStage('choice')
    setResetConfirmationOpen(false)
    setMessage('GR-001 test data reset. You remain signed in.')
    window.setTimeout(() => setHasLoadedSavedState(true), 0)
  }

  if (isCheckingSession || (session && !hasLoadedSavedState)) {
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

          <form
            className="password-sign-in"
            onSubmit={(event) => {
              event.preventDefault()
              void signInWithPassword()
            }}
          >
            <label>
              Email
              <input value={config.allowedEmail} type="email" disabled />
            </label>
            <label>
              Password
              <input
                value={password}
                type="password"
                autoComplete="current-password"
                required
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary-button" type="submit" disabled={isSubmitting || !password}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <button
            className="text-button password-recovery-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => void requestPasswordRecovery()}
          >
            {passwordRecoveryRequested ? 'Send recovery email again' : 'Set or reset password'}
          </button>

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
        <div className="account-actions">
          <button
            className="text-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setPasswordEditorOpen((current) => !current)
              setMessage('')
            }}
          >
            {passwordEditorOpen ? 'Close password setup' : 'Set or change password'}
          </button>
          <button
            className="text-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      </header>

      {passwordEditorOpen ? (
        <section className="password-editor" aria-labelledby="password-editor-title">
          <div>
            <p className="eyebrow">Private account</p>
            <h2 id="password-editor-title">Set Routing Lab password</h2>
          </div>
          <p>
            Use at least 16 characters with uppercase, lowercase, a number, and
            a symbol. A password manager is recommended.
          </p>
          <label>
            New password
            <input
              value={newPassword}
              type="password"
              autoComplete="new-password"
              minLength={16}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              value={confirmedPassword}
              type="password"
              autoComplete="new-password"
              minLength={16}
              onChange={(event) => setConfirmedPassword(event.target.value)}
            />
          </label>
          <button
            className="primary-button"
            type="button"
            disabled={isSubmitting || !newPassword || !confirmedPassword}
            onClick={() => void saveNewPassword()}
          >
            {isSubmitting ? 'Saving password…' : 'Save password'}
          </button>
        </section>
      ) : null}

      <section className="mode-banner" aria-label="Current environment">
        <span className="status-dot" aria-hidden="true" />
        Private Routing Lab sandbox
      </section>

      <nav className="workspace-switcher" aria-label="Routing Lab workspace">
        <button
          type="button"
          aria-current={workspace === 'test-route' ? 'page' : undefined}
          onClick={() => setWorkspace('test-route')}
        >
          Test Route
        </button>
        <button
          type="button"
          aria-current={workspace === 'manifest-intake' ? 'page' : undefined}
          onClick={() => setWorkspace('manifest-intake')}
        >
          Manifest Intake
        </button>
      </nav>

      {workspace === 'manifest-intake' ? (
        <ManifestIntake onOpenDraftRoute={openManifestDraftRoute} />
      ) : testRouteMode === 'manifest-draft' && manifestDraftRoute ? (
        <ManifestRouteSetup
          route={manifestDraftRoute}
          onBackToFixture={() => setTestRouteMode('fixture')}
          onSave={saveDraftRouteSetup}
        />
      ) : (
        <>

      {manifestDraftRoute ? (
        <button
          className="secondary-button resume-manifest-route"
          type="button"
          onClick={() => setTestRouteMode('manifest-draft')}
        >
          Resume manifest Test Route setup
        </button>
      ) : null}

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
              ? learnedRerun
                ? 'Learned proposal generated'
                : 'Baseline proposal generated'
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
              <p className="eyebrow">
                {learnedRerun ? 'Learned rerun' : 'Baseline replay'}
              </p>
              <h2 id="proposed-route-title">Proposed route</h2>
            </div>
            <span className="baseline-badge">
              {learnedRerun
                ? gr001LearnedProposal.label
                : proposalAdjusted
                ? 'Driver-adjusted plan'
                : gr001BaselineProposal.label}
            </span>
          </div>

          <p className="proposal-explanation">
            {learnedRerun
              ? 'This proposal was generated with your approved sandbox lesson. The original baseline remains preserved for comparison.'
              : proposalAdjusted
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

            <article
              className={learnedProposalPasses ? 'lesson-pass' : 'review-flag'}
            >
              <div>
                <p className="insight-label">
                  {learnedProposalPasses
                    ? 'Lesson verification passed'
                    : 'Needs driver review'}
                </p>
                <h3>{gr001Fixture.meaningful_ai_correction.area}</h3>
              </div>
              <p>
                {learnedProposalPasses
                  ? 'The approved sandbox lesson moved Brandon Quattrone ahead of Idarado Mining, Tribe Interior Design, and FCI Constructors.'
                  : 'The frozen AI baseline ends with Brandon Quattrone. The driver-validated order places that stop first in Downtown and finishes with FCI Constructors.'}
              </p>
            </article>
          </div>

          <div className="stop-list-heading">
            <h3>
              {learnedRerun
                ? 'Learned proposal order'
                : proposalAdjusted
                ? 'Driver-approved starting order'
                : 'Baseline stop order'}
            </h3>
            <span>{routeStarted ? 'Locked' : 'Adjustable'}</span>
          </div>

          <ol className="stop-list proposal-list">
            {draftRouteStops.map((stop, index) => (
              <li
                key={stop.id}
                className={
                  stop.name === 'Brandon Quattrone'
                    ? learnedProposalPasses
                      ? 'proposal-list__learned-stop'
                      : 'proposal-list__learning-stop'
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
            {routeFinished
              ? 'Route complete. The starting plan remains locked for review.'
              : routeStarted
              ? 'Route started. The proposal is locked for later comparison.'
              : learnedRerun
                ? 'The approved lesson changed the proposal. Review it, then start the learned test route if desired.'
                : 'Review the baseline proposal, then lock it as today’s active route.'}
          </p>

          <button
            className="primary-button start-route-button"
            type="button"
            disabled={routeStarted || pendingReason?.kind === 'planned'}
            onClick={startRoute}
          >
            {routeStarted
              ? routeFinished
                ? 'Route complete'
                : 'Route in progress'
              : pendingReason?.kind === 'planned'
                ? 'Save reason before starting'
              : learnedRerun
                ? 'Start Learned Test Route'
              : proposalAdjusted
                ? 'Start Driver-Adjusted Test Route'
                : 'Start Baseline Test Route'}
          </button>
        </section>
      ) : null}

      {pendingReason?.kind === 'planned' ? (
        <ReasonPrompt
          description={pendingReason.description}
          kind={pendingReason.kind}
          note={reasonNote}
          selectedReasons={selectedReasons}
          onNoteChange={setReasonNote}
          onReasonToggle={toggleReason}
          onSave={savePendingReason}
        />
      ) : null}

      {routeStarted ? (
        <section className="active-route" aria-labelledby="active-route-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Active test route</p>
              <h2 id="active-route-title">Track the run</h2>
            </div>
            <span className="active-badge">
              {routeFinished ? 'Complete' : 'In progress'}
            </span>
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
              <span>{routeFinished ? 'Finished' : 'Remaining'}</span>
              <strong>
                {routeFinishedAt
                  ? formatRecordedTime(routeFinishedAt)
                  : remainingStops.length}
              </strong>
            </div>
          </div>

          <p className="active-route-guidance">
            Tap the result for the stop you actually service. You can adjust
            the unfinished order while the locked starting plan stays preserved
            for comparison.
          </p>

          {reasonRecords.length > 0 ? (
            <p className="reason-capture-status">
              {reasonRecords.length}{' '}
              {reasonRecords.length === 1 ? 'reason' : 'reasons'} saved for
              end-of-day review.
            </p>
          ) : null}

          {pendingReason?.kind === 'active' ? (
            <ReasonPrompt
              description={pendingReason.description}
              kind={pendingReason.kind}
              note={reasonNote}
              selectedReasons={selectedReasons}
              onNoteChange={setReasonNote}
              onReasonToggle={toggleReason}
              onSave={savePendingReason}
            />
          ) : null}

          {remainingStops.length > 0 ? (
            <>
              <div className="stop-list-heading">
                <h3>Remaining stops</h3>
                <span>{remainingStops.length} open</span>
              </div>

              <ol className="active-stop-list">
                {remainingStops.map((stop, index) => {
                  const proposedPosition =
                    activeRouteStops.findIndex(
                      (activeStop) => activeStop.id === stop.id,
                    ) + 1

                  return (
                    <li key={stop.id}>
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
                          disabled={pendingReason?.kind === 'active'}
                          onClick={() =>
                            recordStopOutcome(stop.id, 'complete')
                          }
                        >
                          Complete
                        </button>
                        <button
                          className="unable-button"
                          type="button"
                          disabled={pendingReason?.kind === 'active'}
                          onClick={() =>
                            recordStopOutcome(stop.id, 'unable')
                          }
                        >
                          Unable
                        </button>
                      </div>
                      <div
                        className="active-reorder-controls"
                        aria-label={`Reorder unfinished stop ${stop.name}`}
                      >
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveRemainingStop(index, -1)}
                        >
                          Move up
                        </button>
                        <button
                          type="button"
                          disabled={index === remainingStops.length - 1}
                          onClick={() => moveRemainingStop(index, 1)}
                        >
                          Move down
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </>
          ) : (
            <div className="route-finish-panel">
              <p className="route-resolved-message">
                Every stop has been resolved. Finish the route to begin the
                learning review.
              </p>
              <button
                className="primary-button"
                type="button"
                disabled={routeFinished || Boolean(pendingReason)}
                onClick={finishRoute}
              >
                {routeFinished ? 'Route finished' : 'Finish Route'}
              </button>
            </div>
          )}

          {resolvedStops.length > 0 ? (
            <details className="resolved-stops">
              <summary>
                Resolved stops
                <span>{resolvedStops.length}</span>
              </summary>
              <ol>
                {resolvedStops.map((stop) => {
                  const stopEvent = stopEvents[stop.id]

                  return (
                    <li key={`${stop.id}-${stopEvent.recordedAt}`}>
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

      {routeFinished ? (
        <EndOfRouteReview
          actualOrder={actualCorrectionOrder}
          expectedLesson={gr001Fixture.meaningful_ai_correction.lesson}
          initialStage={reviewStage}
          meaningfulCorrectionDetected={meaningfulCorrectionDetected}
          originalOrder={gr001Fixture.meaningful_ai_correction.ai_sequence}
          reasons={reasonRecords}
          startingOrder={startingCorrectionOrder}
          onApproveLesson={approveSandboxLesson}
          onStageChange={setReviewStage}
        />
      ) : null}

      {approvedLesson && !learnedRerun ? (
        <section className="sandbox-lesson-status" aria-labelledby="rerun-title">
          <p className="eyebrow">Approved sandbox lesson</p>
          <h2 id="rerun-title">Test what the Lab learned</h2>
          <p>“{approvedLesson.text}”</p>
          <button
            className="primary-button"
            type="button"
            onClick={rerunWithApprovedLesson}
          >
            Rerun GR-001 with lesson
          </button>
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
                <li key={stop.id}>
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

      {fixtureLoaded ? (
        <section className="reset-panel" aria-labelledby="reset-title">
          {!resetConfirmationOpen ? (
            <>
              <div>
                <p className="eyebrow">Test controls</p>
                <h2 id="reset-title">Reset GR-001</h2>
              </div>
              <p>
                Clear this fixture’s route progress, reasons, review, and
                sandbox lesson while keeping your private sign-in active.
              </p>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setResetConfirmationOpen(true)}
              >
                Reset GR-001 test
              </button>
            </>
          ) : (
            <div className="reset-confirmation">
              <div>
                <p className="eyebrow">Confirm reset</p>
                <h2 id="reset-title">Clear all GR-001 test data?</h2>
              </div>
              <p>
                This removes the current route, captured reasons, review state,
                and approved sandbox lesson from the Routing Lab sandbox. It does
                not affect production FreightIQ.
              </p>
              <div className="reset-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setResetConfirmationOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="discard-button"
                  type="button"
                  onClick={() => void resetFixture()}
                >
                  Reset all test data
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

        </>
      )}

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
