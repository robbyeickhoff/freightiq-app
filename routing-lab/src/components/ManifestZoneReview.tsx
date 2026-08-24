import { useEffect, useState } from 'react'

import type { ManifestDraftRoute } from '../lib/route-persistence'
import {
  selectableOperationalZones,
  type ZoneClassification,
} from '../lib/zone-classification'
import {
  grandJunctionParentZones,
  isGrandJunctionParentZone,
  isMicroZoneParent,
  microZonesForParent,
} from '../lib/zone-learning'

type ManifestZoneReviewProps = {
  isGenerating: boolean
  route: ManifestDraftRoute
  onBackToSetup: () => void
  onGenerateProposal: () => Promise<void>
  onOpenProposal: () => void
  onSave: (classifications: ZoneClassification[], complete: boolean) => Promise<void>
}

function ManifestZoneReview({
  route,
  isGenerating,
  onBackToSetup,
  onGenerateProposal,
  onOpenProposal,
  onSave,
}: ManifestZoneReviewProps) {
  const [classifications, setClassifications] = useState(route.zoneReview)
  const [expandedStopIds, setExpandedStopIds] = useState(() => new Set(
    route.zoneReview
      .filter((item) => item.status !== 'approved' && (
        item.status === 'unresolved' || item.confidence === 'low' || item.confidence === 'uncertain'
      ))
      .map((item) => item.stopId),
  ))
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [error, setError] = useState('')

  useEffect(() => setClassifications(route.zoneReview), [route.zoneReview])

  useEffect(() => {
    const attentionIds = route.zoneReview
      .filter((item) => item.status !== 'approved' && (
        item.status === 'unresolved' || item.confidence === 'low' || item.confidence === 'uncertain'
      ))
      .map((item) => item.stopId)

    setExpandedStopIds((current) => new Set([...current, ...attentionIds]))
  }, [route.zoneReview])

  const stopsById = new Map(route.sourceStops.map((stop) => [stop.id, stop]))
  const approvedCount = classifications.filter((item) => item.status === 'approved').length
  const unresolvedCount = classifications.filter((item) => item.status === 'unresolved').length
  const complete = classifications.length === route.sourceStops.length &&
    classifications.every((item) => item.status === 'approved' && item.selectedZone && (
      !isMicroZoneParent(item.selectedZone) || item.selectedMicroZone
    ))
  const zoneReviewApproved = route.status === 'zone_approved' ||
    route.status === 'proposal_review' || route.status === 'proposal_reviewed'

  async function persist(next: ZoneClassification[], finalize = false) {
    setClassifications(next)
    setSaveState('saving')
    setError('')
    try {
      await onSave(next, finalize)
      setSaveState('saved')
    } catch (saveError) {
      setSaveState('idle')
      setError(saveError instanceof Error ? saveError.message : 'Zone review could not be saved.')
    }
  }

  function updateClassification(stopId: string, update: Partial<ZoneClassification>) {
    const next = classifications.map((item) =>
      item.stopId === stopId ? { ...item, ...update } : item,
    )
    void persist(next)

    if (update.status === 'approved') {
      setExpandedStopIds((current) => {
        const collapsed = new Set(current)
        collapsed.delete(stopId)
        return collapsed
      })
    }
  }

  return (
    <section className="manifest-zone-review" aria-labelledby="manifest-zone-review-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Slice 3 · Mandatory checkpoint</p>
          <h2 id="manifest-zone-review-title">Zone review</h2>
        </div>
        <span className="verified-badge">{approvedCount} of {route.sourceStops.length} approved</span>
      </div>

      <p className="manifest-route-setup__lede">
        Review the proposed operational zone for every physical stop. Routing Lab cannot
        sequence this route until every classification is driver-approved.
      </p>

      {unresolvedCount > 0 ? (
        <p className="zone-review-alert">
          {unresolvedCount} {unresolvedCount === 1 ? 'stop needs' : 'stops need'} a zone decision.
        </p>
      ) : null}

      <div className="zone-review-list">
        {classifications.map((classification, index) => {
          const stop = stopsById.get(classification.stopId)
          if (!stop) return null

          return (
            <details
              className={`zone-review-card zone-review-card--${classification.status}`}
              key={classification.stopId}
              open={expandedStopIds.has(classification.stopId)}
              onToggle={(event) => {
                const isOpen = event.currentTarget.open
                setExpandedStopIds((current) => {
                  const next = new Set(current)
                  if (isOpen) next.add(classification.stopId)
                  else next.delete(classification.stopId)
                  return next
                })
              }}
            >
              <summary className="zone-review-card__heading">
                <span className="stop-index">{index + 1}</span>
                <div className="stop-copy">
                  <strong>{stop.name}</strong>
                  <span>{stop.address}, {stop.city}, {stop.state} {stop.postalCode}</span>
                  <small>{classification.selectedZone ?? 'Zone decision needed'}</small>
                  {classification.selectedMicroZone ? <small>{classification.selectedMicroZone}</small> : null}
                </div>
                <div className="zone-review-card__status">
                  <span className={`zone-confidence zone-confidence--${classification.confidence}`}>
                    {classification.status === 'approved'
                      ? 'Approved'
                      : classification.confidence === 'uncertain'
                        ? 'Uncertain'
                        : `${classification.confidence} confidence`}
                  </span>
                </div>
              </summary>

              <div className="zone-review-card__body">
                <p className="zone-evidence">{classification.evidence}</p>
                <label>
                  Parent or operational zone
                  <select
                    value={classification.selectedZone ?? ''}
                    onChange={(event) => updateClassification(classification.stopId, {
                      selectedMicroZone: null,
                      selectedZone: event.target.value || null,
                      status: event.target.value ? 'proposed' : 'unresolved',
                    })}
                  >
                    <option value="">Select a documented zone</option>
                    {classification.selectedZone === 'Grand Junction' ? (
                      <option value="Grand Junction">Grand Junction (legacy)</option>
                    ) : null}
                    {route.setup.primaryParentZone ? (
                      <>
                        <optgroup label="Primary Grand Junction parent">
                          <option value={route.setup.primaryParentZone}>{route.setup.primaryParentZone}</option>
                        </optgroup>
                        <optgroup label="Other Grand Junction parents · exceptions">
                          {grandJunctionParentZones
                            .filter((zone) => zone !== route.setup.primaryParentZone)
                            .map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                        </optgroup>
                        <optgroup label="Other documented operational zones">
                          {selectableOperationalZones
                            .filter((zone) => !isGrandJunctionParentZone(zone))
                            .map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <optgroup label="Documented operational zones">
                          {selectableOperationalZones
                            .filter((zone) => !isGrandJunctionParentZone(zone))
                            .map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                        </optgroup>
                        <optgroup label="Grand Junction parent zones · exceptions">
                          {grandJunctionParentZones.map((zone) => (
                            <option key={zone} value={zone}>{zone}</option>
                          ))}
                        </optgroup>
                      </>
                    )}
                  </select>
                </label>

                {classification.selectedZone && isMicroZoneParent(classification.selectedZone) ? (
                  <label>
                    Micro Zone <span>Candidate taxonomy</span>
                    <select
                      value={classification.selectedMicroZone ?? ''}
                      onChange={(event) => updateClassification(classification.stopId, {
                        selectedMicroZone: event.target.value || null,
                        status: event.target.value ? 'proposed' : 'unresolved',
                      })}
                    >
                      <option value="">Select a Micro Zone</option>
                      {microZonesForParent(classification.selectedZone).map((microZone) => (
                        <option key={microZone} value={microZone}>{microZone}</option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <div className="zone-review-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={!classification.selectedZone || (
                      isMicroZoneParent(classification.selectedZone) && !classification.selectedMicroZone
                    ) || classification.status === 'approved'}
                    onClick={() => updateClassification(classification.stopId, { status: 'approved' })}
                  >
                    {classification.status === 'approved' ? 'Zone approved' : 'Approve zone'}
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => updateClassification(classification.stopId, {
                      selectedZone: null,
                      selectedMicroZone: null,
                      status: 'unresolved',
                    })}
                  >
                    Mark unresolved
                  </button>
                </div>
              </div>
            </details>
          )
        })}
      </div>

      <button
        className="primary-button"
        type="button"
        disabled={!complete || saveState === 'saving' || zoneReviewApproved}
        onClick={() => void persist(classifications, true)}
      >
        {zoneReviewApproved ? 'Zone Review Approved' : 'Complete Zone Review'}
      </button>

      {!complete ? (
        <p className="next-step-note">Approve a documented operational zone for every stop to continue.</p>
      ) : null}
      {zoneReviewApproved ? (
        <p className="reason-capture-status">Zone review approved.</p>
      ) : saveState === 'saved' ? (
        <p className="reason-capture-status">Zone review progress saved privately.</p>
      ) : null}
      {error ? <p className="photo-error" role="alert">{error}</p> : null}

      {route.routeProposal ? (
        <button className="secondary-button" type="button" onClick={onOpenProposal}>
          Review Route Proposal
        </button>
      ) : route.status === 'zone_approved' ? (
        <button
          className="secondary-button"
          type="button"
          disabled={isGenerating}
          onClick={() => void onGenerateProposal()}
        >
          {isGenerating ? 'Building route proposal…' : 'Generate Route Proposal'}
        </button>
      ) : null}

      <button className="text-button" type="button" onClick={onBackToSetup}>
        Back to route setup
      </button>
      <p className="safety-note">
        No route sequence has been generated. This checkpoint cannot affect production FreightIQ.
      </p>
    </section>
  )
}

export default ManifestZoneReview
