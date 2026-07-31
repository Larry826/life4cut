import { FRAME_BRAND_MESSAGE, getFrameOption } from '../constants/frameOptions'

const REQUIRED_PHOTO_COUNT = 4
const CANVAS_WIDTH = 900
const SIDE_PADDING = 54
const TOP_PADDING = 54
const PHOTO_GAP = 18
const PHOTO_WIDTH = CANVAS_WIDTH - SIDE_PADDING * 2
const PHOTO_HEIGHT = Math.round((PHOTO_WIDTH * 4) / 3)
const FOOTER_HEIGHT = 240
const CANVAS_HEIGHT =
  TOP_PADDING + PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * 3 + FOOTER_HEIGHT
const FONT_FAMILY = '"Segoe UI", "Malgun Gothic", Arial, sans-serif'

function validatePhotos(photos) {
  if (!Array.isArray(photos) || photos.length !== REQUIRED_PHOTO_COUNT) {
    throw new Error('Exactly four photos are required')
  }

  photos.forEach((photo) => {
    if (!photo?.url) {
      throw new Error('Photo URL is missing')
    }
  })
}

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

function createPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG blob creation failed'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

function getCoverSource(image, targetWidth, targetHeight) {
  const sourceAspect = image.naturalWidth / image.naturalHeight
  const targetAspect = targetWidth / targetHeight
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight

  if (sourceAspect > targetAspect) {
    sourceWidth = image.naturalHeight * targetAspect
    sourceX = (image.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = image.naturalWidth / targetAspect
    sourceY = (image.naturalHeight - sourceHeight) / 2
  }

  return { sourceX, sourceY, sourceWidth, sourceHeight }
}

function setFittedFont(context, text, options) {
  const { maxFontSize, maxWidth, minFontSize, weight } = options
  let fontSize = maxFontSize

  do {
    context.font = `${weight} ${fontSize}px ${FONT_FAMILY}`

    if (context.measureText(text).width <= maxWidth || fontSize <= minFontSize) {
      return fontSize
    }

    fontSize -= 2
  } while (fontSize >= minFontSize)

  context.font = `${weight} ${minFontSize}px ${FONT_FAMILY}`
  return minFontSize
}

function drawCenteredText(context, text, options) {
  const { color, maxFontSize, maxWidth, minFontSize, weight, x, y } = options

  context.fillStyle = color
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  setFittedFont(context, text, {
    maxFontSize,
    maxWidth,
    minFontSize,
    weight,
  })
  context.fillText(text, x, y)
}

function drawPhoto(context, image, index, frameOption) {
  const targetX = SIDE_PADDING
  const targetY = TOP_PADDING + index * (PHOTO_HEIGHT + PHOTO_GAP)
  const { sourceX, sourceY, sourceWidth, sourceHeight } = getCoverSource(
    image,
    PHOTO_WIDTH,
    PHOTO_HEIGHT,
  )

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    targetX,
    targetY,
    PHOTO_WIDTH,
    PHOTO_HEIGHT,
  )

  context.strokeStyle = frameOption.border
  context.lineWidth = 2
  context.strokeRect(targetX + 1, targetY + 1, PHOTO_WIDTH - 2, PHOTO_HEIGHT - 2)
}

function drawFooter(context, options) {
  const { dateText, frameMessage, frameOption, showDate } = options
  const footerTop =
    TOP_PADDING + PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)
  const centerX = CANVAS_WIDTH / 2
  const maxTextWidth = CANVAS_WIDTH - SIDE_PADDING * 2
  const trimmedMessage = frameMessage.trim()
  const hasCustomMessage = trimmedMessage.length > 0
  const mainMessage = hasCustomMessage ? trimmedMessage : FRAME_BRAND_MESSAGE

  if (hasCustomMessage) {
    drawCenteredText(context, mainMessage, {
      color: frameOption.foreground,
      maxFontSize: 42,
      maxWidth: maxTextWidth,
      minFontSize: 28,
      weight: 800,
      x: centerX,
      y: footerTop + 72,
    })
    drawCenteredText(context, FRAME_BRAND_MESSAGE, {
      color: frameOption.secondaryText,
      maxFontSize: 26,
      maxWidth: maxTextWidth,
      minFontSize: 20,
      weight: 700,
      x: centerX,
      y: footerTop + 126,
    })

    if (showDate) {
      drawCenteredText(context, dateText, {
        color: frameOption.secondaryText,
        maxFontSize: 24,
        maxWidth: maxTextWidth,
        minFontSize: 18,
        weight: 700,
        x: centerX,
        y: footerTop + 178,
      })
    }

    return
  }

  drawCenteredText(context, FRAME_BRAND_MESSAGE, {
    color: frameOption.foreground,
    maxFontSize: 42,
    maxWidth: maxTextWidth,
    minFontSize: 28,
    weight: 800,
    x: centerX,
    y: footerTop + (showDate ? 88 : FOOTER_HEIGHT / 2),
  })

  if (showDate) {
    drawCenteredText(context, dateText, {
      color: frameOption.secondaryText,
      maxFontSize: 24,
      maxWidth: maxTextWidth,
      minFontSize: 18,
      weight: 700,
      x: centerX,
      y: footerTop + 150,
    })
  }
}

export async function renderFinalStrip({
  dateText,
  frameColor,
  frameMessage,
  photos,
  showDate,
}) {
  validatePhotos(photos)

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context unavailable')
  }

  const frameOption = getFrameOption(frameColor)
  const images = await Promise.all(photos.map((photo) => loadImage(photo.url)))

  context.fillStyle = frameOption.background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  images.forEach((image, index) => {
    drawPhoto(context, image, index, frameOption)
  })

  drawFooter(context, {
    dateText,
    frameMessage,
    frameOption,
    showDate,
  })

  return createPngBlob(canvas)
}
