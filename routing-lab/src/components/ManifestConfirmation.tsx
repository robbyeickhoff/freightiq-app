import { useEffect, useRef, useState } from 'react'

import type { ManifestPhoto } from './ManifestIntake'
import {
  createManualStop,
  type GroupingResult,
  type MergeProposal,
  type ProposedStop,
} from '../lib/manifest-grouping'
import type { ReviewState } from '../lib/manifest-extraction'

type ManifestConfirmationProps = {
  photos: ManifestPhoto[]
  initialState: GroupingResult
  initiallyConfirmed: boolean
  onSave: (workingState: GroupingResult) => Promise<void>
  onConfirm: (stops: ProposedStop[]) => Promise<void>
  onBuildTestRoute: (stops: ProposedStop[]) => Promise<void>
  onReset: () => Promise<void>
  onStartAnother: () => void
}

function reviewLabel(state: ReviewState) {
  return {
    confident: 'Verified',
    handwritten_correction: 'Handwritten — confirm',
    needs_review: 'Needs review',
    unreadable: 'Unreadable',
  }[state]
}

function ManifestConfirmation({
  photos,
  initialState,
  initiallyConfirmed,
  onSave,
  onConfirm,
  onBuildTestRoute,
  onReset,
  onStartAnother,
}: ManifestConfirmationProps) {
  const [stops, setStops] = useState(initialState.stops)
  const [proposals, setProposals] = useState(initialState.proposals)
  const [expandedStopIds, setExpandedStopIds] = useState(() => new Set(
    initialState.stops
      .filter((stop) => stop.consigneeReviewState !== 'confident' || stop.addressReviewState !== 'confident')
      .map((stop) => stop.id),
  ))
  const [confirmed, setConfirmed] = useState(initiallyConfirmed)
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [actionError, setActionError] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBuildingRoute, setIsBuildingRoute] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const initialRender = useRef(true)
  const saveQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    const flaggedIds = stops
      .filter((stop) => stop.consigneeReviewState !== 'confident' || stop.addressReviewState !== 'confident')
      .map((stop) => stop.id)

    if (!flaggedIds.length) return
    setExpandedStopIds((current) => new Set([...current, ...flaggedIds]))
  }, [stops])

  useEffect(() => {
    if (confirmed || initialRender.current) {
      initialRender.current = false
      return
    }

    setSaveState('saving')
    const timeout = window.setTimeout(() => {
      setActionError('')
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => onSave({ stops, proposals }))

      void saveQueue.current
        .then(() => setSaveState('saved'))
        .catch((error: unknown) => {
          setSaveState('error')
          setActionError(error instanceof Error ? error.message : 'Changes could not be saved.')
        })
    }, 450)

    return () => window.clearTimeout(timeout)
  }, [confirmed, initialRender, onSave, proposals, stops])

  const unresolvedStops = stops.filter((stop) =>
    !stop.consigneeName.trim() ||
    !stop.streetAddress.trim() ||
    !stop.city.trim() ||
    stop.consigneeReviewState !== 'confident' ||
    stop.addressReviewState !== 'confident',
  )

  function updateStop(stopId: string, field: keyof ProposedStop, value: string) {
    setStops((current) => current.map((stop) => {
      if (stop.id !== stopId) return stop

      const next = { ...stop, [field]: value }
      if (field === 'consigneeName') next.consigneeReviewState = 'confident'
      if (['streetAddress', 'city', 'state', 'postalCode'].includes(field)) {
        next.addressReviewState = 'confident'
      }
      return next
    }))
  }

  function updatePro(stopId: string, shipmentId: string, value: string) {
    setStops((current) => current.map((stop) => stop.id === stopId
      ? {
          ...stop,
          shipments: stop.shipments.map((shipment) => shipment.id === shipmentId
            ? { ...shipment, proNumber: value }
            : shipment),
        }
      : stop))
  }

  function acceptFlaggedFields(stopId: string) {
    setStops((current) => current.map((stop) => stop.id === stopId
      ? {
          ...stop,
          consigneeReviewState: stop.consigneeName.trim() ? 'confident' : stop.consigneeReviewState,
          addressReviewState: stop.streetAddress.trim() && stop.city.trim()
            ? 'confident'
            : stop.addressReviewState,
        }
      : stop))
    setExpandedStopIds((current) => {
      const next = new Set(current)
      next.delete(stopId)
      return next
    })
  }

  function removeShipment(stopId: string, shipmentId: string) {
    setStops((current) => current.flatMap((stop) => {
      if (stop.id !== stopId) return [stop]
      const shipments = stop.shipments.filter((shipment) => shipment.id !== shipmentId)
      return shipments.length ? [{ ...stop, shipments }] : []
    }))
  }

  function separateShipment(stopId: string, shipmentId: string) {
    setStops((current) => {
      const sourceStop = current.find((stop) => stop.id === stopId)
      const shipment = sourceStop?.shipments.find((item) => item.id === shipmentId)
      if (!sourceStop || !shipment || sourceStop.shipments.length < 2) return current

      const separated: ProposedStop = {
        ...sourceStop,
        id: crypto.randomUUID(),
        consigneeName: shipment.consigneeName,
        streetAddress: shipment.streetAddress,
        city: shipment.city,
        state: shipment.state,
        postalCode: shipment.postalCode,
        consigneeReviewState: shipment.consigneeReviewState,
        addressReviewState: shipment.addressReviewState,
        shipments: [shipment],
      }

      return [
        ...current.map((stop) => stop.id === stopId
          ? { ...stop, shipments: stop.shipments.filter((item) => item.id !== shipmentId) }
          : stop),
        separated,
      ]
    })
  }

  function resolveProposal(proposal: MergeProposal, merge: boolean) {
    if (merge) {
      setStops((current) => {
        const [leftId, rightId] = proposal.stopIds
        const left = current.find((stop) => stop.id === leftId)
        const right = current.find((stop) => stop.id === rightId)
        if (!left || !right) return current

        return current
          .filter((stop) => stop.id !== rightId)
          .map((stop) => stop.id === leftId
            ? { ...left, shipments: [...left.shipments, ...right.shipments] }
            : stop)
      })
    }

    setProposals((current) => current.filter((item) => item.id !== proposal.id))
  }

  const activeProposals = proposals.filter((proposal) =>
    proposal.stopIds.every((stopId) => stops.some((stop) => stop.id === stopId)),
  )
  const displayedStops = stops
    .map((stop, originalIndex) => ({ stop, originalIndex }))
    .toSorted((left, right) => {
      const leftFlagged = left.stop.consigneeReviewState !== 'confident' || left.stop.addressReviewState !== 'confident'
      const rightFlagged = right.stop.consigneeReviewState !== 'confident' || right.stop.addressReviewState !== 'confident'
      return Number(rightFlagged) - Number(leftFlagged) || left.originalIndex - right.originalIndex
    })

  async function confirmStops() {
    setIsConfirming(true)
    setActionError('')
    try {
      await saveQueue.current.catch(() => undefined)
      await onConfirm(stops)
      setSaveState('saved')
      setConfirmed(true)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The confirmed stops could not be saved.')
    } finally {
      setIsConfirming(false)
    }
  }

  async function resetImport() {
    setIsResetting(true)
    setActionError('')
    try {
      await onReset()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'This manifest could not be deleted.')
      setIsResetting(false)
    }
  }

  async function buildTestRoute() {
    setIsBuildingRoute(true)
    setActionError('')
    try {
      await onBuildTestRoute(stops)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The Test Route could not be created.')
      setIsBuildingRoute(false)
    }
  }

  if (confirmed) {
    return (
      <section className="manifest-intake manifest-confirmed" aria-labelledby="confirmed-title">
        <p className="eyebrow">Driver confirmed</p>
        <h2 id="confirmed-title">{stops.length} verified stops ready</h2>
        <p>
          The photos, original extraction, corrections, and verified stops are saved
          privately. They have not been sent to routing or production FreightIQ.
        </p>
        <button
          className="primary-button"
          type="button"
          disabled={isBuildingRoute}
          onClick={() => void buildTestRoute()}
        >
          {isBuildingRoute ? 'Building Test Route…' : 'Build Test Route'}
        </button>
        <button className="secondary-button" type="button" onClick={onStartAnother}>
          Start another manifest
        </button>
        <button className="text-button" type="button" onClick={() => setShowResetConfirmation(true)}>
          Delete this saved manifest
        </button>
        {showResetConfirmation ? (
          <div className="manifest-reset-confirmation">
            <strong>Delete only this manifest?</strong>
            <p>This removes its photos, extraction, corrections, and confirmed stops. GR-001 and other imports remain unchanged.</p>
            <button className="danger-button" type="button" disabled={isResetting} onClick={() => void resetImport()}>
              {isResetting ? 'Deleting…' : 'Yes, delete this manifest'}
            </button>
            <button type="button" disabled={isResetting} onClick={() => setShowResetConfirmation(false)}>Keep it</button>
          </div>
        ) : null}
        {actionError ? <p className="photo-error" role="alert">{actionError}</p> : null}
      </section>
    )
  }

  return (
    <section className="manifest-intake" aria-labelledby="confirmation-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Slice 2 · Unit 4</p>
          <h2 id="confirmation-title">Confirm proposed stops</h2>
        </div>
        <span className={`verified-badge save-state save-state--${saveState}`}>
          {saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save failed' : 'Saved privately'}
        </span>
      </div>

      <div className="confirmation-summary">
        <strong>{stops.length} proposed stops</strong>
        <span>{stops.reduce((total, stop) => total + stop.shipments.length, 0)} shipments</span>
        <span>{activeProposals.length} possible merges</span>
      </div>

      {activeProposals.length ? (
        <div className="merge-review">
          <h3>Possible same stops</h3>
          {activeProposals.map((proposal) => {
            const left = stops.find((stop) => stop.id === proposal.stopIds[0])
            const right = stops.find((stop) => stop.id === proposal.stopIds[1])
            if (!left || !right) return null

            return (
              <div className="merge-review__card" key={proposal.id}>
                <strong>{left.consigneeName || 'Unnamed'} + {right.consigneeName || 'Unnamed'}</strong>
                <span>{proposal.reason === 'possible_same_address' ? 'Same address' : 'Similar addresses'}</span>
                <div>
                  <button type="button" onClick={() => resolveProposal(proposal, true)}>Merge</button>
                  <button type="button" onClick={() => resolveProposal(proposal, false)}>Keep separate</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <ol className="proposed-stop-list">
        {displayedStops.map(({ stop }, index) => {
          const flagged = stop.consigneeReviewState !== 'confident' || stop.addressReviewState !== 'confident'
          return (
            <li key={stop.id}>
              <details
                open={expandedStopIds.has(stop.id)}
                onToggle={(event) => {
                  const isOpen = event.currentTarget.open
                  setExpandedStopIds((current) => {
                    const next = new Set(current)
                    if (isOpen) next.add(stop.id)
                    else next.delete(stop.id)
                    return next
                  })
                }}
              >
                <summary className="proposed-stop-list__heading">
                  <div>
                    <span>{flagged ? 'Needs review' : `Stop ${index + 1}`}</span>
                    <strong>{stop.consigneeName || 'Unnamed stop'}</strong>
                    <small>{stop.streetAddress || 'Address missing'}</small>
                  </div>
                  <span>{stop.shipments.length} {stop.shipments.length === 1 ? 'shipment' : 'shipments'}</span>
                </summary>

                <div className="proposed-stop-list__body">

                  <label>Business or consignee
                    <input value={stop.consigneeName} onChange={(event) => updateStop(stop.id, 'consigneeName', event.target.value)} />
                  </label>
                  <label>Street address
                    <input value={stop.streetAddress} onChange={(event) => updateStop(stop.id, 'streetAddress', event.target.value)} />
                  </label>
                  <div className="address-field-row">
                    <label>City
                      <input value={stop.city} onChange={(event) => updateStop(stop.id, 'city', event.target.value)} />
                    </label>
                    <label>State
                      <input value={stop.state} onChange={(event) => updateStop(stop.id, 'state', event.target.value)} />
                    </label>
                    <label>ZIP
                      <input value={stop.postalCode} onChange={(event) => updateStop(stop.id, 'postalCode', event.target.value)} />
                    </label>
                  </div>

                  <div className="review-state-row">
                    <span className={`review-state review-state--${stop.consigneeReviewState}`}>Name: {reviewLabel(stop.consigneeReviewState)}</span>
                    <span className={`review-state review-state--${stop.addressReviewState}`}>Address: {reviewLabel(stop.addressReviewState)}</span>
                  </div>
                  {flagged ? (
                    <button className="review-accept-button" type="button" onClick={() => acceptFlaggedFields(stop.id)}>
                      Accept reviewed name and address
                    </button>
                  ) : null}

                  <div className="stop-shipment-list">
                    {stop.shipments.map((shipment) => {
                      const sourcePhotoIndex = photos.findIndex((photo) => photo.id === shipment.sourcePhotoId)
                      const sourcePhoto = sourcePhotoIndex >= 0 ? photos[sourcePhotoIndex] : null
                      return (
                        <div key={shipment.id}>
                          <div className="shipment-source">
                            {sourcePhoto ? <img src={sourcePhoto.previewUrl} alt={`Source page ${sourcePhotoIndex + 1}`} /> : null}
                            <span>{sourcePhoto ? `Page ${sourcePhotoIndex + 1}, record ${shipment.sourceRecordIndex}` : 'Manually added'}</span>
                          </div>
                          <label>PRO number
                            <input value={shipment.proNumber} onChange={(event) => updatePro(stop.id, shipment.id, event.target.value)} />
                          </label>
                          <div>
                            {stop.shipments.length > 1 ? (
                              <button type="button" onClick={() => separateShipment(stop.id, shipment.id)}>Separate shipment</button>
                            ) : null}
                            <button type="button" onClick={() => removeShipment(stop.id, shipment.id)}>Remove shipment</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </details>
            </li>
          )
        })}
      </ol>

      <button className="secondary-button" type="button" onClick={() => setStops((current) => [...current, createManualStop()])}>
        Add missed shipment
      </button>
      <button
        className="primary-button"
        type="button"
        disabled={unresolvedStops.length > 0 || activeProposals.length > 0 || stops.length === 0 || isConfirming}
        onClick={() => void confirmStops()}
      >
        {isConfirming ? 'Saving confirmed stops…' : 'Confirm Stops'}
      </button>
      {unresolvedStops.length || activeProposals.length ? (
        <p className="next-step-note">
          Resolve {unresolvedStops.length} flagged stops and {activeProposals.length} possible merges before confirming.
        </p>
      ) : null}
      {actionError ? <p className="photo-error" role="alert">{actionError}</p> : null}
      <button className="text-button" type="button" onClick={() => setShowResetConfirmation(true)}>
        Reset and delete this import
      </button>
      {showResetConfirmation ? (
        <div className="manifest-reset-confirmation">
          <strong>Delete only this manifest?</strong>
          <p>This removes its saved photos and review work. GR-001, sandbox lessons, and other imports remain unchanged.</p>
          <button className="danger-button" type="button" disabled={isResetting} onClick={() => void resetImport()}>
            {isResetting ? 'Deleting…' : 'Yes, delete this manifest'}
          </button>
          <button type="button" disabled={isResetting} onClick={() => setShowResetConfirmation(false)}>Keep working</button>
        </div>
      ) : null}
      <p className="safety-note">Unit 4 saves only to the private Routing Lab and cannot affect production FreightIQ.</p>
    </section>
  )
}

export default ManifestConfirmation
