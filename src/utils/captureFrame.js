const CAPTURE_WIDTH = 1440
const CAPTURE_HEIGHT = 1080
const CAPTURE_TYPE = 'image/jpeg'
const CAPTURE_QUALITY = 0.9

function createPhotoId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createBlobFromCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas blob creation failed'))
          return
        }

        resolve(blob)
      },
      CAPTURE_TYPE,
      CAPTURE_QUALITY,
    )
  })
}

export async function captureFrameFromVideo(videoElement, facingMode, shotNumber) {
  const videoWidth = videoElement?.videoWidth ?? 0
  const videoHeight = videoElement?.videoHeight ?? 0

  if (videoWidth <= 0 || videoHeight <= 0) {
    throw new Error('Video is not ready')
  }

  const canvas = document.createElement('canvas')
  canvas.width = CAPTURE_WIDTH
  canvas.height = CAPTURE_HEIGHT

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context unavailable')
  }

  const targetAspect = CAPTURE_WIDTH / CAPTURE_HEIGHT
  const sourceAspect = videoWidth / videoHeight
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = videoWidth
  let sourceHeight = videoHeight

  if (sourceAspect > targetAspect) {
    sourceWidth = videoHeight * targetAspect
    sourceX = (videoWidth - sourceWidth) / 2
  } else {
    sourceHeight = videoWidth / targetAspect
    sourceY = (videoHeight - sourceHeight) / 2
  }

  if (facingMode === 'user') {
    context.translate(CAPTURE_WIDTH, 0)
    context.scale(-1, 1)
  }

  context.drawImage(
    videoElement,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
  )

  const blob = await createBlobFromCanvas(canvas)

  return {
    id: createPhotoId(),
    url: URL.createObjectURL(blob),
    blob,
    shotNumber,
    facingMode,
  }
}
