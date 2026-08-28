export const PRINTER_SETTINGS_STORAGE_KEY = 'oaz-printer-settings-v1'
export const PRINTER_SETTINGS_VERSION = 2

export const LUCK_JINGLE_BLE_UUIDS = {
  service: '0000ff00-0000-1000-8000-00805f9b34fb',
  notify: '0000ff01-0000-1000-8000-00805f9b34fb',
  write: '0000ff02-0000-1000-8000-00805f9b34fb',
  creditNotify: '0000ff03-0000-1000-8000-00805f9b34fb',
}
export const PRINTER_NAME_PREFIX = 'PPS1_'
export const PPS1_CREDIT_PACKET_SIZE = 20
export const PPS1_CREDIT_WAIT_TIMEOUT_MS = 30_000

export const PRINT_WIDTH_OPTIONS = [384, 576]

export const TEST_RASTER_WRITE_MODES = {
  withoutResponse: 'without-response',
  withResponse: 'with-response',
  withResponse20Pacing: 'with-response-20b-pacing',
}

export const TEST_RASTER_WRITE_MODE_OPTIONS = [
  { label: 'Without response (현재 방식)', value: TEST_RASTER_WRITE_MODES.withoutResponse },
  { label: 'With response 200B (기존 실험)', value: TEST_RASTER_WRITE_MODES.withResponse },
  {
    label: 'With response 20B pacing (신규 실험)',
    value: TEST_RASTER_WRITE_MODES.withResponse20Pacing,
  },
]

export const DENSITY_OPTIONS = [
  { label: '연하게', value: 0 },
  { label: '보통', value: 1 },
  { label: '진하게', value: 2 },
]

export const MIN_LONG_PRINT_BATTERY_PERCENT = 30
export const BAND_HEIGHT = 96
export const BAND_PAUSE_MS = 500
export const STATUS_CHECK_EVERY_BANDS = 2
export const DARK_BAND_RATIO = 0.55
export const DARK_BAND_PAUSE_MS = 900
export const SAFE_PHOTO_DENSITY = 0
export const PPS1_LONG_PRINT_EXPERIMENTAL = false

export const DEFAULT_PRINTER_PROFILE = {
  id: 'luckprinter-normal-384',
  printWidth: 384,
  density: 0,
  feedDots: 80,
  enablePrinterMode: 3,
  chunkSize: PPS1_CREDIT_PACKET_SIZE,
  chunkDelayMs: 0,
  maxWidth: 576,
  maxHeight: 5000,
  maxRasterBytes: 400_000,
  setPrintWidthCommand: false,
  bandHeight: BAND_HEIGHT,
  bandPauseMs: BAND_PAUSE_MS,
  statusCheckEveryBands: STATUS_CHECK_EVERY_BANDS,
  darkBandRatio: DARK_BAND_RATIO,
  darkBandPauseMs: DARK_BAND_PAUSE_MS,
  minLongPrintBatteryPercent: MIN_LONG_PRINT_BATTERY_PERCENT,
}

const MODEL_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x20, 0xf0)
const FIRMWARE_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x20, 0xf1)
const SERIAL_NUMBER_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x20, 0xf2)
const BOOT_INFO_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x20, 0xef)
const PRINTER_INFO_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x70)
const STATUS_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x40)
const BATTERY_QUERY_COMMAND = Uint8Array.of(0x10, 0xff, 0x50, 0xf1)
const ENABLE_PRINTER_COMMAND = Uint8Array.of(0x10, 0xff, 0xf1, 0x03)
const WAKE_PRINTER_COMMAND = Uint8Array.of(
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
)
const SET_MARK_PRINT_LAST_COMMAND = Uint8Array.of(0x1b, 0xbb, 0xbb)
const STOP_PRINT_JOB_COMMAND = Uint8Array.of(0x10, 0xff, 0xf1, 0x45)
const STOP_PRINT_ACK_TIMEOUT_MS = 70_000
const MAX_CREDIT_LOG_LENGTH = 6
const MAX_PRINT_TRACE_EVENTS = 18
const MAX_RASTER_WRITE_EVENTS = 400
const MAX_NOTIFICATION_TRACE_EVENTS = 100
const MIN_REQUESTED_PACKET_SIZE = 20
const MAX_REQUESTED_PACKET_SIZE = 512
const PACKET_SIZE_SOURCE_DEFAULT = 'default 20'
const PACKET_SIZE_SOURCE_FF03 = 'FF03 requested'
const TEST_IMAGE_HEIGHT = 128
const TEST_JOB_MARKERS = [
  { name: 'A', y: 10 },
  { name: 'B', y: 68 },
  { name: 'C', y: 104 },
  { name: 'D', y: 120 },
]

function createEmptyPacketSizeWriteError() {
  return {
    attemptedSize: null,
    message: '',
    name: '',
    occurred: false,
    phase: '',
  }
}

function createEmptyWritePacketDiagnostics() {
  return {
    bufferByteLength: 0,
    byteLength: 0,
    byteOffset: 0,
  }
}

function createEmptyWithResponseWriteError() {
  return {
    message: '',
    name: '',
    occurred: false,
    phase: '',
  }
}

function createEmptyOriginalWriteError() {
  return {
    apiName: '',
    byteEnd: null,
    byteStart: null,
    message: '',
    name: '',
    occurred: false,
    packetSeq: null,
    writeMode: '',
  }
}

function normalizeTestRasterWriteMode(writeMode) {
  return Object.values(TEST_RASTER_WRITE_MODES).includes(writeMode)
    ? writeMode
    : TEST_RASTER_WRITE_MODES.withoutResponse
}

function createEmptyRasterWriteDiagnostics() {
  return {
    currentTestRasterWriteMode: TEST_RASTER_WRITE_MODES.withoutResponse,
    currentJobId: '',
    duplicateTestPrintBlockedCount: 0,
    imageHeight: TEST_IMAGE_HEIGHT,
    lastRasterWriteMode: '',
    lastJobId: '',
    markerMetadata: [],
    notificationEvents: [],
    originalWriteError: createEmptyOriginalWriteError(),
    packetEvents: [],
    printWidth: 0,
    rasterRowBytes: 0,
    rasterTotalBytes: 0,
    rasterWriteAttemptedBytes: 0,
    rasterWriteAttemptedPackets: 0,
    rasterWriteRejectedPackets: 0,
    rasterWriteResolvedBytes: 0,
    rasterWriteResolvedPackets: 0,
    testPrintInvocationCount: 0,
    testRasterEffectivePacketSize: PPS1_CREDIT_PACKET_SIZE,
    lastWithResponseWriteDurationMs: null,
    withResponseWriteAverageDurationMs: null,
    withResponseWriteMaxDurationMs: null,
    withResponseWriteSuccessPackets: 0,
    withResponseWriteTotalDurationMs: 0,
    withResponseWriteError: createEmptyWithResponseWriteError(),
  }
}

function createEmptyWriteCharacteristicCapabilities() {
  return {
    uuid: '',
    properties: {
      indicate: null,
      notify: null,
      read: null,
      write: null,
      writeWithoutResponse: null,
    },
    api: {
      writeValueWithResponse: null,
      writeValueWithoutResponse: null,
    },
  }
}

function getWriteCharacteristicCapabilities(characteristic) {
  if (!characteristic) {
    return createEmptyWriteCharacteristicCapabilities()
  }

  const properties = characteristic.properties

  return {
    uuid: characteristic.uuid ?? '',
    properties: {
      indicate: Boolean(properties?.indicate),
      notify: Boolean(properties?.notify),
      read: Boolean(properties?.read),
      write: Boolean(properties?.write),
      writeWithoutResponse: Boolean(properties?.writeWithoutResponse),
    },
    api: {
      writeValueWithResponse:
        typeof characteristic.writeValueWithResponse === 'function',
      writeValueWithoutResponse:
        typeof characteristic.writeValueWithoutResponse === 'function',
    },
  }
}

function createEmptyStopAckDiagnostics() {
  return {
    durationMs: null,
    packetHex: '',
    status: 'idle',
  }
}

function createEmptyPrintTraceDiagnostics() {
  return {
    creditWaitInProgress: false,
    creditWaitPhase: '',
    creditWaitStartedAt: '',
    currentPhase: '',
    disconnectAt: '',
    events: [],
    lastCompletedPhase: '',
    lastCreditNotificationAt: '',
    lastNotificationAt: '',
    lastWritePacketHex: '',
    pendingWritePreviewHex: '',
    rasterCompletedBytes: 0,
    rasterCompletedPackets: 0,
    rasterTotalBytes: 0,
    rasterTotalPackets: 0,
  }
}

function createEmptyLastSessionDiagnostics() {
  return {
    activePacketSize: PPS1_CREDIT_PACKET_SIZE,
    activePacketSizeSource: PACKET_SIZE_SOURCE_DEFAULT,
    currentCredit: null,
    disconnectEventOccurred: false,
    disconnectedAt: '',
    lastCreditNotificationHex: '',
    lastWebBluetoothWritePacket: createEmptyWritePacketDiagnostics(),
    lastWebBluetoothWriteSize: 0,
    lastNotificationHex: '',
    packetSizeWriteError: createEmptyPacketSizeWriteError(),
    printTrace: createEmptyPrintTraceDiagnostics(),
    printerRequestedPacketSize: null,
    rasterWriteDiagnostics: createEmptyRasterWriteDiagnostics(),
    stopAck: createEmptyStopAckDiagnostics(),
    writeCharacteristicCapabilities: createEmptyWriteCharacteristicCapabilities(),
  }
}

export class LuckJinglePrinterError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'LuckJinglePrinterError'
    this.code = code
  }
}

export function isWebBluetoothSupported() {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

export function normalizePrinterSettings(settings = {}) {
  const printWidth = Number(settings.printWidth)
  const density = Number(settings.density)
  const isCurrentSettingsVersion = settings.version === PRINTER_SETTINGS_VERSION

  return {
    version: PRINTER_SETTINGS_VERSION,
    printWidth: PRINT_WIDTH_OPTIONS.includes(printWidth)
      ? printWidth
      : DEFAULT_PRINTER_PROFILE.printWidth,
    density: isCurrentSettingsVersion && DENSITY_OPTIONS.some((option) => option.value === density)
      ? density
      : DEFAULT_PRINTER_PROFILE.density,
    directPrintVerified: isCurrentSettingsVersion && settings.directPrintVerified === true,
    deviceId: typeof settings.deviceId === 'string' ? settings.deviceId : '',
    deviceName: typeof settings.deviceName === 'string' ? settings.deviceName : '',
    testRasterWriteMode: normalizeTestRasterWriteMode(settings.testRasterWriteMode),
  }
}

export function loadStoredPrinterSettings() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return normalizePrinterSettings()
  }

  try {
    const storedSettings = window.localStorage.getItem(PRINTER_SETTINGS_STORAGE_KEY)

    return normalizePrinterSettings(storedSettings ? JSON.parse(storedSettings) : {})
  } catch {
    return normalizePrinterSettings()
  }
}

