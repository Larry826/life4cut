import { FRAME_BRAND_MESSAGE, getFrameOption } from '../constants/frameOptions'

const REQUIRED_PHOTO_COUNT = 4
const CANVAS_WIDTH = 900
const SIDE_PADDING = 54
const TOP_PADDING = 244
const PHOTO_GAP = 18
const PHOTO_WIDTH = CANVAS_WIDTH - SIDE_PADDING * 2
const PHOTO_HEIGHT = Math.round((PHOTO_WIDTH * 3) / 4)
const FOOTER_HEIGHT = 286
const CANVAS_HEIGHT =
  TOP_PADDING + PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * 3 + FOOTER_HEIGHT
const FONT_FAMILY = '"Segoe UI", "Malgun Gothic", Arial, sans-serif'
const OAZ_FRAME_ID = 'oaz'
const CIRCUIT_FRAME_ID = 'circuit'
const OAZ_SIDE_LABELS = ['OAZ', '하나와영', 'HANAWAYOUNG', '']
const QR_CARD_SIZE = 210
const QR_CARD_PADDING = 16

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

function drawQrCode(context, qrImage, frameOption) {
  if (!qrImage) {
    return
  }

  const x = CANVAS_WIDTH - SIDE_PADDING - QR_CARD_SIZE
  const y = Math.max(18, Math.round((TOP_PADDING - QR_CARD_SIZE) / 2))
  const innerSize = QR_CARD_SIZE - QR_CARD_PADDING * 2

  context.save()
  context.fillStyle = '#ffffff'
  createRoundedRectPath(context, x, y, QR_CARD_SIZE, QR_CARD_SIZE, 16)
  context.fill()
  context.strokeStyle = frameOption.id === CIRCUIT_FRAME_ID ? '#111111' : 'rgba(17, 17, 17, 0.18)'
  context.lineWidth = frameOption.id === CIRCUIT_FRAME_ID ? 2 : 1.5
  context.stroke()
  context.drawImage(qrImage, x + QR_CARD_PADDING, y + QR_CARD_PADDING, innerSize, innerSize)
  context.restore()
}

function drawOazFrameAccent(context, frameOption) {
  const photoAreaHeight =
    PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)

  context.save()
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  context.strokeStyle = frameOption.accent
  context.globalAlpha = 0.16
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(SIDE_PADDING / 2, TOP_PADDING - 24)
  context.lineTo(CANVAS_WIDTH - SIDE_PADDING / 2, TOP_PADDING - 24)
  context.moveTo(SIDE_PADDING / 2, TOP_PADDING + photoAreaHeight + 26)
  context.lineTo(CANVAS_WIDTH - SIDE_PADDING / 2, TOP_PADDING + photoAreaHeight + 26)
  context.stroke()

  context.globalAlpha = 0.08
  context.fillStyle = frameOption.accent
  context.fillRect(0, 0, CANVAS_WIDTH, TOP_PADDING)
  context.fillRect(0, TOP_PADDING + photoAreaHeight, CANVAS_WIDTH, FOOTER_HEIGHT)
  context.restore()
}

function drawCircuitNode(context, x, y, radius = 9) {
  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fill()
}

function drawCircuitTrace(context, points) {
  context.beginPath()
  points.forEach(([x, y], index) => {
    if (index === 0) {
      context.moveTo(x, y)
      return
    }

    context.lineTo(x, y)
  })
  context.stroke()
}

function drawCircuitFrameAccent(context, frameOption) {
  const photoAreaHeight =
    PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)
  const photoAreaBottom = TOP_PADDING + photoAreaHeight
  const topLineEnd = CANVAS_WIDTH - SIDE_PADDING - QR_CARD_SIZE - 28

  context.save()
  context.fillStyle = frameOption.softAccent
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  context.strokeStyle = frameOption.accent
  context.fillStyle = frameOption.accent
  context.globalAlpha = 0.68
  context.lineWidth = 7
  context.lineCap = 'round'
  context.lineJoin = 'round'

  drawCircuitTrace(context, [
    [34, 64],
    [190, 64],
    [190, 104],
    [322, 104],
    [322, 76],
    [topLineEnd, 76],
  ])
  drawCircuitTrace(context, [
    [60, 132],
    [156, 132],
    [156, 154],
    [276, 154],
  ])
  drawCircuitTrace(context, [
    [24, TOP_PADDING + 44],
    [24, photoAreaBottom - 54],
    [42, photoAreaBottom - 54],
  ])
  drawCircuitTrace(context, [
    [CANVAS_WIDTH - 26, TOP_PADDING + 82],
    [CANVAS_WIDTH - 26, photoAreaBottom - 90],
    [CANVAS_WIDTH - 48, photoAreaBottom - 90],
  ])
  drawCircuitTrace(context, [
    [70, photoAreaBottom + 58],
    [240, photoAreaBottom + 58],
    [240, photoAreaBottom + 94],
    [376, photoAreaBottom + 94],
  ])
  drawCircuitTrace(context, [
    [CANVAS_WIDTH - 88, photoAreaBottom + 128],
    [CANVAS_WIDTH - 220, photoAreaBottom + 128],
    [CANVAS_WIDTH - 220, photoAreaBottom + 168],
    [CANVAS_WIDTH - 354, photoAreaBottom + 168],
  ])

  ;[
    [34, 64],
    [190, 64],
    [322, 104],
    [topLineEnd, 76],
    [60, 132],
    [276, 154],
    [24, TOP_PADDING + 44],
    [42, photoAreaBottom - 54],
    [CANVAS_WIDTH - 26, TOP_PADDING + 82],
    [CANVAS_WIDTH - 48, photoAreaBottom - 90],
    [70, photoAreaBottom + 58],
    [376, photoAreaBottom + 94],
    [CANVAS_WIDTH - 88, photoAreaBottom + 128],
    [CANVAS_WIDTH - 354, photoAreaBottom + 168],
  ].forEach(([x, y]) => {
    drawCircuitNode(context, x, y)
  })

  context.restore()
}

