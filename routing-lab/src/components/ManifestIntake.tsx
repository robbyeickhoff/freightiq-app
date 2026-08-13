import { useEffect, useRef, useState } from 'react'

type IntakeStage = 'confirmation' | 'photos'

type ManifestPhoto = {
  id: string
  name: string
  previewUrl: string
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

  return {
    id: crypto.randomUUID(),
    name: file.name,
    previewUrl: URL.createObjectURL(previewSource),
  }
}

function ManifestIntake() {
  const [photos, setPhotos] = useState<ManifestPhoto[]>([])
  const [stage, setStage] = useState<IntakeStage>('photos')
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const [photoError, setPhotoError] = useState('')
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

  if (stage === 'confirmation') {
    return (
      <section className="manifest-intake" aria-labelledby="confirmation-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Manifest intake</p>
            <h2 id="confirmation-title">Confirm extracted stops</h2>
          </div>
          <span className="verified-badge">Unit 1 boundary</span>
        </div>

        <div className="empty-confirmation">
          <div className="empty-confirmation__mark" aria-hidden="true">✓</div>
          <h3>{photos.length} {photos.length === 1 ? 'photo' : 'photos'} ready</h3>
          <p>
            Your photo order is locked for this review. AI extraction and the
            editable stop list arrive in Unit 2; no manifest information has
            been read or uploaded yet.
          </p>
        </div>

        <ol className="confirmation-photo-list">
          {photos.map((photo, index) => (
            <li key={photo.id}>
              <span>{index + 1}</span>
              <img src={photo.previewUrl} alt={`Manifest page ${index + 1}`} />
              <strong>{photo.name}</strong>
            </li>
          ))}
        </ol>

        <button
          className="primary-button"
          type="button"
          disabled
          aria-describedby="confirmation-boundary-note"
        >
          Confirm Stops — available in Unit 2
        </button>
        <p id="confirmation-boundary-note" className="next-step-note">
          Unit 1 stops here intentionally. Nothing proceeds to routing.
        </p>
        <button
          className="secondary-button"
          type="button"
          onClick={() => setStage('photos')}
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
          <p className="eyebrow">Slice 2 · Unit 1</p>
          <h2 id="manifest-intake-title">Manifest Intake</h2>
        </div>
        <span className="baseline-badge">Photos stay on this device</span>
      </div>

      <p className="manifest-intake__lede">
        Add every photo from today’s manifest. Put the pages in the order you
        want to review them, then continue to the confirmation boundary.
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
            disabled={isPreparingPhotos}
            onClick={() => setStage('confirmation')}
          >
            Continue to confirmation
          </button>
        </>
      )}

      {photoError ? (
        <p className="photo-error" role="alert">{photoError}</p>
      ) : null}

      <p className="safety-note">
        Unit 1 does not upload, read, extract, save, or route manifest data.
      </p>
    </section>
  )
}

export default ManifestIntake