export function saveStoredPrinterSettings(settings) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(
      PRINTER_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalizePrinterSettings(settings)),
    )
  } catch {
    // localStorage may be unavailable in private or restricted browser contexts.
  }
}

function createPrinterProfile(settings = {}) {
  const normalizedSettings = normalizePrinterSettings(settings)

  return {
    ...DEFAULT_PRINTER_PROFILE,
    printWidth: normalizedSettings.printWidth,
    density: normalizedSettings.density,
  }
}

function createSafePhotoPrinterProfile(settings = {}) {
  return {
    ...createPrinterProfile(settings),
    density: SAFE_PHOTO_DENSITY,
  }
}

function dataViewToBytes(dataView) {
  return new Uint8Array(
    dataView.buffer.slice(dataView.byteOffset, dataView.byteOffset + dataView.byteLength),
  )
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function createTestJobId(sequence) {
  return `T${String(sequence % 10000).padStart(4, '0')}`
}

function createTestJobMetadata(profile, effectivePacketSize, jobId) {
  const width = profile.printWidth
  const rowBytes = Math.ceil(width / 8)
  const rasterDataBytes = rowBytes * TEST_IMAGE_HEIGHT
  const packetSize = Math.max(1, effectivePacketSize || PPS1_CREDIT_PACKET_SIZE)
  const markerMetadata = TEST_JOB_MARKERS.map((marker) => {
    const byteOffset = 8 + marker.y * rowBytes

    return {
      ...marker,
      byteOffset,
      packetIndex: Math.floor(byteOffset / packetSize) + 1,
    }
  })

  return {
    imageHeight: TEST_IMAGE_HEIGHT,
    jobId,
    markerMetadata,
    rasterDataBytes,
    rasterRowBytes: rowBytes,
    rasterTotalBytes: 8 + rasterDataBytes,
    testRasterEffectivePacketSize: packetSize,
    width,
  }
}

function getWriteApiNameForMode(characteristic, writeMode) {
  const properties = characteristic?.properties

  if (
    writeMode === TEST_RASTER_WRITE_MODES.withResponse ||
    writeMode === TEST_RASTER_WRITE_MODES.withResponse20Pacing
  ) {
    return 'with-response'
  }

  if (
    properties?.writeWithoutResponse &&
    typeof characteristic?.writeValueWithoutResponse === 'function'
  ) {
    return 'without-response'
  }

  if (typeof characteristic?.writeValue === 'function') {
    return 'writeValue'
  }

  if (typeof characteristic?.writeValueWithResponse === 'function') {
    return 'with-response'
  }

  return 'unknown'
}

function getDiagnosticErrorMessage(error, fallbackMessage = 'empty message') {
  if (typeof error?.message === 'string' && error.message.length > 0) {
    return error.message
  }

  return fallbackMessage
}

function createBleWritePacket(bytes, offset, packetSize) {
  return new Uint8Array(bytes.subarray(offset, offset + packetSize))
}

function getWritePacketDiagnostics(packet) {
  return {
    bufferByteLength: packet.buffer.byteLength,
    byteLength: packet.byteLength,
    byteOffset: packet.byteOffset,
  }
}

async function getWriteCharacteristic(service) {
  try {
    if (typeof service.getCharacteristics === 'function') {
      const characteristics = await service.getCharacteristics()
      const writableWithoutResponse = characteristics.find(
        (characteristic) => characteristic.properties?.writeWithoutResponse,
      )

      if (writableWithoutResponse) {
        return writableWithoutResponse
      }
    }
  } catch {
    // Fall back to the known FF02 characteristic when listing is unavailable.
  }

  return service.getCharacteristic(LUCK_JINGLE_BLE_UUIDS.write)
}

function isMostlyPrintableAscii(bytes) {
  if (bytes.length < 2) {
    return false
  }

  let printableCount = 0

  bytes.forEach((byte) => {
    if (byte === 0x0a || byte === 0x0d || byte === 0x09 || (byte >= 0x20 && byte <= 0x7e)) {
      printableCount += 1
    }
  })

  return printableCount / bytes.length >= 0.8
}

function readAsciiModel(bytes) {
  if (!isMostlyPrintableAscii(bytes)) {
    return ''
  }

  const text = String.fromCharCode(...bytes)
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length >= 2 ? text.slice(0, 80) : ''
}

function decodeNotificationText(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    try {
      return new TextDecoder('utf-8').decode(bytes)
    } catch {
      // Fall back to ASCII decoding below.
    }
  }

  return String.fromCharCode(...bytes)
}

function parseStopPrintAck(bytes) {
  if (bytes.length > 0 && bytes[0] === 0xaa) {
    return { packetHex: bytesToHex(bytes) }
  }

  const text = decodeNotificationText(bytes).replace(/^\uFEFF/, '').trim()

  return text.startsWith('OK') ? { packetHex: bytesToHex(bytes), text } : null
}

function parseStatusResponse(bytes) {
  if (bytes.length === 0 || bytes.length > 8 || isMostlyPrintableAscii(bytes)) {
    return null
  }

  const statusByte = bytes[bytes.length - 1]
  const issues = []

  if (statusByte & 0b0000_0010) {
    issues.push({ code: 'cover-open', message: '프린터 덮개를 확인해 주세요.' })
  }

  if (statusByte & 0b0000_0100) {
    issues.push({ code: 'paper-empty', message: '프린터에 용지가 없어요.' })
  }

  if (statusByte & 0b0000_1000) {
    issues.push({ code: 'low-battery', message: '프린터 배터리가 부족해요.' })
  }

  if ((statusByte & 0b0001_0000) || (statusByte & 0b0100_0000)) {
    issues.push({ code: 'overheating', message: '프린터가 뜨거워졌어요. 잠시 식힌 뒤 다시 시도해 주세요.' })
  }

  return {
    statusByte,
    isPrinting: Boolean(statusByte & 0b0000_0001),
    isCharging: Boolean(statusByte & 0b0010_0000),
    issues,
    message: issues.length > 0 ? issues.map((issue) => issue.message).join(' ') : '상태 응답 수신됨',
  }
}

function parseBatteryResponse(bytes) {
  if (bytes.length < 2 || bytes.length > 8 || isMostlyPrintableAscii(bytes)) {
    return null
  }

  return {
    percent: Math.min(Math.max(bytes[1], 0), 100),
  }
}

function getBlockingStatusIssue(status, options = {}) {
  const { allowPrinting = false } = options

  if (!status) {
    return null
  }

  if (status.isPrinting && !allowPrinting) {
    return { code: 'printer-busy', message: '프린터가 아직 인쇄 중이에요.' }
  }

  return status.issues[0] ?? null
}

function createDensityCommand(density) {
  return Uint8Array.of(0x10, 0xff, 0x10, 0x00, density)
}

function createPrintWidthCommand(printWidth) {
  return Uint8Array.of(0x10, 0xff, 0x15, printWidth & 0xff, (printWidth >> 8) & 0xff)
}

function createFeedCommand(feedDots) {
  return Uint8Array.of(0x1b, 0x4a, feedDots & 0xff)
}

function createRequestDeviceOptions(options = {}) {
  const { includeAllDevices = false } = options
  const baseOptions = {
    optionalServices: [LUCK_JINGLE_BLE_UUIDS.service],
  }

  if (includeAllDevices) {
    return {
      ...baseOptions,
      acceptAllDevices: true,
    }
  }

  return {
    ...baseOptions,
    filters: [
      {
        namePrefix: PRINTER_NAME_PREFIX,
      },
    ],
  }
}

function hasSavedDeviceReference(savedDevice = {}) {
  return Boolean(savedDevice.deviceId || savedDevice.deviceName)
}

function hasPrinterNamePrefix(device) {
  return typeof device?.name === 'string' && device.name.startsWith(PRINTER_NAME_PREFIX)
}

function findAuthorizedPrinterDevice(devices, savedDevice = {}) {
  const deviceList = Array.from(devices)

  if (savedDevice.deviceId) {
    const deviceById = deviceList.find((device) => device.id === savedDevice.deviceId)

    if (deviceById) {
      return deviceById
    }
  }

  if (savedDevice.deviceName) {
    const deviceByName = deviceList.find((device) => device.name === savedDevice.deviceName)

    if (deviceByName) {
      return deviceByName
    }
  }

  return deviceList.find(hasPrinterNamePrefix) ?? null
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)

      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        reject(new LuckJinglePrinterError('image-invalid', 'Image dimensions are invalid'))
        return
      }

      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new LuckJinglePrinterError('image-invalid', 'Image loading failed'))
    }

    image.src = imageUrl
  })
}

function getPrintableImageData(image, profile) {
  const width = profile.printWidth
  const height = Math.round((image.naturalHeight / image.naturalWidth) * width)

  if (width > profile.maxWidth || height > profile.maxHeight) {
    throw new LuckJinglePrinterError('image-too-large', 'Printable image dimensions are too large')
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new LuckJinglePrinterError('canvas-unavailable', 'Canvas context unavailable')
  }

  canvas.width = width
  canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return context.getImageData(0, 0, width, height)
}

function createTestImageData(profile, testJob = {}) {
  const width = profile.printWidth
  const height = TEST_IMAGE_HEIGHT
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new LuckJinglePrinterError('canvas-unavailable', 'Canvas context unavailable')
  }

  canvas.width = width
  canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#000000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '700 40px "Segoe UI", Arial, sans-serif'
  context.fillText('OAZ', width / 2, 46)
  if (testJob.jobId) {
    context.font = '700 14px "Segoe UI", Arial, sans-serif'
    context.fillText(testJob.jobId, width / 2, 68)
  }
  context.font = '700 24px "Segoe UI", Arial, sans-serif'
  context.fillText('PRINT TEST', width / 2, 88)

  const markers = Array.isArray(testJob.markerMetadata)
    ? testJob.markerMetadata
    : TEST_JOB_MARKERS

  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.font = '700 10px "Segoe UI", Arial, sans-serif'
  markers.forEach((marker) => {
    context.fillText(marker.name, 8, marker.y)
    context.fillRect(22, marker.y, 18, 1)
  })

  context.fillRect(Math.round(width * 0.2), 112, Math.round(width * 0.6), 4)

  return context.getImageData(0, 0, width, height)
}