function drawStackedText(context, text, options) {
  const { color, height, maxFontSize, minFontSize, weight, x, y } = options
  const letters = Array.from(text)
  const fontSize = Math.max(
    minFontSize,
    Math.min(maxFontSize, Math.floor((height - 18) / Math.max(letters.length, 1))),
  )
  const lineHeight = fontSize * 1.08
  const totalHeight = lineHeight * letters.length
  let currentY = y + (height - totalHeight) / 2 + lineHeight / 2

  context.fillStyle = color
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `${weight} ${fontSize}px ${FONT_FAMILY}`

  letters.forEach((letter) => {
    context.fillText(letter, x, currentY)
    currentY += lineHeight
  })
}

function drawOazPhotoSideLabels(context, index, frameOption, photoY) {
  const label = OAZ_SIDE_LABELS[index]

  if (!label) {
    return
  }

  const railWidth = 42
  const railHeight = PHOTO_HEIGHT - 32
  const railY = photoY + 16
  const leftRailX = Math.round((SIDE_PADDING - railWidth) / 2)
  const rightRailX = CANVAS_WIDTH - SIDE_PADDING + leftRailX

  context.save()

  ;[leftRailX, rightRailX].forEach((railX) => {
    drawStackedText(context, label, {
      color: frameOption.foreground,
      height: railHeight,
      maxFontSize: label.length > 6 ? 34 : 44,
      minFontSize: 16,
      weight: 900,
      x: railX + railWidth / 2,
      y: railY,
    })
  })

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

  context.strokeStyle = frameOption.id === CIRCUIT_FRAME_ID ? '#111111' : frameOption.border
  context.lineWidth = frameOption.id === CIRCUIT_FRAME_ID ? 3 : 2
  context.strokeRect(targetX + 1, targetY + 1, PHOTO_WIDTH - 2, PHOTO_HEIGHT - 2)

  if (frameOption.id === OAZ_FRAME_ID) {
    drawOazPhotoSideLabels(context, index, frameOption, targetY)
  }
}

function drawFooter(context, options) {
  const { dateText, frameOption, showDate } = options
  const footerTop =
    TOP_PADDING + PHOTO_HEIGHT * REQUIRED_PHOTO_COUNT + PHOTO_GAP * (REQUIRED_PHOTO_COUNT - 1)
  const centerX = CANVAS_WIDTH / 2
  const maxTextWidth = CANVAS_WIDTH - SIDE_PADDING * 2

  context.save()
  context.globalAlpha = frameOption.id === CIRCUIT_FRAME_ID ? 0.72 : 0.18
  context.strokeStyle = frameOption.accent
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(SIDE_PADDING, footerTop + 28)
  context.lineTo(CANVAS_WIDTH - SIDE_PADDING, footerTop + 28)
  context.stroke()
  context.restore()

  drawCenteredText(context, FRAME_BRAND_MESSAGE, {
    color: frameOption.foreground,
    maxFontSize: 78,
    maxWidth: maxTextWidth,
    minFontSize: 52,
    weight: 900,
    x: centerX,
    y: footerTop + (showDate ? 112 : FOOTER_HEIGHT / 2),
  })

  if (showDate) {
    drawCenteredText(context, dateText, {
      color: frameOption.secondaryText,
      maxFontSize: 46,
      maxWidth: maxTextWidth,
      minFontSize: 30,
      weight: 800,
      x: centerX,
      y: footerTop + 194,
    })
  }
}

export async function renderFinalStrip({
  dateText,
  frameColor,
  photos,
  qrCodeDataUrl = '',
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
  const [images, qrImage] = await Promise.all([
    Promise.all(photos.map((photo) => loadImage(photo.url))),
    qrCodeDataUrl ? loadImage(qrCodeDataUrl) : Promise.resolve(null),
  ])

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = frameOption.background
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  if (frameOption.id === OAZ_FRAME_ID) {
    drawOazFrameAccent(context, frameOption)
  }

  if (frameOption.id === CIRCUIT_FRAME_ID) {
    drawCircuitFrameAccent(context, frameOption)
  }

  drawQrCode(context, qrImage, frameOption)

  images.forEach((image, index) => {
    drawPhoto(context, image, index, frameOption)
  })

  drawFooter(context, {
    dateText,
    frameOption,
    showDate,
  })

  return createPngBlob(canvas)
}
