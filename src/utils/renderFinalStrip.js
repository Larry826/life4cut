import { FRAME_BRAND_MESSAGE, getFrameOption } from '../constants/frameOptions'
import oazLogo from '../assets/oaz_logo.png'

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
const OAZ_FRAME_ID = 'oaz'

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

function createRoundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function drawContainedImage(context, image, x, y, targetWidth, targetHeight) {
  const sourceAspect = image.naturalWidth / image.naturalHeight
  const targetAspect = targetWidth / targetHeight
  let drawWidth = targetWidth
  let drawHeight = targetHeight

  if (sourceAspect > targetAspect) {
    drawHeight = targetWidth / sourceAspect
  } else {
    drawWidth = targetHeight * sourceAspect
  }

  const drawX = x + (targetWidth - drawWidth) / 2
  const drawY = y + (targetHeight - drawHeight) / 2

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawOazFrameAccent(context, frameOption) {
  const photoAreaHeight =
    PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)

  context.save()
  context.fillStyle = frameOption.softAccent ?? '#fff0f7'
  context.globalAlpha = 0.5
  context.fillRect(0, 0, CANVAS_WIDTH, TOP_PADDING - 14)
  context.fillRect(0, TOP_PADDING + photoAreaHeight + 14, CANVAS_WIDTH, FOOTER_HEIGHT)

  context.fillStyle = frameOption.accent ?? '#ed5ba7'
  context.globalAlpha = 0.14
  createRoundedRectPath(context, 28, TOP_PADDING, 8, photoAreaHeight, 4)
  context.fill()
  createRoundedRectPath(context, CANVAS_WIDTH - 36, TOP_PADDING, 8, photoAreaHeight, 4)
  context.fill()
  context.restore()
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

function drawOazFooter(context, options) {
  const { dateText, frameMessage, frameOption, logoImage, showDate } = options
  const footerTop =
    TOP_PADDING + PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)
  const centerX = CANVAS_WIDTH / 2
  const maxTextWidth = CANVAS_WIDTH - SIDE_PADDING * 2
  const trimmedMessage = frameMessage.trim()
  const mainMessage = trimmedMessage.length > 0 ? trimmedMessage : FRAME_BRAND_MESSAGE
  const logoCardWidth = 340
  const logoCardHeight = 150
  const logoCardX = centerX - logoCardWidth / 2
  const logoCardY = footerTop + 16

  context.save()
  context.fillStyle = '#ffffff'
  createRoundedRectPath(context, logoCardX, logoCardY, logoCardWidth, logoCardHeight, 18)
  context.fill()
  context.strokeStyle = frameOption.border
  context.lineWidth = 2
  context.stroke()

  if (logoImage) {
    drawContainedImage(
      context,
      logoImage,
      logoCardX + 18,
      logoCardY + 12,
      logoCardWidth - 36,
      logoCardHeight - 24,
    )
  }
  context.restore()

  drawCenteredText(context, mainMessage, {
    color: frameOption.foreground,
    maxFontSize: 30,
    maxWidth: maxTextWidth,
    minFontSize: 20,
    weight: 800,
    x: centerX,
    y: footerTop + 190,
  })

  if (showDate) {
    drawCenteredText(context, dateText, {
      color: frameOption.secondaryText,
      maxFontSize: 22,
      maxWidth: maxTextWidth,
      minFontSize: 16,
      weight: 700,
      x: centerX,
      y: footerTop + 222,
    })
  }
}

function drawFooter(context, options) {
  const { dateText, frameMessage, frameOption, showDate } = options

  if (frameOption.id === OAZ_FRAME_ID) {
    drawOazFooter(context, options)
    return
  }

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
  const [images, logoImage] = await Promise.all([
    Promise.all(photos.map((photo) => loadImage(photo.url))),
    frameOption.id === OAZ_FRAME_ID ? loadImage(oazLogo) : Promise.resolve(null),
  ])

  context.fillStyle = frameOption.background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (frameOption.id === OAZ_FRAME_ID) {
    drawOazFrameAccent(context, frameOption)
  }

  images.forEach((image, index) => {
    drawPhoto(context, image, index, frameOption)
  })

  drawFooter(context, {
    dateText,
    frameMessage,
    frameOption,
    logoImage,
    showDate,
  })

  return createPngBlob(canvas)
}