function createPackedBitmap(imageData) {
  const { data, width, height } = imageData
  const widthBytes = Math.ceil(width / 8)
  const grayscale = new Float32Array(width * height)
  const bitmap = new Uint8Array(widthBytes * height)
  const blackPixelsByRow = new Uint16Array(height)

  for (let index = 0; index < width * height; index += 1) {
    const sourceIndex = index * 4
    const alpha = data[sourceIndex + 3] / 255
    const red = 255 + (data[sourceIndex] - 255) * alpha
    const green = 255 + (data[sourceIndex + 1] - 255) * alpha
    const blue = 255 + (data[sourceIndex + 2] - 255) * alpha

    grayscale[index] = red * 0.299 + green * 0.587 + blue * 0.114
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const oldPixel = grayscale[index]
      const newPixel = oldPixel < 128 ? 0 : 255
      const error = oldPixel - newPixel

      grayscale[index] = newPixel

      if (newPixel === 0) {
        bitmap[y * widthBytes + Math.floor(x / 8)] |= 0x80 >> (x % 8)
        blackPixelsByRow[y] += 1
      }

      if (x + 1 < width) {
        grayscale[index + 1] += (error * 7) / 16
      }

      if (y + 1 < height) {
        if (x > 0) {
          grayscale[index + width - 1] += (error * 3) / 16
        }

        grayscale[index + width] += (error * 5) / 16

        if (x + 1 < width) {
          grayscale[index + width + 1] += error / 16
        }
      }
    }
  }

  return { bitmap, blackPixelsByRow, height, width, widthBytes }
}

function createRasterCommandFromBitmap(bitmap, height, widthBytes, profile) {
  if (bitmap.byteLength > profile.maxRasterBytes || widthBytes > 0xffff || height > 0xffff) {
    throw new LuckJinglePrinterError('image-too-large', 'Printable image raster is too large')
  }

  const header = Uint8Array.of(
    0x1d,
    0x76,
    0x30,
    0x00,
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  )
  const command = new Uint8Array(header.byteLength + bitmap.byteLength)

  command.set(header)
  command.set(bitmap, header.byteLength)

  return command
}

function createRasterCommand(imageData, profile) {
  const { bitmap, height, widthBytes } = createPackedBitmap(imageData)

  return createRasterCommandFromBitmap(bitmap, height, widthBytes, profile)
}

function createRasterBands(imageData, profile) {
  const { bitmap, blackPixelsByRow, height, width, widthBytes } = createPackedBitmap(imageData)
  const bandHeight = Math.max(1, profile.bandHeight)
  const bands = []

  for (let startY = 0; startY < height; startY += bandHeight) {
    const currentBandHeight = Math.min(bandHeight, height - startY)
    const startByte = startY * widthBytes
    const endByte = (startY + currentBandHeight) * widthBytes
    const bandBitmap = bitmap.slice(startByte, endByte)
    let blackPixels = 0

    for (let row = startY; row < startY + currentBandHeight; row += 1) {
      blackPixels += blackPixelsByRow[row]
    }

    bands.push({
      command: createRasterCommandFromBitmap(bandBitmap, currentBandHeight, widthBytes, profile),
      height: currentBandHeight,
      startY,
      blackRatio: blackPixels / (width * currentBandHeight),
    })
  }

  return bands
}

async function createRasterCommandFromBlob(finalImageBlob, profile) {
  const image = await loadImageFromBlob(finalImageBlob)
  const imageData = getPrintableImageData(image, profile)

  return createRasterCommand(imageData, profile)
}

async function createRasterBandsFromBlob(finalImageBlob, profile) {
  const image = await loadImageFromBlob(finalImageBlob)
  const imageData = getPrintableImageData(image, profile)

  return createRasterBands(imageData, profile)
}

function createTestRasterCommand(profile, testJob) {
  return createRasterCommand(createTestImageData(profile, testJob), profile)
}

export function getPrinterErrorMessage(error) {
  switch (error?.code) {
    case 'unsupported':
      return '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.'
    case 'not-connected':
    case 'connection-lost':
      return '프린터 연결이 끊겼어요. 관리자에게 알려 주세요.'
    case 'device-missing':
      return '프린터 연결이 필요해요. 관리자에게 알려 주세요.'
    case 'credit-unavailable':
      return 'PPS1 credit characteristic(FF03)을 사용할 수 없음'
    case 'credit-timeout':
      return 'PPS1 credit 응답을 기다리는 중 시간이 초과됐어요.'
    case 'stop-ack-timeout':
      return 'stopPrintJobLuck ACK 응답을 기다리는 중 시간이 초과됐어요.'
    case 'packet-size-write-failed':
      return 'requested packet size write failed'
    case 'long-print-locked':
      return '직접 인쇄 프로토콜을 확인 중이에요. 관리자에게 알려 주세요.'
    case 'print-disconnected':
      return '인쇄 중 프린터 전원이 꺼졌거나\n연결이 끊겼어요.\n프린터를 충분히 충전하고 잠시 식힌 뒤 다시 시도해 주세요.'
    case 'battery-too-low':
      return '프린터 배터리가 부족해요.\n충전 후 다시 인쇄해 주세요.'
    case 'paper-empty':
      return '프린터 용지를 확인해 주세요.'
    case 'cover-open':
      return '프린터 덮개를 확인해 주세요.'
    case 'low-battery':
      return '프린터 배터리가 부족해요. 관리자에게 알려 주세요.'
    case 'overheating':
      return '프린터가 뜨거워졌어요. 잠시 후 다시 시도해 주세요.'
    case 'image-too-large':
      return '인쇄 이미지가 너무 커요.'
    case 'printer-busy':
      return '프린터가 아직 인쇄 중이에요.'
    case 'transfer-failed':
      return 'Bluetooth 전송에 실패했어요. 프린터 연결을 확인해 주세요.'
    case 'incompatible-protocol':
      return '프린터는 찾았지만 현재 인쇄 프로토콜과 맞지 않아요.'
    default:
      return '프린터 연결을 확인해 주세요.'
  }
}

export class LuckJingleBlePrinter {
  constructor(options = {}) {
    this.device = null
    this.server = null
    this.service = null
    this.writeCharacteristic = null
    this.notifyCharacteristic = null
    this.creditCharacteristic = null
    this.model = ''
    this.firmwareVersion = ''
    this.serialNumber = ''
    this.bootInfo = ''
    this.printerInfo = ''
    this.status = null
    this.batteryPercent = null
    this.activePacketSize = PPS1_CREDIT_PACKET_SIZE
    this.activePacketSizeSource = PACKET_SIZE_SOURCE_DEFAULT
    this.credit = 0
    this.creditNotifyConnected = false
    this.creditLog = []
    this.creditWaiters = new Set()
    this.creditWaitTimedOut = false
    this.printerRequestedPacketSize = null
    this.lastCreditNotificationHex = ''
    this.lastWebBluetoothWritePacket = createEmptyWritePacketDiagnostics()
    this.lastWebBluetoothWriteSize = 0
    this.lastNotificationHex = ''
    this.lastSessionDiagnostics = createEmptyLastSessionDiagnostics()
    this.packetSizeWriteError = createEmptyPacketSizeWriteError()
    this.printTrace = createEmptyPrintTraceDiagnostics()
    this.rasterWriteDiagnostics = createEmptyRasterWriteDiagnostics()
    this.stopAckStartedAt = 0
    this.stopAckDiagnostics = createEmptyStopAckDiagnostics()
    this.testJobSequence = Date.now() % 10000
    this.transportSessionId = 0
    this.writeCharacteristicUuid = ''
    this.writeCharacteristicCapabilities = createEmptyWriteCharacteristicCapabilities()
    this.writeWithoutResponseAvailable = false
    this.notificationWaiters = new Set()
    this.onDisconnect = options.onDisconnect
    this.onBattery = options.onBattery
    this.onModel = options.onModel
    this.onDiagnostics = options.onDiagnostics
    this.onTransportDiagnostics = options.onTransportDiagnostics
    this.onStatus = options.onStatus
    this.handleGattDisconnected = this.handleGattDisconnected.bind(this)
    this.handleNotification = this.handleNotification.bind(this)
    this.handleCreditNotification = this.handleCreditNotification.bind(this)
  }

  hasDevice() {
    return Boolean(this.device)
  }

  isConnected() {
    return Boolean(
      this.device?.gatt?.connected &&
        this.writeCharacteristic &&
        this.notifyCharacteristic &&
        this.creditCharacteristic,
    )
  }

  getConnectionInfo() {
    return {
      deviceId: this.device?.id ?? '',
      deviceName: this.device?.name ?? '',
      batteryPercent: this.batteryPercent,
      firmwareVersion: this.firmwareVersion,
      model: this.model,
      status: this.status,
      transportDiagnostics: this.getTransportDiagnostics(),
    }
  }

  getDiagnosticsInfo() {
    return {
      model: this.model,
      firmwareVersion: this.firmwareVersion,
      hasSerialNumber: Boolean(this.serialNumber),
      hasBootInfo: Boolean(this.bootInfo),
      hasPrinterInfo: Boolean(this.printerInfo),
    }
  }

  emitDiagnostics() {
    this.onDiagnostics?.(this.getDiagnosticsInfo())
  }

  getStopAckDiagnostics() {
    return { ...this.stopAckDiagnostics }
  }

  getPrintTraceDiagnostics() {
    return {
      ...this.printTrace,
      events: [...this.printTrace.events],
    }
  }

  getActivePacketSize() {
    return this.activePacketSize || PPS1_CREDIT_PACKET_SIZE
  }

  getRasterEffectivePacketSize(writeMode) {
    const normalizedWriteMode = normalizeTestRasterWriteMode(writeMode)

    return normalizedWriteMode === TEST_RASTER_WRITE_MODES.withResponse20Pacing
      ? PPS1_CREDIT_PACKET_SIZE
      : this.getActivePacketSize()
  }

  getPacketSizeWriteError() {
    return { ...this.packetSizeWriteError }
  }

  getRasterWriteDiagnostics() {
    return {
      ...this.rasterWriteDiagnostics,
      markerMetadata: [...this.rasterWriteDiagnostics.markerMetadata],
      notificationEvents: [...this.rasterWriteDiagnostics.notificationEvents],
      originalWriteError: {
        ...this.rasterWriteDiagnostics.originalWriteError,
      },
      packetEvents: [...this.rasterWriteDiagnostics.packetEvents],
      withResponseWriteError: {
        ...this.rasterWriteDiagnostics.withResponseWriteError,
      },
    }
  }

