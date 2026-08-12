import { useState } from 'react'

export type SandboxLesson = {
  category: string
  scope: string
  strength: 'Hard rule' | 'Preferred' | 'Situational'
  text: string
}

type ReviewReason = {
  description: string
  note: string
  reasons: string[]
}

type EndOfRouteReviewProps = {
  actualOrder: string[]
  expectedLesson: string
  initialStage?: ReviewStage
  meaningfulCorrectionDetected: boolean
  onApproveLesson: (lesson: SandboxLesson) => Promise<boolean>
  onStageChange?: (stage: ReviewStage) => void
  originalOrder: string[]
  reasons: ReviewReason[]
  startingOrder: string[]
}

export type ReviewStage =
  | 'approved'
  | 'choice'
  | 'deferred'
  | 'discarded'
  | 'lesson'
  | 'review'

const strengths: SandboxLesson['strength'][] = [
  'Hard rule',
  'Preferred',
  'Situational',
]

function RouteSequence({ label, stops }: { label: string; stops: string[] }) {
  return (
    <div className="review-sequence">
      <span>{label}</span>
      <p>{stops.join(' → ')}</p>
    </div>
  )
}

function EndOfRouteReview({
  actualOrder,
  expectedLesson,
  initialStage = 'choice',
  meaningfulCorrectionDetected,
  onApproveLesson,
  onStageChange,
  originalOrder,
  reasons,
  startingOrder,
}: EndOfRouteReviewProps) {
  const [stage, setStageState] = useState<ReviewStage>(initialStage)
  const [lessonText, setLessonText] = useState(expectedLesson)
  const [strength, setStrength] =
    useState<SandboxLesson['strength']>('Preferred')
  const [isEditing, setIsEditing] = useState(false)

  function setStage(nextStage: ReviewStage) {
    setStageState(nextStage)
    onStageChange?.(nextStage)
  }

  async function approveLesson() {
    const lesson = {
      category: 'Zone flow',
      scope: 'Downtown Telluride',
      strength,
      text: lessonText.trim(),
    } satisfies SandboxLesson

    if (await onApproveLesson(lesson)) {
      setStage('approved')
    }
  }

  return (
    <section className="end-review" aria-labelledby="end-review-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">End-of-route review</p>
          <h2 id="end-review-title">Review the learning event</h2>
        </div>
        <span className="review-badge">Route complete</span>
      </div>

      {stage === 'choice' ? (
        <div className="review-choice">
          <p>
            Routing Lab found the completed route and is ready to compare it
            with the original proposal.
          </p>
          <div className="review-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => setStage('review')}
            >
              Review Now
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setStage('deferred')}
            >
              Review Later
            </button>
          </div>
        </div>
      ) : null}

      {stage === 'deferred' ? (
        <div className="review-state-message">
          <h3>Review held for later</h3>
          <p>
            This review is saved and remains available when you return.
          </p>
          <button
            className="primary-button"
            type="button"
            onClick={() => setStage('review')}
          >
            Review Now
          </button>
        </div>
      ) : null}

      {stage === 'review' ? (
        <div className="review-content">
          {meaningfulCorrectionDetected ? (
            <>
              <article className="meaningful-difference">
                <p className="insight-label">Meaningful difference</p>
                <h3>Downtown Telluride flow corrected</h3>
                <RouteSequence label="Original AI proposal" stops={originalOrder} />
                <RouteSequence
                  label="Driver-approved starting plan"
                  stops={startingOrder}
                />
                <RouteSequence label="Actual completed order" stops={actualOrder} />
              </article>

              <div className="review-reasons">
                <h3>Reasons captured</h3>
                {reasons.length > 0 ? (
                  reasons.map((reason, index) => (
                    <article key={`${reason.description}-${index}`}>
                      <p>{reason.reasons.join(' · ')}</p>
                      {reason.note ? <span>“{reason.note}”</span> : null}
                    </article>
                  ))
                ) : (
                  <p>No driver reason was captured for this correction.</p>
                )}
              </div>

              <div className="remember-choice">
                <h3>Should Routing Lab remember this correction?</h3>
                <p>
                  Nothing becomes a lesson unless you explicitly approve it.
                </p>
                <div className="review-actions">
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setStage('lesson')}
                  >
                    Yes, draft a lesson
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setStage('discarded')}
                  >
                    No, don’t remember it
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="review-state-message">
              <h3>No reusable GR-001 correction detected</h3>
              <p>
                The completed route did not reproduce the documented Downtown
                Telluride correction, so Routing Lab will not draft a lesson.
              </p>
            </div>
          )}
        </div>
      ) : null}

      {stage === 'lesson' ? (
        <div className="lesson-draft">
          <div className="lesson-draft__heading">
            <div>
              <p className="insight-label">Sandbox lesson draft</p>
              <h3>Downtown Telluride route flow</h3>
            </div>
            <span>Not active</span>
          </div>

          <dl className="lesson-facts">
            <div>
              <dt>Category</dt>
              <dd>Zone flow</dd>
            </div>
            <div>
              <dt>Suggested scope</dt>
              <dd>Downtown Telluride</dd>
            </div>
          </dl>

          {isEditing ? (
            <label className="lesson-editor">
              <span>Lesson text</span>
              <textarea
                value={lessonText}
                maxLength={500}
                onChange={(event) => setLessonText(event.target.value)}
              />
            </label>
          ) : (
            <p className="lesson-text">{lessonText}</p>
          )}

          <fieldset className="strength-picker">
            <legend>Rule strength</legend>
            <div>
              {strengths.map((option) => (
                <label key={option}>
                  <input
                    type="radio"
                    name="lesson-strength"
                    value={option}
                    checked={strength === option}
                    onChange={() => setStrength(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <details className="lesson-evidence">
            <summary>View evidence snapshot</summary>
            <RouteSequence label="Original AI proposal" stops={originalOrder} />
            <RouteSequence label="Actual completed order" stops={actualOrder} />
          </details>

          <div className="lesson-actions">
            <button
              className="primary-button"
              type="button"
              disabled={lessonText.trim().length === 0}
              onClick={() => void approveLesson()}
            >
              {isEditing ? 'Save edited lesson' : 'Save as written'}
            </button>
            {!isEditing ? (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            ) : null}
            <button
              className="discard-button"
              type="button"
              onClick={() => setStage('discarded')}
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {stage === 'approved' ? (
        <div className="review-state-message review-state-message--success">
          <h3>Sandbox lesson approved</h3>
          <p>
            The lesson is saved in the Routing Lab sandbox. Applying it to a
            new GR-001 proposal is the next Slice 1 step.
          </p>
        </div>
      ) : null}

      {stage === 'discarded' ? (
        <div className="review-state-message">
          <h3>Review complete</h3>
          <p>No sandbox lesson was saved from this correction.</p>
        </div>
      ) : null}
    </section>
  )
}

export default EndOfRouteReview
