const MAX_SHARE_IMAGE_BYTES = 4_000_000
const SHARE_IMAGE_WIDTHS = [900, 820, 720]
const JPEG_QUALITY_STEPS = [0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52]

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image source is missing'))
      return
    }

    const image = new Image()

    image.onload = () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new Error('Image dimensions are invalid'))
        return
      }

      resolve(image)
    }

    image.onerror = () => {
      reject(new Error('Image loading failed'))
    }

    image.src = src
  })
}

function createCanvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Share image blob creation failed'))
          return
        }

        resolve(blob)
      },
      type,
      quality,
    )
  })
}

function drawFittedImage(image, width) {
  const canvas = document.createElement('canvas')
  const imageRatio = image.naturalHeight / image.naturalWidth

  canvas.width = width
  canvas.height = Math.round(width * imageRatio)

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context unavailable')
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

export async function createShareImageBlob(finalImageBlob, finalImageUrl) {
  if (!finalImageBlob) {
    throw new Error('Final image blob is missing')
  }

  if (
    finalImageBlob.size <= MAX_SHARE_IMAGE_BYTES &&
    (finalImageBlob.type === 'image/png' || finalImageBlob.type === 'image/jpeg')
  ) {
    return finalImageBlob
  }

  const fallbackUrl = finalImageUrl || URL.createObjectURL(finalImageBlob)
  const shouldRevokeFallbackUrl = !finalImageUrl

  try {
    const image = await loadImage(fallbackUrl)

    for (const width of SHARE_IMAGE_WIDTHS) {
      const targetWidth = Math.min(width, image.naturalWidth)
      const canvas = drawFittedImage(image, targetWidth)

      for (const quality of JPEG_QUALITY_STEPS) {
        const compressedBlob = await createCanvasBlob(canvas, 'image/jpeg', quality)

        if (compressedBlob.size <= MAX_SHARE_IMAGE_BYTES) {
          return compressedBlob
        }
      }
    }
  } finally {
    if (shouldRevokeFallbackUrl) {
      URL.revokeObjectURL(fallbackUrl)
    }
  }

  throw new Error('Share image is too large')
}