  getTransportDiagnostics() {
    return {
      activePacketSize: this.getActivePacketSize(),
      activePacketSizeSource: this.activePacketSizeSource,
      creditNotifyConnected: this.creditNotifyConnected,
      currentCredit: this.credit,
      packetSize: this.getActivePacketSize(),
      printerRequestedPacketSize: this.printerRequestedPacketSize,
      lastCreditNotificationHex: this.lastCreditNotificationHex,
      lastWebBluetoothWritePacket: { ...this.lastWebBluetoothWritePacket },
      lastWebBluetoothWriteSize: this.lastWebBluetoothWriteSize,
      lastNotificationHex: this.lastNotificationHex,
      packetSizeWriteError: this.getPacketSizeWriteError(),
      rasterWriteDiagnostics: this.getRasterWriteDiagnostics(),
      creditWaitTimedOut: this.creditWaitTimedOut,
      creditLog: this.creditLog,
      lastSession: this.lastSessionDiagnostics,
      printTrace: this.getPrintTraceDiagnostics(),
      stopAck: this.getStopAckDiagnostics(),
      writeCharacteristicCapabilities: this.writeCharacteristicCapabilities,
      writeCharacteristicUuid: this.writeCharacteristicUuid,
      writeWithoutResponseAvailable: this.writeWithoutResponseAvailable,
    }
  }

  emitTransportDiagnostics() {
    this.onTransportDiagnostics?.(this.getTransportDiagnostics())
  }

  captureLastSessionDiagnostics(options = {}) {
    const { disconnectedAt = new Date().toISOString(), disconnectEventOccurred = false } = options

    this.lastSessionDiagnostics = {
      activePacketSize: this.getActivePacketSize(),
      activePacketSizeSource: this.activePacketSizeSource,
      currentCredit: this.credit,
      disconnectEventOccurred,
      disconnectedAt,
      lastCreditNotificationHex: this.lastCreditNotificationHex,
      lastWebBluetoothWritePacket: { ...this.lastWebBluetoothWritePacket },
      lastWebBluetoothWriteSize: this.lastWebBluetoothWriteSize,
      lastNotificationHex: this.lastNotificationHex,
      packetSizeWriteError: this.getPacketSizeWriteError(),
      printTrace: this.getPrintTraceDiagnostics(),
      printerRequestedPacketSize: this.printerRequestedPacketSize,
      rasterWriteDiagnostics: this.getRasterWriteDiagnostics(),
      stopAck: this.getStopAckDiagnostics(),
      writeCharacteristicCapabilities: this.writeCharacteristicCapabilities,
    }
  }

  resetPrintTrace() {
    const {
      duplicateTestPrintBlockedCount = 0,
      testPrintInvocationCount = 0,
    } = this.rasterWriteDiagnostics

    this.printTrace = createEmptyPrintTraceDiagnostics()
    this.stopAckStartedAt = 0
    this.stopAckDiagnostics = createEmptyStopAckDiagnostics()
    this.packetSizeWriteError = createEmptyPacketSizeWriteError()
    this.rasterWriteDiagnostics = {
      ...createEmptyRasterWriteDiagnostics(),
      duplicateTestPrintBlockedCount,
      testPrintInvocationCount,
    }
    this.emitTransportDiagnostics()
  }

