import { useEffect, useRef, useState } from 'react'

import {
  extractManifestPhotos,
  type ManifestExtraction,
  type ReviewState,
} from '../lib/manifest-extraction'

type IntakeStage = 'confirmation' | 'photos'

type ManifestPhoto = {
  id: string
  name: string
  previewUrl: string
  preparedBlob: Blob
}

function describePhotoError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return 'Unknown HEIC conversion error'
}

function isHeicFile(file: File) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

async function createManifestPhoto(file: File): Promise<ManifestPhoto> {
  let previewSource: Blob = file

  if (isHeicFile(file)) {
    const { heicTo } = await import('heic-to')
    previewSource = await heicTo({
      blob: file,
      quality: 0.82,
      type: 'image/jpeg',
    })
  }

  const preparedBlob = await normalizeManifestPhoto(previewSource)

  return {
    id: crypto.randomUUID(),
    name: file.name,
    previewUrl: URL.createObjectURL(preparedBlob),
    preparedBlob,
  }
}

async function normalizeManifestPhoto(source: Blob) {
  const image = await createImageBitmap(source)
  const maximumDimension = 2400
  const scale = Math.min(1, maximumDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    image.close()
    throw new Error('This browser could not prepare the photo.')
  }

  context.drawImage(image, 0, 0, width, height)
  image.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('JPEG conversion failed.')),
      'image/jpeg',
      0.84,
    )
  })
}

function formatAddress(shipment: {
  streetAddress: string | null
  city: string | null
  state: string | null
  postalCode: string | null
}) {
  const locality = [shipment.city, shipment.state, shipment.postalCode]
    .filter(Boolean)
    .join(' ')

  return [shipment.streetAddress, locality].filter(Boolean).join(', ') || 'Address unreadable'
}

function reviewStateLabel(state: ReviewState) {
  return {
    confident: 'Confident',
    handwritten_correction: 'Handwritten correction',
    needs_review: 'Needs review',
    unreadable: 'Unreadable',
  }[state]
}

