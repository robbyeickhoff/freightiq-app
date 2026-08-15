const reasonOptions = [
  'Better road flow',
  'Better setup for previous or next stop',
  'Right-turn advantage',
  'Trailer access',
  'Time constraint',
  'Pickup',
  'Customer-specific reason',
  'Vehicle positioning',
  'Other',
] as const

type ReasonPromptProps = {
  description: string
  kind: 'active' | 'planned'
  note: string
  onNoteChange: (note: string) => void
  onReasonToggle: (reason: string) => void
  onSave: () => void
  selectedReasons: string[]
  saveLabel?: string
}

function ReasonPrompt({
  description,
  kind,
  note,
  onNoteChange,
  onReasonToggle,
  onSave,
  selectedReasons,
  saveLabel = 'Save reason',
}: ReasonPromptProps) {
  const title =
    kind === 'planned'
      ? 'Why did you adjust the starting plan?'
      : 'Why did the route change?'

  return (
    <section className="reason-prompt" aria-labelledby="reason-prompt-title">
      <p className="eyebrow">Reason needed</p>
      <h2 id="reason-prompt-title">{title}</h2>
      <p className="reason-prompt__description">{description}</p>

      <fieldset>
        <legend>Select every reason that applies</legend>
        <div className="reason-options">
          {reasonOptions.map((reason) => (
            <label key={reason}>
              <input
                type="checkbox"
                checked={selectedReasons.includes(reason)}
                onChange={() => onReasonToggle(reason)}
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="reason-note">
        <span>Optional note</span>
        <textarea
          value={note}
          maxLength={240}
          placeholder="Add a short detail that could help later."
          onChange={(event) => onNoteChange(event.target.value)}
        />
      </label>

      <button
        className="primary-button"
        type="button"
        disabled={selectedReasons.length === 0}
        onClick={onSave}
      >
        {saveLabel}
      </button>
    </section>
  )
}

export default ReasonPrompt