  recordTestPrintInvocation() {
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      testPrintInvocationCount: this.rasterWriteDiagnostics.testPrintInvocationCount + 1,
    }
    this.emitTransportDiagnostics()
  }

  recordDuplicateTestPrintBlocked() {
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      duplicateTestPrintBlockedCount:
        this.rasterWriteDiagnostics.duplicateTestPrintBlockedCount + 1,
    }
    this.emitTransportDiagnostics()
  }

  beginTestJobDiagnostics(profile, writeMode) {
    this.testJobSequence += 1

    const normalizedWriteMode = normalizeTestRasterWriteMode(writeMode)
    const testRasterEffectivePacketSize =
      this.getRasterEffectivePacketSize(normalizedWriteMode)
    const testJob = createTestJobMetadata(
      profile,
      testRasterEffectivePacketSize,
      createTestJobId(this.testJobSequence),
    )

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      currentJobId: testJob.jobId,
      currentTestRasterWriteMode: normalizedWriteMode,
      imageHeight: testJob.imageHeight,
      lastJobId: testJob.jobId,
      markerMetadata: testJob.markerMetadata,
      notificationEvents: [],
      originalWriteError: createEmptyOriginalWriteError(),
      packetEvents: [],
      printWidth: testJob.width,
      rasterRowBytes: testJob.rasterRowBytes,
      rasterTotalBytes: testJob.rasterTotalBytes,
      rasterWriteAttemptedBytes: 0,
      rasterWriteAttemptedPackets: 0,
      rasterWriteRejectedPackets: 0,
      rasterWriteResolvedBytes: 0,
      rasterWriteResolvedPackets: 0,
      testRasterEffectivePacketSize,
    }
    this.emitTransportDiagnostics()

    return testJob
  }

  beginLongPrintDiagnostics(profile, rasterTotalBytes, writeMode) {
    this.testJobSequence += 1

    const normalizedWriteMode = normalizeTestRasterWriteMode(writeMode)
    const testRasterEffectivePacketSize =
      this.getRasterEffectivePacketSize(normalizedWriteMode)
    const jobId = createTestJobId(this.testJobSequence)

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      currentJobId: jobId,
      currentTestRasterWriteMode: normalizedWriteMode,
      imageHeight: 0,
      lastJobId: jobId,
      markerMetadata: [],
      notificationEvents: [],
      originalWriteError: createEmptyOriginalWriteError(),
      packetEvents: [],
      printWidth: profile.printWidth,
      rasterRowBytes: Math.ceil(profile.printWidth / 8),
      rasterTotalBytes,
      rasterWriteAttemptedBytes: 0,
      rasterWriteAttemptedPackets: 0,
      rasterWriteRejectedPackets: 0,
      rasterWriteResolvedBytes: 0,
      rasterWriteResolvedPackets: 0,
      testRasterEffectivePacketSize,
    }
    this.emitTransportDiagnostics()
  }

  recordPrintTracePhase(phase, options = {}) {
    const { completed = false } = options
    const event = {
      at: new Date().toISOString(),
      phase,
    }

    this.printTrace = {
      ...this.printTrace,
      currentPhase: phase,
      events: [event, ...this.printTrace.events].slice(0, MAX_PRINT_TRACE_EVENTS),
      lastCompletedPhase: completed ? phase : this.printTrace.lastCompletedPhase,
    }
    this.emitTransportDiagnostics()
  }

  setRasterTraceTotals(totalBytes, packetSize = this.getActivePacketSize()) {

    this.printTrace = {
      ...this.printTrace,
      rasterCompletedBytes: 0,
      rasterCompletedPackets: 0,
      rasterTotalBytes: totalBytes,
      rasterTotalPackets: Math.ceil(totalBytes / packetSize),
    }
    this.emitTransportDiagnostics()
  }

  updateRasterTracePacketTotals(packetSize = this.getActivePacketSize()) {

    if (this.printTrace.rasterTotalBytes <= 0) {
      return
    }

    this.printTrace = {
      ...this.printTrace,
      rasterCompletedPackets: Math.ceil(this.printTrace.rasterCompletedBytes / packetSize),
      rasterTotalPackets: Math.ceil(this.printTrace.rasterTotalBytes / packetSize),
    }
    this.emitTransportDiagnostics()
  }

  recordRasterPacketSent(completedBytes, completedPackets) {
    this.printTrace = {
      ...this.printTrace,
      rasterCompletedBytes: completedBytes,
      rasterCompletedPackets: completedPackets,
    }
    this.emitTransportDiagnostics()
  }

  recordWritePacketSuccess(packet) {
    this.printTrace = {
      ...this.printTrace,
      lastWritePacketHex: bytesToHex(packet),
      pendingWritePreviewHex: '',
    }
    this.lastWebBluetoothWriteSize = packet.byteLength
    this.lastWebBluetoothWritePacket = getWritePacketDiagnostics(packet)
    this.emitTransportDiagnostics()
  }

  beginCreditWaitTrace(phase, pendingPacket) {
    this.printTrace = {
      ...this.printTrace,
      creditWaitInProgress: true,
      creditWaitPhase: phase,
      creditWaitStartedAt: new Date().toISOString(),
      pendingWritePreviewHex: bytesToHex(pendingPacket.subarray(0, PPS1_CREDIT_PACKET_SIZE)),
    }
    this.emitTransportDiagnostics()
  }

  endCreditWaitTrace() {
    if (!this.printTrace.creditWaitInProgress) {
      return
    }

    this.printTrace = {
      ...this.printTrace,
      creditWaitInProgress: false,
    }
    this.emitTransportDiagnostics()
  }

  recordPrintTraceDisconnect(disconnectedAt) {
    this.printTrace = {
      ...this.printTrace,
      disconnectAt: disconnectedAt,
    }
    this.emitTransportDiagnostics()
  }

  applyRequestedPacketSize(requestedPacketSize) {
    if (
      requestedPacketSize >= MIN_REQUESTED_PACKET_SIZE &&
      requestedPacketSize <= MAX_REQUESTED_PACKET_SIZE
    ) {
      this.activePacketSize = requestedPacketSize
      this.activePacketSizeSource = PACKET_SIZE_SOURCE_FF03
    } else {
      this.activePacketSize = PPS1_CREDIT_PACKET_SIZE
      this.activePacketSizeSource = PACKET_SIZE_SOURCE_DEFAULT
    }

    const testRasterEffectivePacketSize = this.getRasterEffectivePacketSize(
      this.rasterWriteDiagnostics.lastRasterWriteMode ||
        this.rasterWriteDiagnostics.currentTestRasterWriteMode,
    )

    const rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      testRasterEffectivePacketSize,
    }

    if (
      this.rasterWriteDiagnostics.currentJobId &&
      Number.isFinite(this.rasterWriteDiagnostics.printWidth) &&
      this.rasterWriteDiagnostics.printWidth > 0
    ) {
      const testJob = createTestJobMetadata(
        { printWidth: this.rasterWriteDiagnostics.printWidth },
        testRasterEffectivePacketSize,
        this.rasterWriteDiagnostics.currentJobId,
      )

      rasterWriteDiagnostics.markerMetadata = testJob.markerMetadata
      rasterWriteDiagnostics.rasterRowBytes = testJob.rasterRowBytes
      rasterWriteDiagnostics.rasterTotalBytes = testJob.rasterTotalBytes
    }

    this.rasterWriteDiagnostics = rasterWriteDiagnostics
    this.updateRasterTracePacketTotals(testRasterEffectivePacketSize)
  }

  recordPacketSizeWriteError(error, packet, phase) {
    this.packetSizeWriteError = {
      attemptedSize: packet.byteLength,
      message: error?.message || 'requested packet size write failed',
      name: error?.name || 'Error',
      occurred: true,
      phase,
    }
    this.emitTransportDiagnostics()
  }

  setCurrentTestRasterWriteMode(writeMode) {
    const normalizedWriteMode = normalizeTestRasterWriteMode(writeMode)
    const testRasterEffectivePacketSize = this.getRasterEffectivePacketSize(normalizedWriteMode)

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      currentTestRasterWriteMode: normalizedWriteMode,
      testRasterEffectivePacketSize,
    }
    this.emitTransportDiagnostics()
  }

  recordRasterWriteStart(writeMode) {
    const normalizedWriteMode = normalizeTestRasterWriteMode(writeMode)
    const testRasterEffectivePacketSize = this.getRasterEffectivePacketSize(normalizedWriteMode)

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      currentTestRasterWriteMode: normalizedWriteMode,
      lastRasterWriteMode: normalizedWriteMode,
      testRasterEffectivePacketSize,
      ...(normalizedWriteMode === TEST_RASTER_WRITE_MODES.withResponse
        || normalizedWriteMode === TEST_RASTER_WRITE_MODES.withResponse20Pacing
        ? {
            lastWithResponseWriteDurationMs: null,
            withResponseWriteAverageDurationMs: null,
            withResponseWriteMaxDurationMs: null,
            withResponseWriteSuccessPackets: 0,
            withResponseWriteTotalDurationMs: 0,
            withResponseWriteError: createEmptyWithResponseWriteError(),
          }
        : {}),
    }
    this.updateRasterTracePacketTotals(testRasterEffectivePacketSize)
    this.emitTransportDiagnostics()
  }

  recordWithResponseWriteSuccess(durationMs) {
    const successPackets = this.rasterWriteDiagnostics.withResponseWriteSuccessPackets + 1
    const totalDurationMs =
      this.rasterWriteDiagnostics.withResponseWriteTotalDurationMs + durationMs
    const previousMaxDurationMs = Number.isFinite(
      this.rasterWriteDiagnostics.withResponseWriteMaxDurationMs,
    )
      ? this.rasterWriteDiagnostics.withResponseWriteMaxDurationMs
      : 0

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      lastWithResponseWriteDurationMs: durationMs,
      withResponseWriteAverageDurationMs: Math.round(totalDurationMs / successPackets),
      withResponseWriteMaxDurationMs: Math.max(previousMaxDurationMs, durationMs),
      withResponseWriteSuccessPackets: successPackets,
      withResponseWriteTotalDurationMs: totalDurationMs,
    }
    this.emitTransportDiagnostics()
  }

  recordWithResponseWriteError(error, phase) {
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      withResponseWriteError: {
        message: error?.message || 'writeValueWithResponse failed',
        name: error?.name || 'Error',
        occurred: true,
        phase,
      },
    }
    this.emitTransportDiagnostics()
  }

  recordRasterWriteAttempt(details) {
    const {
      apiName,
      offset,
      packet,
      phaseLabel,
      sessionId,
      writeMode,
    } = details
    const packetSeq = this.rasterWriteDiagnostics.rasterWriteAttemptedPackets + 1
    const event = {
      apiName,
      attemptedAt: new Date().toISOString(),
      bufferByteLength: packet.buffer.byteLength,
      byteEnd: offset + packet.byteLength - 1,
      byteStart: offset,
      byteOffset: packet.byteOffset,
      durationMs: null,
      errorMessage: '',
      errorName: '',
      firstBytesHex: bytesToHex(packet.subarray(0, 12)),
      jobId: this.rasterWriteDiagnostics.currentJobId,
      packetLength: packet.byteLength,
      phase: phaseLabel,
      rejected: false,
      rejectedAt: '',
      resolved: false,
      resolvedAt: '',
      seq: packetSeq,
      sessionId,
      writeMode,
    }

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      packetEvents: [event, ...this.rasterWriteDiagnostics.packetEvents].slice(
        0,
        MAX_RASTER_WRITE_EVENTS,
      ),
      rasterWriteAttemptedBytes:
        this.rasterWriteDiagnostics.rasterWriteAttemptedBytes + packet.byteLength,
      rasterWriteAttemptedPackets: packetSeq,
    }
    this.emitTransportDiagnostics()

    return event
  }

  updateRasterWriteEvent(packetSeq, updates) {
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      packetEvents: this.rasterWriteDiagnostics.packetEvents.map((event) =>
        event.seq === packetSeq ? { ...event, ...updates } : event,
      ),
    }
  }

  recordRasterWriteResolved(event, durationMs) {
    if (!event) {
      return
    }

    this.updateRasterWriteEvent(event.seq, {
      durationMs,
      resolved: true,
      resolvedAt: new Date().toISOString(),
    })
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      rasterWriteResolvedBytes:
        this.rasterWriteDiagnostics.rasterWriteResolvedBytes + event.packetLength,
      rasterWriteResolvedPackets:
        this.rasterWriteDiagnostics.rasterWriteResolvedPackets + 1,
    }
    this.emitTransportDiagnostics()
  }

  recordRasterWriteRejected(event, error, durationMs, apiName) {
    if (!event) {
      return
    }

    const errorName = error?.name || 'Error'
    const errorMessage = getDiagnosticErrorMessage(error)

    this.updateRasterWriteEvent(event.seq, {
      apiName,
      durationMs,
      errorMessage,
      errorName,
      rejected: true,
      rejectedAt: new Date().toISOString(),
    })
    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      originalWriteError: {
        apiName,
        byteEnd: event.byteEnd,
        byteStart: event.byteStart,
        message: errorMessage,
        name: errorName,
        occurred: true,
        packetSeq: event.seq,
        writeMode: event.writeMode,
      },
      rasterWriteRejectedPackets:
        this.rasterWriteDiagnostics.rasterWriteRejectedPackets + 1,
    }
    this.emitTransportDiagnostics()
  }

  recordNotificationTrace(characteristic, rawHex, receivedAt) {
    const event = {
      at: receivedAt,
      characteristic,
      currentCredit: this.credit,
      packetHex: rawHex,
      phase: this.printTrace.currentPhase,
      rasterWriteAttemptedPackets:
        this.rasterWriteDiagnostics.rasterWriteAttemptedPackets,
      rasterWriteResolvedPackets:
        this.rasterWriteDiagnostics.rasterWriteResolvedPackets,
    }

    this.rasterWriteDiagnostics = {
      ...this.rasterWriteDiagnostics,
      notificationEvents: [event, ...this.rasterWriteDiagnostics.notificationEvents].slice(
        0,
        MAX_NOTIFICATION_TRACE_EVENTS,
      ),
    }
    this.emitTransportDiagnostics()
  }

  beginStopAckWait() {
    this.stopAckStartedAt = performance.now()
    this.stopAckDiagnostics = {
      durationMs: null,
      packetHex: '',
      status: 'waiting',
    }
    this.emitTransportDiagnostics()
  }

  finishStopAckWait(status, options = {}) {
    const { packetHex = this.stopAckDiagnostics.packetHex } = options
    const durationMs = this.stopAckStartedAt
      ? Math.round(performance.now() - this.stopAckStartedAt)
      : null

    this.stopAckDiagnostics = {
      durationMs,
      packetHex,
      status,
    }
    this.stopAckStartedAt = 0
    this.emitTransportDiagnostics()
  }

  resetCreditState() {
    const {
      duplicateTestPrintBlockedCount = 0,
      testPrintInvocationCount = 0,
    } = this.rasterWriteDiagnostics

    this.abortNotificationWaiters(
      new LuckJinglePrinterError('connection-lost', 'Bluetooth transport session changed'),
    )
    this.abortCreditWaiters(
      new LuckJinglePrinterError('connection-lost', 'Bluetooth transport session changed'),
    )
    this.transportSessionId += 1
    this.credit = 0
    this.creditNotifyConnected = false
    this.creditLog = []
    this.creditWaitTimedOut = false
    this.activePacketSize = PPS1_CREDIT_PACKET_SIZE
    this.activePacketSizeSource = PACKET_SIZE_SOURCE_DEFAULT
    this.lastWebBluetoothWriteSize = 0
    this.lastWebBluetoothWritePacket = createEmptyWritePacketDiagnostics()
    this.packetSizeWriteError = createEmptyPacketSizeWriteError()
    this.rasterWriteDiagnostics = {
      ...createEmptyRasterWriteDiagnostics(),
      duplicateTestPrintBlockedCount,
      testPrintInvocationCount,
    }
    this.printerRequestedPacketSize = null
    this.lastCreditNotificationHex = ''
    this.lastNotificationHex = ''
    this.printTrace = createEmptyPrintTraceDiagnostics()
    this.stopAckStartedAt = 0
    this.stopAckDiagnostics = createEmptyStopAckDiagnostics()
    this.emitTransportDiagnostics()
  }

  recordCreditNotification(event) {
    this.creditLog = [event, ...this.creditLog].slice(0, MAX_CREDIT_LOG_LENGTH)
    this.emitTransportDiagnostics()
  }

  resolveCreditWaiters() {
    this.creditWaiters.forEach((waiter) => {
      clearTimeout(waiter.timeoutId)
      waiter.resolve()
    })
    this.creditWaiters.clear()
  }

  abortCreditWaiters(error) {
    this.creditWaiters.forEach((waiter) => {
      clearTimeout(waiter.timeoutId)
      waiter.reject(error)
    })
    this.creditWaiters.clear()
  }

  async requestAndConnect(options = {}) {
    if (!isWebBluetoothSupported()) {
      throw new LuckJinglePrinterError('unsupported', 'Web Bluetooth is unavailable')
    }

    const device = await navigator.bluetooth.requestDevice(createRequestDeviceOptions(options))

    return this.connectDevice(device)
  }

  async reconnectAuthorizedDevice(savedDevice = {}) {
    if (
      !isWebBluetoothSupported() ||
      typeof navigator.bluetooth.getDevices !== 'function'
    ) {
      return null
    }

    const device = await this.findAuthorizedDevice(savedDevice)

    return device ? this.connectDevice(device) : null
  }

  async findAuthorizedDevice(savedDevice = {}) {
    if (!isWebBluetoothSupported() || typeof navigator.bluetooth.getDevices !== 'function') {
      return null
    }

    const devices = await navigator.bluetooth.getDevices()

    if (!hasSavedDeviceReference(savedDevice) && devices.length === 0) {
      return null
    }

    return findAuthorizedPrinterDevice(devices, savedDevice)
  }

  async connectDevice(device) {
    if (!device?.gatt) {
      throw new LuckJinglePrinterError('connection-lost', 'Bluetooth GATT is unavailable')
    }

    this.detachNotifications()
    this.detachDeviceListener()
    this.resetCreditState()
    this.device = device
    this.device.addEventListener('gattserverdisconnected', this.handleGattDisconnected)

    try {
      this.server = await device.gatt.connect()

      try {
        this.service = await this.server.getPrimaryService(LUCK_JINGLE_BLE_UUIDS.service)
        this.writeCharacteristic = await getWriteCharacteristic(this.service)
        this.notifyCharacteristic = await this.service.getCharacteristic(LUCK_JINGLE_BLE_UUIDS.notify)
        this.writeCharacteristicCapabilities = getWriteCharacteristicCapabilities(
          this.writeCharacteristic,
        )
        this.writeCharacteristicUuid = this.writeCharacteristicCapabilities.uuid
        this.writeWithoutResponseAvailable = Boolean(
          this.writeCharacteristicCapabilities.properties.writeWithoutResponse,
        )

        this.notifyCharacteristic.addEventListener(
          'characteristicvaluechanged',
          this.handleNotification,
        )
        await this.notifyCharacteristic.startNotifications()
      } catch {
        throw new LuckJinglePrinterError('incompatible-protocol', 'Printer protocol mismatch')
      }

      try {
        this.creditCharacteristic = await this.service.getCharacteristic(
          LUCK_JINGLE_BLE_UUIDS.creditNotify,
        )
        this.creditCharacteristic.addEventListener(
          'characteristicvaluechanged',
          this.handleCreditNotification,
        )
        await this.creditCharacteristic.startNotifications()
        this.creditNotifyConnected = true
        this.creditWaitTimedOut = false
        this.emitTransportDiagnostics()
      } catch {
        throw new LuckJinglePrinterError(
          'credit-unavailable',
          'PPS1 credit characteristic is unavailable',
        )
      }

      let diagnostics = this.getDiagnosticsInfo()
      let status = null
      let batteryPercent = null

      try {
        diagnostics = await this.queryPrinterDiagnostics()
      } catch {
        diagnostics = this.getDiagnosticsInfo()
      }

      try {
        status = await this.queryStatus()
      } catch {
        status = null
      }

      try {
        batteryPercent = await this.queryBattery()
      } catch {
        batteryPercent = null
      }

      return {
        deviceId: device.id ?? '',
        deviceName: device.name ?? '',
        batteryPercent,
        firmwareVersion: diagnostics.firmwareVersion ?? this.firmwareVersion,
        model: diagnostics.model ?? this.model,
        status,
        transportDiagnostics: this.getTransportDiagnostics(),
      }
    } catch (error) {
      this.detachNotifications()
      this.detachDeviceListener()

      if (this.device?.gatt?.connected) {
        this.device.gatt.disconnect()
      }

      this.clearConnectionRefs({ keepDevice: true })

      if (error instanceof LuckJinglePrinterError) {
        throw error
      }

      throw new LuckJinglePrinterError('connection-lost', 'Printer connection failed')
    }
  }

  async disconnect(options = {}) {
    const { forgetDevice = true } = options

    this.detachNotifications()
    this.resetCreditState()

    if (forgetDevice) {
      this.detachDeviceListener()
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }

    this.clearConnectionRefs({ keepDevice: !forgetDevice })

    if (forgetDevice) {
      this.device = null
    }
  }

  async queryModel() {
    const model = await this.queryAsciiInfo(MODEL_QUERY_COMMAND)

    if (model) {
      this.model = model
      this.onModel?.(model)
      this.emitDiagnostics()
    }

    return model
  }

  async queryFirmwareVersion() {
    const firmwareVersion = await this.queryAsciiInfo(FIRMWARE_QUERY_COMMAND)

    if (firmwareVersion) {
      this.firmwareVersion = firmwareVersion
      this.emitDiagnostics()
    }

    return firmwareVersion
  }

  async querySerialNumber() {
    const serialNumber = await this.queryAsciiInfo(SERIAL_NUMBER_QUERY_COMMAND)

    if (serialNumber) {
      this.serialNumber = serialNumber
      this.emitDiagnostics()
    }

    return serialNumber
  }

  async queryBootInfo() {
    const bootInfo = await this.queryAsciiInfo(BOOT_INFO_QUERY_COMMAND)

    if (bootInfo) {
      this.bootInfo = bootInfo
      this.emitDiagnostics()
    }

    return bootInfo
  }

  async queryPrinterInfo() {
    const printerInfo = await this.queryAsciiInfo(PRINTER_INFO_QUERY_COMMAND)

    if (printerInfo) {
      this.printerInfo = printerInfo
      this.emitDiagnostics()
    }

    return printerInfo
  }

  async queryPrinterDiagnostics() {
    const queries = [
      () => this.queryModel(),
      () => this.queryFirmwareVersion(),
      () => this.querySerialNumber(),
      () => this.queryBootInfo(),
      () => this.queryPrinterInfo(),
    ]

    for (const query of queries) {
      try {
        await query()
      } catch {
        // Diagnostic commands are read-only and optional across LuckPrinter models.
      }
    }

    this.emitDiagnostics()

    return this.getDiagnosticsInfo()
  }

  async queryStatus() {
    if (!this.writeCharacteristic) {
      return null
    }

    const status = await this.writeCommandAndWait(
      STATUS_QUERY_COMMAND,
      (bytes) => parseStatusResponse(bytes),
      1000,
    )

    if (status) {
      this.status = status
      this.onStatus?.(status)
    }

    return status
  }

  async queryBattery() {
    if (!this.writeCharacteristic) {
      return null
    }

    const battery = await this.writeCommandAndWait(
      BATTERY_QUERY_COMMAND,
      (bytes) => parseBatteryResponse(bytes),
      1000,
    )

    if (battery && Number.isFinite(battery.percent)) {
      this.batteryPercent = battery.percent
      this.onBattery?.(battery.percent)

      return battery.percent
    }

    return null
  }

  async printImageBlob(finalImageBlob, settings, options = {}) {
    await this.printLongImageBlobWithVerifiedTransport(finalImageBlob, settings, options)
  }

  async printAdminExperimentalImageBlob(finalImageBlob, settings, options = {}) {
    if (!options.allowAdminLongPrintExperiment) {
      throw new LuckJinglePrinterError('long-print-locked', 'Long direct print is locked')
    }

    await this.printLongImageBlobWithVerifiedTransport(finalImageBlob, settings, options)
  }

  async printLongImageBlobWithVerifiedTransport(finalImageBlob, settings, options = {}) {
    const profile = createSafePhotoPrinterProfile(settings)
    const { onProgress } = options
    const rasterWriteMode = TEST_RASTER_WRITE_MODES.withResponse20Pacing

    await this.ensureConnected(options)

    this.resetPrintTrace()
    this.setCurrentTestRasterWriteMode(rasterWriteMode)
    this.recordPrintTracePhase('query-battery:start')
    const batteryPercent = await this.queryBattery()
    this.recordPrintTracePhase('query-battery:done', { completed: true })

    if (
      Number.isFinite(batteryPercent) &&
      batteryPercent < profile.minLongPrintBatteryPercent
    ) {
      throw new LuckJinglePrinterError('battery-too-low', 'Printer battery is too low')
    }

    this.recordPrintTracePhase('query-status:start')
    const status = await this.queryStatus()
    this.recordPrintTracePhase('query-status:done', { completed: true })
    const blockingIssue = getBlockingStatusIssue(status)

    if (blockingIssue) {
      throw new LuckJinglePrinterError(blockingIssue.code, blockingIssue.message)
    }

    const rasterCommand = await createRasterCommandFromBlob(finalImageBlob, profile)
    const totalPackets = Math.ceil(
      rasterCommand.byteLength / this.getRasterEffectivePacketSize(rasterWriteMode),
    )

    this.beginLongPrintDiagnostics(profile, rasterCommand.byteLength, rasterWriteMode)
    onProgress?.({
      completedBytes: 0,
      completedPackets: 0,
      percent: 0,
      totalBytes: rasterCommand.byteLength,
      totalPackets,
    })
    await this.sendPrintJob(rasterCommand, profile, {
      markLastPage: true,
      onRasterProgress: onProgress,
      rasterWriteMode,
      trace: true,
    })
    onProgress?.({
      completedBytes: rasterCommand.byteLength,
      completedPackets: totalPackets,
      percent: 100,
      totalBytes: rasterCommand.byteLength,
      totalPackets,
    })
  }

  async printTestPage(settings, options = {}) {
    const normalizedSettings = normalizePrinterSettings(settings)
    const profile = createPrinterProfile(settings)
    const testRasterWriteMode = normalizedSettings.testRasterWriteMode

    await this.ensureConnected(options)

    this.resetPrintTrace()
    this.setCurrentTestRasterWriteMode(testRasterWriteMode)
    const testJob = this.beginTestJobDiagnostics(profile, testRasterWriteMode)
    this.recordPrintTracePhase('query-status:start')
    const status = await this.queryStatus()
    this.recordPrintTracePhase('query-status:done', { completed: true })
    const blockingIssue = getBlockingStatusIssue(status)

    if (blockingIssue) {
      throw new LuckJinglePrinterError(blockingIssue.code, blockingIssue.message)
    }

    await this.sendPrintJob(createTestRasterCommand(profile, testJob), profile, {
      markLastPage: true,
      rasterWriteMode: testRasterWriteMode,
      trace: true,
    })
  }

  async ensureConnected(options = {}) {
    const { allowReconnect = true, savedDevice = {} } = options

    if (this.isConnected()) {
      return this.getConnectionInfo()
    }

    if (!allowReconnect) {
      throw new LuckJinglePrinterError('connection-lost', 'Printer is disconnected')
    }

    let device = this.device

    if (!device && hasSavedDeviceReference(savedDevice)) {
      device = await this.findAuthorizedDevice(savedDevice)
    }

    if (!device?.gatt) {
      throw new LuckJinglePrinterError('device-missing', 'Authorized printer is missing')
    }

    try {
      return await this.connectDevice(device)
    } catch (error) {
      if (error instanceof LuckJinglePrinterError) {
        throw error
      }

      throw new LuckJinglePrinterError('connection-lost', 'Printer reconnection failed')
    }
  }

  async sendPrintJob(rasterCommand, profile, options = {}) {
    const {
      markLastPage = false,
      onRasterProgress,
      rasterWriteMode = TEST_RASTER_WRITE_MODES.withoutResponse,
      trace = false,
    } = options

    try {
      await this.writePrintTraceStep('enable', ENABLE_PRINTER_COMMAND, { trace })
      await this.writePrintTraceStep('wakeup', WAKE_PRINTER_COMMAND, { trace })
      await this.writePrintTraceStep('density', createDensityCommand(profile.density), { trace })

      if (profile.setPrintWidthCommand) {
        await this.writeCommand(createPrintWidthCommand(profile.printWidth))
      }

      if (trace) {
        this.setRasterTraceTotals(
          rasterCommand.byteLength,
          this.getRasterEffectivePacketSize(rasterWriteMode),
        )
      }

      await this.writePrintTraceStep('raster', rasterCommand, {
        isRaster: trace,
        onRasterProgress,
        rasterWriteMode,
        trace,
      })
      await this.writePrintTraceStep('feed', createFeedCommand(profile.feedDots), { trace })

      if (markLastPage) {
        await this.writePrintTraceStep('mark-last', SET_MARK_PRINT_LAST_COMMAND, { trace })
      }

      await this.stopPrintJob({ trace })

      if (trace) {
        this.recordPrintTracePhase('print:done', { completed: true })
      }
    } catch (error) {
      if (
        error instanceof LuckJinglePrinterError &&
        (error.code === 'not-connected' || error.code === 'connection-lost')
      ) {
        throw new LuckJinglePrinterError('print-disconnected', 'Printer disconnected while printing')
      }

      if (error instanceof LuckJinglePrinterError) {
        throw error
      }

      if (!this.device?.gatt?.connected || !this.writeCharacteristic) {
        throw new LuckJinglePrinterError('print-disconnected', 'Printer disconnected while printing')
      }

      throw new LuckJinglePrinterError('transfer-failed', 'Bluetooth transfer failed')
    }
  }

  async writePrintTraceStep(phase, command, options = {}) {
    const {
      isRaster = false,
      onRasterProgress,
      rasterWriteMode = TEST_RASTER_WRITE_MODES.withoutResponse,
      trace = false,
    } = options

    if (trace) {
      this.recordPrintTracePhase(`${phase}:start`)
    }

    if (isRaster) {
      this.recordRasterWriteStart(rasterWriteMode)
    }

    await this.writeCommand(command, {
      isRaster,
      onRasterProgress,
      phaseLabel: trace ? `${phase}:start` : '',
      writeMode: isRaster ? rasterWriteMode : TEST_RASTER_WRITE_MODES.withoutResponse,
    })

    if (trace) {
      this.recordPrintTracePhase(`${phase}:done`, { completed: true })
    }
  }

  async sendBandedPrintJob(rasterBands, profile, options = {}) {
    const { onProgress } = options
    const totalBands = rasterBands.length

    if (totalBands === 0) {
      throw new LuckJinglePrinterError('image-invalid', 'Printable image has no raster bands')
    }

    try {
      onProgress?.({ completedBands: 0, percent: 0, totalBands })

      await this.writeCommand(ENABLE_PRINTER_COMMAND)
      await this.writeCommand(WAKE_PRINTER_COMMAND)
      await this.writeCommand(createDensityCommand(profile.density))

      if (profile.setPrintWidthCommand) {
        await this.writeCommand(createPrintWidthCommand(profile.printWidth))
      }

      for (let bandIndex = 0; bandIndex < totalBands; bandIndex += 1) {
        const band = rasterBands[bandIndex]

        await this.writeInChunks(band.command, profile)

        const completedBands = bandIndex + 1
        onProgress?.({
          completedBands,
          percent: Math.round((completedBands / totalBands) * 100),
          totalBands,
        })

        if (completedBands >= totalBands) {
          continue
        }

        if (completedBands % profile.statusCheckEveryBands === 0) {
          const status = await this.queryStatus()
          const blockingIssue = getBlockingStatusIssue(status, { allowPrinting: true })

          if (blockingIssue) {
            await this.stopPrintJobSafely()
            throw new LuckJinglePrinterError(blockingIssue.code, blockingIssue.message)
          }
        }
      }

      await this.writeCommand(createFeedCommand(profile.feedDots))
      await this.stopPrintJobSafely()
    } catch (error) {
      if (
        error instanceof LuckJinglePrinterError &&
        (error.code === 'not-connected' || error.code === 'connection-lost')
      ) {
        throw new LuckJinglePrinterError('print-disconnected', 'Printer disconnected while printing')
      }

      if (error instanceof LuckJinglePrinterError) {
        throw error
      }

      if (!this.device?.gatt?.connected || !this.writeCharacteristic) {
        throw new LuckJinglePrinterError('print-disconnected', 'Printer disconnected while printing')
      }

      throw new LuckJinglePrinterError('transfer-failed', 'Bluetooth transfer failed')
    }
  }

  async stopPrintJob(options = {}) {
    const { trace = false } = options
    const sessionId = this.transportSessionId

    this.assertActiveTransportSession(sessionId)
    this.beginStopAckWait()

    const stopAckWaiter = this.createNotificationWaiter(
      (bytes) => parseStopPrintAck(bytes),
      STOP_PRINT_ACK_TIMEOUT_MS,
      {
        onAbort: () => {
          if (this.stopAckDiagnostics.status === 'waiting') {
            this.finishStopAckWait('disconnect')
          }
        },
        onResolve: (ack) => {
          this.finishStopAckWait('success', { packetHex: ack.packetHex })
        },
        onTimeout: () => {
          this.finishStopAckWait('timeout')
        },
        rejectOnAbort: true,
        rejectOnTimeout: true,
        sessionId,
        timeoutCode: 'stop-ack-timeout',
        timeoutMessage: 'PPS1 stopPrintJobLuck ACK timed out',
      },
    )

    if (trace) {
      this.recordPrintTracePhase('stop-waiter:armed')
    }

    try {
      if (trace) {
        this.recordPrintTracePhase('stop-write:start')
      }

      await this.writeCommand(STOP_PRINT_JOB_COMMAND, {
        phaseLabel: trace ? 'stop-write:start' : '',
      })

      if (trace) {
        this.recordPrintTracePhase('stop-write:done', { completed: true })
      }

      const stopAck = await stopAckWaiter.promise

      if (trace) {
        this.recordPrintTracePhase('stop-ack:received', { completed: true })
      }

      return stopAck
    } catch (error) {
      stopAckWaiter.cancel()

      if (this.stopAckDiagnostics.status === 'waiting') {
        const didDisconnect =
          error instanceof LuckJinglePrinterError &&
          (error.code === 'connection-lost' || error.code === 'not-connected')

        this.finishStopAckWait(didDisconnect ? 'disconnect' : 'idle')
      }

      throw error
    }
  }

  async stopPrintJobSafely() {
    if (!this.writeCharacteristic) {
      return
    }

    try {
      await this.stopPrintJob()
    } catch {
      // Stop is best-effort after completion or a status fault.
    }
  }

  async writeInChunks(bytes, options = {}) {
    await this.writeCommand(bytes, options)
  }

  async writeCommand(bytes, options = {}) {
    await this.writeWithCredit(bytes, options)
  }

  async writeWithCredit(bytes, options = {}) {
    const {
      isRaster = false,
      onRasterProgress,
      phaseLabel = this.printTrace.currentPhase,
      writeMode = TEST_RASTER_WRITE_MODES.withoutResponse,
    } = options
    const activeWriteMode = isRaster
      ? normalizeTestRasterWriteMode(writeMode)
      : TEST_RASTER_WRITE_MODES.withoutResponse

    if (!this.writeCharacteristic) {
      throw new LuckJinglePrinterError('not-connected', 'Write characteristic is unavailable')
    }

    if (!this.creditNotifyConnected || !this.creditCharacteristic) {
      throw new LuckJinglePrinterError(
        'credit-unavailable',
        'PPS1 credit characteristic is unavailable',
      )
    }

    const sessionId = this.transportSessionId
    let offset = 0

    while (offset < bytes.byteLength) {
      this.assertActiveTransportSession(sessionId)
      let effectivePacketSize = isRaster
        ? this.getRasterEffectivePacketSize(activeWriteMode)
        : this.getActivePacketSize()
      const pendingPacket = bytes.subarray(offset, offset + effectivePacketSize)

      await this.waitForCredit(sessionId, phaseLabel, pendingPacket)
      this.assertActiveTransportSession(sessionId)
      effectivePacketSize = isRaster
        ? this.getRasterEffectivePacketSize(activeWriteMode)
        : this.getActivePacketSize()

      const remainingPackets = Math.ceil((bytes.byteLength - offset) / effectivePacketSize)
      const availableCredit = this.credit >= 3 ? this.credit - 1 : this.credit
      const packetsToSend = Math.min(remainingPackets, availableCredit)

      if (packetsToSend <= 0) {
        continue
      }

      let sentPackets = 0

      for (let packetIndex = 0; packetIndex < packetsToSend; packetIndex += 1) {
        this.assertActiveTransportSession(sessionId)
        const packet = createBleWritePacket(bytes, offset, effectivePacketSize)
        const apiName = getWriteApiNameForMode(this.writeCharacteristic, activeWriteMode)
        const rasterWriteEvent = isRaster
          ? this.recordRasterWriteAttempt({
              apiName,
              offset,
              packet,
              phaseLabel,
              sessionId,
              writeMode: activeWriteMode,
            })
          : null
        const writeStartedAt = performance.now()

        try {
          await this.writePacket(packet, { phaseLabel, writeMode: activeWriteMode })
        } catch (error) {
          if (isRaster) {
            this.recordRasterWriteRejected(
              rasterWriteEvent,
              error,
              Math.round(performance.now() - writeStartedAt),
              apiName,
            )
          }

          this.recordPacketSizeWriteError(error, packet, phaseLabel)

          if (
            this.activePacketSizeSource === PACKET_SIZE_SOURCE_FF03 &&
            packet.byteLength > PPS1_CREDIT_PACKET_SIZE
          ) {
            throw new LuckJinglePrinterError(
              'packet-size-write-failed',
              'requested packet size write failed',
            )
          }

          throw error
        }

        if (isRaster) {
          this.recordRasterWriteResolved(
            rasterWriteEvent,
            Math.round(performance.now() - writeStartedAt),
          )
        }

        sentPackets += 1
        offset += packet.byteLength
        this.recordWritePacketSuccess(packet)

        if (isRaster) {
          const completedBytes = Math.min(offset, bytes.byteLength)
          const completedPackets = Math.ceil(completedBytes / effectivePacketSize)
          const totalPackets = Math.ceil(bytes.byteLength / effectivePacketSize)

          this.recordRasterPacketSent(completedBytes, completedPackets)
          onRasterProgress?.({
            completedBytes,
            completedPackets,
            percent: Math.round((completedBytes / bytes.byteLength) * 100),
            totalBytes: bytes.byteLength,
            totalPackets,
          })
        }
      }

      this.credit = Math.max(0, this.credit - sentPackets)
      this.creditWaitTimedOut = false
      this.emitTransportDiagnostics()
    }
  }

  assertActiveTransportSession(sessionId) {
    if (
      sessionId !== this.transportSessionId ||
      !this.device?.gatt?.connected ||
      !this.writeCharacteristic
    ) {
      throw new LuckJinglePrinterError('connection-lost', 'Bluetooth transport session changed')
    }
  }

  async waitForCredit(sessionId, phaseLabel = '', pendingPacket = Uint8Array.of()) {
    this.assertActiveTransportSession(sessionId)

    if (this.credit > 0) {
      this.endCreditWaitTrace()
      return
    }

    if (this.creditWaitTimedOut) {
      throw new LuckJinglePrinterError('credit-timeout', 'PPS1 credit wait timed out')
    }

    this.beginCreditWaitTrace(phaseLabel, pendingPacket)

    await new Promise((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timeoutId: setTimeout(() => {
          this.creditWaiters.delete(waiter)
          this.creditWaitTimedOut = true
          this.endCreditWaitTrace()
          this.emitTransportDiagnostics()
          reject(new LuckJinglePrinterError('credit-timeout', 'PPS1 credit wait timed out'))
        }, PPS1_CREDIT_WAIT_TIMEOUT_MS),
      }

      this.creditWaiters.add(waiter)
    })

    this.endCreditWaitTrace()
    this.assertActiveTransportSession(sessionId)
  }

  async writePacket(packet, options = {}) {
    const {
      phaseLabel = '',
      writeMode = TEST_RASTER_WRITE_MODES.withoutResponse,
    } = options
    const properties = this.writeCharacteristic.properties

    if (
      writeMode === TEST_RASTER_WRITE_MODES.withResponse ||
      writeMode === TEST_RASTER_WRITE_MODES.withResponse20Pacing
    ) {
      const startedAt = performance.now()

      if (
        !properties?.write ||
        typeof this.writeCharacteristic.writeValueWithResponse !== 'function'
      ) {
        const error = new LuckJinglePrinterError(
          'with-response-write-failed',
          'writeValueWithResponse is unavailable',
        )

        this.recordWithResponseWriteError(error, phaseLabel)
        throw error
      }

      try {
        await this.writeCharacteristic.writeValueWithResponse(packet)
        this.recordWithResponseWriteSuccess(Math.round(performance.now() - startedAt))
        return
      } catch (error) {
        this.recordWithResponseWriteError(error, phaseLabel)
        throw error
      }
    }

    if (
      properties?.writeWithoutResponse &&
      typeof this.writeCharacteristic.writeValueWithoutResponse === 'function'
    ) {
      await this.writeCharacteristic.writeValueWithoutResponse(packet)
      return
    }

    if (typeof this.writeCharacteristic.writeValue === 'function') {
      await this.writeCharacteristic.writeValue(packet)
      return
    }

    if (typeof this.writeCharacteristic.writeValueWithResponse === 'function') {
      await this.writeCharacteristic.writeValueWithResponse(packet)
      return
    }

    throw new LuckJinglePrinterError('transfer-failed', 'No supported write method')
  }

  async queryAsciiInfo(command, timeoutMs = 1000) {
    if (!this.writeCharacteristic) {
      return ''
    }

    return (
      (await this.writeCommandAndWait(command, (bytes) => readAsciiModel(bytes), timeoutMs)) ?? ''
    )
  }

  async writeCommandAndWait(command, parser, timeoutMs) {
    const sessionId = this.transportSessionId

    await this.waitForCredit(
      sessionId,
      this.printTrace.currentPhase,
      command.subarray(0, PPS1_CREDIT_PACKET_SIZE),
    )
    const responseWaiter = this.createNotificationWaiter(parser, timeoutMs, { sessionId })

    try {
      await this.writeCommand(command, { phaseLabel: this.printTrace.currentPhase })

      return await responseWaiter.promise
    } catch (error) {
      responseWaiter.cancel()
      throw error
    }
  }

  waitForNotification(parser, timeoutMs) {
    return this.createNotificationWaiter(parser, timeoutMs).promise
  }

  createNotificationWaiter(parser, timeoutMs, options = {}) {
    const {
      onAbort,
      onResolve,
      onTimeout,
      rejectOnAbort = false,
      rejectOnTimeout = false,
      sessionId = this.transportSessionId,
      timeoutCode = 'notification-timeout',
      timeoutMessage = 'FF01 notification wait timed out',
    } = options
    let waiter = null
    const promise = new Promise((resolve, reject) => {
      waiter = {
        onAbort,
        onResolve,
        onTimeout,
        parser,
        reject,
        rejectOnAbort,
        resolve,
        sessionId,
        timeoutId: setTimeout(() => {
          this.notificationWaiters.delete(waiter)
          onTimeout?.()

          if (rejectOnTimeout) {
            reject(new LuckJinglePrinterError(timeoutCode, timeoutMessage))
            return
          }

          resolve(null)
        }, timeoutMs),
      }

      this.notificationWaiters.add(waiter)
    })

    return {
      cancel: () => {
        if (waiter && this.notificationWaiters.delete(waiter)) {
          clearTimeout(waiter.timeoutId)
        }
      },
      promise,
    }
  }

  resolveNotificationWaiter(waiter, result) {
    clearTimeout(waiter.timeoutId)
    this.notificationWaiters.delete(waiter)
    waiter.onResolve?.(result)
    waiter.resolve(result)
  }

  rejectNotificationWaiter(waiter, error) {
    clearTimeout(waiter.timeoutId)
    this.notificationWaiters.delete(waiter)
    waiter.onAbort?.(error)

    if (waiter.rejectOnAbort) {
      waiter.reject(error)
      return
    }

    waiter.resolve(null)
  }

  abortNotificationWaiters(error) {
    Array.from(this.notificationWaiters).forEach((waiter) => {
      this.rejectNotificationWaiter(waiter, error)
    })
  }

  handleNotification(event) {
    const bytes = dataViewToBytes(event.target.value)
    const rawHex = bytesToHex(bytes)
    const receivedAt = new Date().toISOString()
    let handledByWaiter = false

    this.lastNotificationHex = rawHex
    this.printTrace = {
      ...this.printTrace,
      lastNotificationAt: receivedAt,
    }
    this.recordNotificationTrace('FF01', rawHex, receivedAt)
    this.emitTransportDiagnostics()

    Array.from(this.notificationWaiters).forEach((waiter) => {
      if (waiter.sessionId !== this.transportSessionId) {
        this.rejectNotificationWaiter(
          waiter,
          new LuckJinglePrinterError('connection-lost', 'Bluetooth transport session changed'),
        )
        return
      }

      const result = waiter.parser(bytes)

      if (result) {
        this.resolveNotificationWaiter(waiter, result)
        handledByWaiter = true
      }
    })

    if (handledByWaiter) {
      return
    }

    const status = parseStatusResponse(bytes)

    if (status) {
      this.status = status
      this.onStatus?.(status)
    }
  }

  handleCreditNotification(event) {
    const bytes = dataViewToBytes(event.target.value)
    const rawHex = bytesToHex(bytes)
    const type = bytes[0]
    const receivedAt = new Date().toISOString()
    const creditEvent = {
      rawHex,
      addedCredit: null,
      totalCredit: this.credit,
      printerRequestedPacketSize: this.printerRequestedPacketSize,
    }

    this.lastCreditNotificationHex = rawHex
    this.creditWaitTimedOut = false
    this.printTrace = {
      ...this.printTrace,
      lastCreditNotificationAt: receivedAt,
    }

    if (type === 0x01 && bytes.length >= 2) {
      const addedCredit = bytes[1]

      this.credit += addedCredit
      creditEvent.addedCredit = addedCredit
      creditEvent.totalCredit = this.credit

      if (addedCredit > 0) {
        this.resolveCreditWaiters()
      }
    }

    if (type === 0x02 && bytes.length >= 3) {
      this.printerRequestedPacketSize = bytes[1] | (bytes[2] << 8)
      this.applyRequestedPacketSize(this.printerRequestedPacketSize)
      creditEvent.printerRequestedPacketSize = this.printerRequestedPacketSize
      creditEvent.activePacketSize = this.getActivePacketSize()
      creditEvent.activePacketSizeSource = this.activePacketSizeSource
    }

    this.recordNotificationTrace('FF03', rawHex, receivedAt)
    this.recordCreditNotification(creditEvent)
  }

  handleGattDisconnected() {
    const disconnectedAt = new Date().toISOString()

    this.recordPrintTraceDisconnect(disconnectedAt)
    this.detachNotifications()
    this.captureLastSessionDiagnostics({ disconnectedAt, disconnectEventOccurred: true })
    this.resetCreditState()
    this.clearConnectionRefs({ keepDevice: true })
    this.onDisconnect?.()
  }

  detachNotifications() {
    if (this.notifyCharacteristic) {
      this.notifyCharacteristic.removeEventListener('characteristicvaluechanged', this.handleNotification)
    }

    if (this.creditCharacteristic) {
      this.creditCharacteristic.removeEventListener(
        'characteristicvaluechanged',
        this.handleCreditNotification,
      )
    }

    this.abortNotificationWaiters(
      new LuckJinglePrinterError('connection-lost', 'Bluetooth transport session changed'),
    )
    this.creditNotifyConnected = false
    this.emitTransportDiagnostics()
  }

  detachDeviceListener() {
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleGattDisconnected)
    }
  }

  clearConnectionRefs(options = {}) {
    const { keepDevice = true } = options

    this.server = null
    this.service = null
    this.writeCharacteristic = null
    this.notifyCharacteristic = null
    this.creditCharacteristic = null
    this.writeCharacteristicUuid = ''
    this.writeCharacteristicCapabilities = createEmptyWriteCharacteristicCapabilities()
    this.writeWithoutResponseAvailable = false

    if (!keepDevice) {
      this.device = null
    }
  }
}

export function createLuckJingleBlePrinter(options) {
  return new LuckJingleBlePrinter(options)
}