function ManifestIntake() {
  const [photos, setPhotos] = useState<ManifestPhoto[]>([])
  const [stage, setStage] = useState<IntakeStage>('photos')
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [extraction, setExtraction] = useState<ManifestExtraction | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const replacementPhotoId = useRef<string | null>(null)
  const photosRef = useRef(photos)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    },
    [],
  )

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return

    setIsPreparingPhotos(true)
    setPhotoError('')

    try {
      const selectedPhotos: ManifestPhoto[] = []
      for (const file of Array.from(files)) {
        selectedPhotos.push(await createManifestPhoto(file))
      }
      setPhotos((currentPhotos) => [...currentPhotos, ...selectedPhotos])
    } catch (error) {
      setPhotoError(
        `The photo could not be prepared: ${describePhotoError(error)}`,
      )
    } finally {
      setIsPreparingPhotos(false)
    }
  }

  function movePhoto(currentIndex: number, direction: -1 | 1) {
    setPhotos((currentPhotos) => {
      const nextIndex = currentIndex + direction

      if (nextIndex < 0 || nextIndex >= currentPhotos.length) {
        return currentPhotos
      }

      const reorderedPhotos = [...currentPhotos]
      const [movedPhoto] = reorderedPhotos.splice(currentIndex, 1)
      reorderedPhotos.splice(nextIndex, 0, movedPhoto)
      return reorderedPhotos
    })
  }

  function removePhoto(photoId: string) {
    setPhotos((currentPhotos) => {
      const removedPhoto = currentPhotos.find((photo) => photo.id === photoId)

      if (removedPhoto) URL.revokeObjectURL(removedPhoto.previewUrl)
      return currentPhotos.filter((photo) => photo.id !== photoId)
    })
  }

  function chooseReplacement(photoId: string) {
    replacementPhotoId.current = photoId
    replaceInputRef.current?.click()
  }

  async function replacePhoto(files: FileList | null) {
    const replacementFile = files?.[0]
    const photoId = replacementPhotoId.current

    if (!replacementFile || !photoId) return

    setIsPreparingPhotos(true)
    setPhotoError('')

    try {
      const replacement = await createManifestPhoto(replacementFile)
      setPhotos((currentPhotos) =>
        currentPhotos.map((photo) => {
          if (photo.id !== photoId) return photo

          URL.revokeObjectURL(photo.previewUrl)
          return { ...replacement, id: photo.id }
        }),
      )
    } catch (error) {
      setPhotoError(
        `That replacement could not be prepared: ${describePhotoError(error)}`,
      )
    } finally {
      replacementPhotoId.current = null
      setIsPreparingPhotos(false)
    }
  }

  async function continueToExtraction() {
    setIsExtracting(true)
    setPhotoError('')

    try {
      const result = await extractManifestPhotos(
        photos.map((photo) => ({
          id: photo.id,
          name: photo.name,
          blob: photo.preparedBlob,
        })),
      )
      setExtraction(result)
      setStage('confirmation')
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : 'Manifest extraction failed. Try again.',
      )
    } finally {
      setIsExtracting(false)
    }
  }

  if (stage === 'confirmation') {
    const shipmentCount = extraction?.photos.reduce(
      (total, photo) => total + photo.shipments.length,
      0,
    ) ?? 0

    return (
      <section className="manifest-intake" aria-labelledby="confirmation-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Manifest intake</p>
            <h2 id="confirmation-title">Confirm extracted stops</h2>
          </div>
          <span className="verified-badge">Unit 2 extraction</span>
        </div>

        <div className="empty-confirmation">
          <div className="empty-confirmation__mark" aria-hidden="true">✓</div>
          <h3>{shipmentCount} shipment {shipmentCount === 1 ? 'record' : 'records'} found</h3>
          <p>
            Review what the extractor read from each photo. No stops have been
            grouped, confirmed, saved, or sent to routing.
          </p>
        </div>

        <div className="extraction-results">
          {photos.map((photo, index) => {
            const photoResult = extraction?.photos.find(
              (result) => result.sourcePhotoId === photo.id,
            )

            return (
              <section className="extraction-page" key={photo.id}>
                <div className="extraction-page__heading">
                  <img src={photo.previewUrl} alt={`Manifest page ${index + 1}`} />
                  <div>
                    <span>Page {index + 1}</span>
                    <strong>{photo.name}</strong>
                    <small className={`extraction-status extraction-status--${photoResult?.status ?? 'unreadable'}`}>
                      {photoResult?.status ?? 'No result'}
                    </small>
                  </div>
                </div>

                {photoResult?.message ? (
                  <p className="extraction-message">{photoResult.message}</p>
                ) : null}

                {photoResult?.shipments.length ? (
                  <ol className="shipment-extraction-list">
                    {photoResult.shipments.map((shipment) => (
                      <li key={`${photo.id}-${shipment.sourceRecordIndex}`}>
                        <div className="shipment-extraction-list__heading">
                          <span>Record {shipment.sourceRecordIndex}</span>
                          <strong>{shipment.consigneeName || 'Consignee unreadable'}</strong>
                        </div>
                        <p>{formatAddress(shipment)}</p>
                        <p>PRO: {shipment.proNumber || 'Not readable / not shown'}</p>
                        <div className="review-state-row">
                          <span className={`review-state review-state--${shipment.consigneeReviewState}`}>
                            Name: {reviewStateLabel(shipment.consigneeReviewState)}
                          </span>
                          <span className={`review-state review-state--${shipment.addressReviewState}`}>
                            Address: {reviewStateLabel(shipment.addressReviewState)}
                          </span>
                          <span className={`review-state review-state--${shipment.proReviewState}`}>
                            PRO: {reviewStateLabel(shipment.proReviewState)}
                          </span>
                        </div>
                        {shipment.evidenceNote ? <small>{shipment.evidenceNote}</small> : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="extraction-message">No shipment records were readable on this photo.</p>
                )}
              </section>
            )
          })}
        </div>

        <button
          className="primary-button"
          type="button"
          disabled
          aria-describedby="confirmation-boundary-note"
        >
          Confirm Stops — available in Unit 3
        </button>
        <p id="confirmation-boundary-note" className="next-step-note">
          Unit 2 stops here intentionally. Editing and stop grouping come next.
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setExtraction(null)
            setStage('photos')
          }}
        >
          Back to manifest photos
        </button>
      </section>
    )
  }

  return (
    <section className="manifest-intake" aria-labelledby="manifest-intake-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Slice 2 · Unit 2</p>
          <h2 id="manifest-intake-title">Manifest Intake</h2>
        </div>
        <span className="baseline-badge">Temporary extraction only</span>
      </div>

      <p className="manifest-intake__lede">
        Add every photo from today’s manifest. Put the pages in the order you
        want to review them, then securely extract the approved manifest fields.
      </p>

      <input
        ref={addInputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        multiple
        disabled={isPreparingPhotos}
        onChange={(event) => {
          void addPhotos(event.target.files)
          event.target.value = ''
        }}
      />
      <input
        ref={replaceInputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        disabled={isPreparingPhotos}
        onChange={(event) => {
          void replacePhoto(event.target.files)
          event.target.value = ''
        }}
      />

      {photos.length === 0 ? (
        <button
          className="photo-picker"
          type="button"
          disabled={isPreparingPhotos}
          onClick={() => addInputRef.current?.click()}
        >
          <span className="photo-picker__icon" aria-hidden="true">＋</span>
          <strong>{isPreparingPhotos ? 'Preparing photos…' : 'Select manifest photos'}</strong>
          <span>Choose one or several images from your phone or Mac.</span>
        </button>
      ) : (
        <>
          <div className="stop-list-heading manifest-photo-heading">
            <h3>Manifest photos</h3>
            <span>{photos.length} selected</span>
          </div>

          <ol className="manifest-photo-list">
            {photos.map((photo, index) => (
              <li key={photo.id}>
                <div className="manifest-photo-preview">
                  <span className="manifest-page-number">Page {index + 1}</span>
                  <img src={photo.previewUrl} alt={`Manifest page ${index + 1}`} />
                </div>
                <div className="manifest-photo-copy">
                  <strong>{photo.name}</strong>
                  <span>Review page {index + 1}</span>
                </div>
                <div className="manifest-photo-controls" aria-label={`Manage page ${index + 1}`}>
                  <button type="button" disabled={index === 0} onClick={() => movePhoto(index, -1)}>
                    Move up
                  </button>
                  <button type="button" disabled={index === photos.length - 1} onClick={() => movePhoto(index, 1)}>
                    Move down
                  </button>
                  <button type="button" onClick={() => chooseReplacement(photo.id)}>
                    Replace
                  </button>
                  <button className="remove-photo-button" type="button" onClick={() => removePhoto(photo.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <button
            className="secondary-button add-more-photos"
            type="button"
            disabled={isPreparingPhotos}
            onClick={() => addInputRef.current?.click()}
          >
            {isPreparingPhotos ? 'Preparing photos…' : 'Add more photos'}
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={isPreparingPhotos || isExtracting}
            onClick={() => void continueToExtraction()}
          >
            {isExtracting ? 'Reading manifest photos…' : 'Extract shipment records'}
          </button>
        </>
      )}

      {photoError ? (
        <p className="photo-error" role="alert">{photoError}</p>
      ) : null}

      <p className="safety-note">
        Photos are sent only for temporary extraction. Unit 2 does not save or route manifest data.
      </p>
    </section>
  )
}

export default ManifestIntake
