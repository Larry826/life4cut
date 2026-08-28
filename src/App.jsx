import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import oazLogo from './assets/oaz_logo.png'
import './App.css'
import FinalResultScreen from './components/FinalResultScreen'
import FrameCustomizer from './components/FrameCustomizer'
import PrinterSetupPanel from './components/PrinterSetupPanel'
import {
  DEFAULT_FRAME_COLOR,
  DEFAULT_SHOW_FRAME_DATE,
  formatLocalFrameDate,
} from './constants/frameOptions'
import { captureFrameFromVideo } from './utils/captureFrame'
import { createShareImageBlob } from './utils/createShareImageBlob'
import {
  createLuckJingleBlePrinter,
  DENSITY_OPTIONS,
  getPrinterErrorMessage,
  isWebBluetoothSupported,
  loadStoredPrinterSettings,
  MIN_LONG_PRINT_BATTERY_PERCENT,
  normalizePrinterSettings,
  PPS1_CREDIT_PACKET_SIZE,
  PRINTER_NAME_PREFIX,
  saveStoredPrinterSettings,
  SAFE_PHOTO_DENSITY,
  TEST_RASTER_WRITE_MODES,
} from './utils/luckJingleBlePrinter'
import { renderFinalStrip } from './utils/renderFinalStrip'

const TOTAL_SHOTS = 6
const SHOT_INTERVAL_MS = 5000
const COUNTDOWN_SECONDS = 3
const COUNTDOWN_TICK_MS = 1000
const COUNTDOWN_DURATION_MS = COUNTDOWN_SECONDS * COUNTDOWN_TICK_MS
const PREPARATION_DELAY_MS = Math.max(SHOT_INTERVAL_MS - COUNTDOWN_DURATION_MS, 0)
const FLASH_DURATION_MS = 200
const REQUIRED_SELECTION_COUNT = 4
const FRAME_SELECTION_ERROR_MESSAGE =
  '선택한 사진 정보를 확인하지 못했어요.\n사진을 다시 선택해 주세요.'
const FINAL_IMAGE_ERROR_MESSAGE =
  '완성 이미지를 만들지 못했어요.\n사진과 프레임 설정을 확인한 뒤 다시 시도해 주세요.'
const CAPTURE_ERROR_MESSAGE =
  '사진을 촬영하지 못했어요.\n카메라 화면을 확인한 뒤 다시 시도해 주세요.'
const QR_SHARE_ERROR_MESSAGE =
  'QR을 준비하지 못했어요.\n인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
const DIRECT_PRINT_COMPLETE_MESSAGE = '인쇄 데이터 전송 완료'
const DIRECT_PRINT_NOT_CONFIGURED_MESSAGE = '프린터가 준비되지 않았어요. 관리자에게 알려 주세요.'
const DIRECT_PRINT_RECONNECT_MESSAGE =
  '프린터 연결이 끊겼어요.\n프린터 다시 연결을 눌러 주세요.'
const DIRECT_PRINT_RECONNECTED_MESSAGE = '프린터가 다시 연결됐어요. 인쇄할 수 있어요.'
const PPS1_PRINTER_NOT_FOUND_MESSAGE =
  'PPS1 프린터를 찾지 못했어요.\nLuck Jingle을 완전히 종료하고\n프린터 전원을 껐다 켠 뒤 다시 시도해 주세요.'

const SHARE_IMAGE_ID_HEADER = 'X-Life4Cut-Image-Id'
const SHARE_IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const QR_CODE_OPTIONS = {
  errorCorrectionLevel: 'M',
  width: 320,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
}

const guideItems = [
  {
    title: '여섯 장 연속 촬영',
    description: '준비가 끝나면 카운트다운 후 사진을 여섯 번 촬영해요.',
  },
  {
    title: '카메라 권한',
    description: '촬영을 위해 브라우저의 카메라 사용 권한이 필요해요.',
  },
  {
    title: '브라우저 안에서 처리',
    description: '촬영한 이미지는 외부 서버로 전송하지 않아요.',
  },
]

const stripDecorations = ['heart', 'star', 'smile', 'sparkle']

function getCameraSupportMessage() {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return '카메라는 HTTPS 또는 localhost 환경에서 사용할 수 있어요.'
  }

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    return '이 브라우저에서는 카메라 기능을 사용할 수 없어요.'
  }

  return ''
}

function getCameraErrorMessage(error) {
  const errorName = error?.name

  if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
    return '카메라 권한이 차단되었어요.\n브라우저 주소창의 카메라 권한을 허용한 뒤 다시 시도해 주세요.'
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return '사용할 수 있는 카메라를 찾지 못했어요.'
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return '다른 프로그램에서 카메라를 사용 중일 수 있어요.\n다른 프로그램을 닫고 다시 시도해 주세요.'
  }

  if (
    errorName === 'OverconstrainedError' ||
    errorName === 'ConstraintNotSatisfiedError'
  ) {
    return '현재 카메라 설정을 사용할 수 없어요.\n다른 카메라로 다시 시도해 주세요.'
  }

  return '카메라를 연결하지 못했어요.\n잠시 후 다시 시도해 주세요.'
}

function normalizeSharePageUrl(pageUrl) {
  if (typeof pageUrl !== 'string' || pageUrl.trim().length === 0) {
    throw new Error('Share page URL is missing')
  }

  const normalizedUrl = new URL(pageUrl, window.location.origin)
  const isLocalhost =
    normalizedUrl.hostname === 'localhost' || normalizedUrl.hostname === '127.0.0.1'

  if (
    normalizedUrl.protocol === 'blob:' ||
    (normalizedUrl.protocol !== 'https:' &&
      !(normalizedUrl.protocol === 'http:' && isLocalhost))
  ) {
    throw new Error('Invalid share page URL')
  }

  return normalizedUrl.href
}

function createFallbackShareImageId() {
  if (
    typeof crypto === 'undefined' ||
    typeof crypto.getRandomValues !== 'function'
  ) {
    throw new Error('Crypto API is unavailable')
  }

  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`
}

function createShareImageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return createFallbackShareImageId()
}

function createSharePageUrl(imageId) {
  if (!SHARE_IMAGE_ID_PATTERN.test(imageId)) {
    throw new Error('Share image id is invalid')
  }

  return normalizeSharePageUrl(`/download/${imageId}`)
}

function createQrCodeDataUrl(pageUrl) {
  return QRCode.toDataURL(pageUrl, QR_CODE_OPTIONS)
}

async function uploadFinalImageForShare(finalImageBlob, finalImageUrl, options = {}) {
  const shareImageBlob = await createShareImageBlob(finalImageBlob, finalImageUrl)
  const headers = {
    'Content-Type': shareImageBlob.type || 'image/png',
  }

  if (options.imageId) {
    headers[SHARE_IMAGE_ID_HEADER] = options.imageId
  }

  const response = await fetch('/api/final-images', {
    method: 'POST',
    headers,
    body: shareImageBlob,
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  if (typeof payload?.id !== 'string' || payload.id.length === 0) {
    throw new Error('Share image id is missing')
  }

  return {
    ...payload,
    pageUrl: normalizeSharePageUrl(payload?.pageUrl),
  }
}

function shouldShowPrinterSetup() {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('printerSetup') === '1'
}

function getStoredPrinterDeviceLabel() {
  const storedSettings = loadStoredPrinterSettings()

  if (storedSettings.deviceName) {
    return storedSettings.deviceName
  }

  return storedSettings.deviceId ? '이름을 제공하지 않는 BLE 장치' : ''
}

function getPrinterHealthStatusLabel(status) {
  if (!status) {
    return '확인 불가'
  }

  if (status.isPrinting) {
    return '인쇄 중'
  }

  const firstIssueCode = status.issues?.[0]?.code

  if (firstIssueCode === 'paper-empty') {
    return '용지 없음'
  }

  if (firstIssueCode === 'cover-open') {
    return '덮개 열림'
  }

  if (firstIssueCode === 'low-battery') {
    return '배터리 부족'
  }

  if (firstIssueCode === 'overheating') {
    return '과열'
  }

  return '준비됨'
}

function getPrinterDensityLabel(density) {
  return DENSITY_OPTIONS.find((densityOption) => densityOption.value === density)?.label ?? '연하게'
}

function createDefaultPrinterPrintTrace() {
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

function createDefaultRasterWriteDiagnostics() {
  return {
    currentJobId: '',
    currentTestRasterWriteMode: TEST_RASTER_WRITE_MODES.withoutResponse,
    duplicateTestPrintBlockedCount: 0,
    imageHeight: 128,
    lastJobId: '',
    lastRasterWriteMode: '',
    markerMetadata: [],
    notificationEvents: [],
    originalWriteError: {
      apiName: '',
      byteEnd: null,
      byteStart: null,
      message: '',
      name: '',
      occurred: false,
      packetSeq: null,
      writeMode: '',
    },
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
    withResponseWriteError: {
      message: '',
      name: '',
      occurred: false,
      phase: '',
    },
  }
}

function createDefaultPrinterTransportDiagnostics() {
  return {
    activePacketSize: PPS1_CREDIT_PACKET_SIZE,
    activePacketSizeSource: 'default 20',
    creditNotifyConnected: false,
    currentCredit: 0,
    packetSize: PPS1_CREDIT_PACKET_SIZE,
    printerRequestedPacketSize: null,
    lastCreditNotificationHex: '',
    lastNotificationHex: '',
    creditWaitTimedOut: false,
    creditLog: [],
    lastSession: {
      currentCredit: null,
      disconnectEventOccurred: false,
      disconnectedAt: '',
      lastCreditNotificationHex: '',
      lastWebBluetoothWritePacket: {
        bufferByteLength: 0,
        byteLength: 0,
        byteOffset: 0,
      },
      lastWebBluetoothWriteSize: 0,
      lastNotificationHex: '',
      packetSizeWriteError: {
        attemptedSize: null,
        message: '',
        name: '',
        occurred: false,
        phase: '',
      },
      printTrace: createDefaultPrinterPrintTrace(),
      printerRequestedPacketSize: null,
      rasterWriteDiagnostics: createDefaultRasterWriteDiagnostics(),
      activePacketSize: PPS1_CREDIT_PACKET_SIZE,
      activePacketSizeSource: 'default 20',
      stopAck: {
        durationMs: null,
        packetHex: '',
        status: 'idle',
      },
      writeCharacteristicCapabilities: {
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
      },
    },
    stopAck: {
      durationMs: null,
      packetHex: '',
      status: 'idle',
    },
    lastWebBluetoothWritePacket: {
      bufferByteLength: 0,
      byteLength: 0,
      byteOffset: 0,
    },
    lastWebBluetoothWriteSize: 0,
    packetSizeWriteError: {
      attemptedSize: null,
      message: '',
      name: '',
      occurred: false,
      phase: '',
    },
    printTrace: createDefaultPrinterPrintTrace(),
    rasterWriteDiagnostics: createDefaultRasterWriteDiagnostics(),
    writeCharacteristicUuid: '',
    writeCharacteristicCapabilities: {
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
    },
    writeWithoutResponseAvailable: false,
  }
}

function BrandHeader({ logoSize = 'compact' }) {
  return (
    <div className={`brand-header brand-header--${logoSize}`}>
      <span className={`brand-logo-wrap brand-logo-wrap--${logoSize}`}>
        <img className="brand-logo" src={oazLogo} alt="OAZ 학회 로고" />
      </span>
      <span className="brand-name">OAZ_인생네컷</span>
    </div>
  )
}

function PhotoStrip() {
  return (
    <div className="photo-strip" aria-hidden="true">
      {stripDecorations.map((decoration) => (
        <div className={`strip-frame strip-frame-${decoration}`} key={decoration}>
          <span className={`shape shape-${decoration}`} />
        </div>
      ))}
    </div>
  )
}

function StartScreen({ printerSetupPanel, onStart }) {
  return (
    <main className="screen start-screen">
      <section className="start-copy" aria-labelledby="start-title">
        <div className="hero-brand-panel">
          <BrandHeader logoSize="large" />
          <h1 id="start-title">
            우리만의 순간을
            <br />
            네 컷으로 남겨요
          </h1>
          <p className="screen-description">
            카메라로 사진 네 장을 찍고
            <br />
            나만의 네컷 이미지를 만들어 보세요.
          </p>
        </div>
        <div className="start-actions">
          <button className="button button-primary" type="button" onClick={onStart}>
            촬영 시작하기
          </button>
          <p className="helper-text">
            사진은 서버에 업로드되지 않고
            <br />
            현재 브라우저 안에서만 처리돼요.
          </p>
        </div>
      </section>

      <div className="start-visual">
        <PhotoStrip />
      </div>

      {printerSetupPanel && <div className="start-printer-setup">{printerSetupPanel}</div>}
    </main>
  )
}

function CameraErrorMessage({ errorMessage, isConnecting, onRetry }) {
  if (!errorMessage) {
    return null
  }

  return (
    <div className="camera-alert" role="alert" aria-live="assertive">
      <p>{errorMessage}</p>
      <button
        className="button button-secondary alert-retry-button"
        disabled={isConnecting}
        type="button"
        onClick={onRetry}
      >
        {isConnecting ? '카메라 연결 중...' : '다시 시도하기'}
      </button>
    </div>
  )
}

function GuideScreen({ cameraError, isConnecting, onBack, onOpenCamera }) {
  return (
    <main className="screen guide-screen">
      <section className="guide-content" aria-labelledby="guide-title">
        <div className="guide-heading">
          <BrandHeader />
          <h1 id="guide-title">촬영 전 확인해 주세요</h1>
          <p className="screen-description">사진 여섯 장을 연속으로 촬영할 예정이에요.</p>
        </div>

        <div className="guide-list">
          {guideItems.map((item, index) => (
            <article className="guide-card" key={item.title}>
              <span className="guide-card-number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>

        <CameraErrorMessage
          errorMessage={cameraError}
          isConnecting={isConnecting}
          onRetry={onOpenCamera}
        />

        <div className="guide-actions">
          <button className="button button-secondary" type="button" onClick={onBack}>
            돌아가기
          </button>
          <button
            className="button button-primary"
            disabled={isConnecting}
            type="button"
            onClick={onOpenCamera}
          >
            {isConnecting ? '카메라 연결 중...' : '카메라 켜기'}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {isConnecting ? '카메라 연결 중입니다.' : ''}
        </p>
      </section>
    </main>
  )
}

function CameraPreview({
  countdown,
  currentShotIndex,
  captureStatus,
  facingMode,
  isFlashVisible,
  isSequenceRunning,
  isSwitchingCamera,
  isVideoReady,
  onVideoReadyChange,
  nextShotRemaining,
  stream,
  videoRef,
}) {
  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) {
      return undefined
    }

    onVideoReadyChange(false)
    videoElement.srcObject = stream

    if (stream) {
      const playPromise = videoElement.play()

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    }

    return () => {
      videoElement.srcObject = null
    }
  }, [onVideoReadyChange, stream, videoRef])

  const handleVideoReady = () => {
    const videoElement = videoRef.current
    onVideoReadyChange(
      Boolean(videoElement?.videoWidth > 0 && videoElement?.videoHeight > 0),
    )

    const playPromise = videoElement?.play()

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {})
    }
  }

  return (
    <div className="camera-preview">
      <video
        autoPlay
        className={`camera-video ${
          facingMode === 'user' ? 'camera-video-mirrored' : ''
        }`}
        muted
        playsInline
        ref={videoRef}
        onCanPlay={handleVideoReady}
        onLoadedMetadata={handleVideoReady}
      />
      {(!isVideoReady || isSwitchingCamera) && (
        <div className="camera-preview-overlay" aria-live="polite">
          {isSwitchingCamera ? '카메라 전환 중...' : '카메라 화면을 준비하고 있어요.'}
        </div>
      )}
      {isSequenceRunning && countdown && (
        <div className="countdown-overlay" aria-live="assertive">
          <span className="countdown-number">{countdown}</span>
          <span className="countdown-label">
            {currentShotIndex + 1}번째 사진 준비
          </span>
        </div>
      )}
      {isSequenceRunning && !countdown && captureStatus && (
        <div className="capture-status-overlay" aria-live="polite">
          <span>{captureStatus}</span>
          {nextShotRemaining && (
            <span className="next-shot-remaining">
              다음 촬영까지 {nextShotRemaining}초
            </span>
          )}
        </div>
      )}
      {isFlashVisible && <div className="capture-flash" aria-hidden="true" />}
    </div>
  )
}

function CaptureProgress({ capturedPhotos, currentShotIndex, isSequenceRunning }) {
  return (
    <div className="capture-progress" aria-label="촬영 진행 상황">
      <p className="capture-progress-text">
        촬영 진행 상황:{' '}
        <strong>
          {Math.min(capturedPhotos.length + 1, TOTAL_SHOTS)} / {TOTAL_SHOTS}
        </strong>
      </p>
      <div className="capture-slots">
        {Array.from({ length: TOTAL_SHOTS }, (_, index) => {
          const photo = capturedPhotos[index]
          const isCurrent = isSequenceRunning && index === currentShotIndex
          const slotLabel = photo
            ? `${index + 1}번째 사진 촬영 완료`
            : isCurrent
              ? `${index + 1}번째 사진 촬영 중`
              : `${index + 1}번째 사진 대기`

          return (
            <span
              className={`capture-slot ${photo ? 'capture-slot-complete' : ''} ${
                isCurrent ? 'capture-slot-current' : ''
              }`}
              key={index}
              title={slotLabel}
            >
              <span aria-hidden="true">{photo ? '✓' : index + 1}</span>
              <span className="sr-only">{slotLabel}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function CameraScreen({
  canSwitchCamera,
  capturedPhotos,
  captureError,
  captureStatus,
  countdown,
  cameraNotice,
  currentShotIndex,
  facingMode,
  isCapturingFrame,
  isFlashVisible,
  isSequenceRunning,
  isSwitchingCamera,
  isVideoReady,
  nextShotRemaining,
  onBack,
  onCancelCapture,
  onStartCapture,
  onSwitchCamera,
  onVideoReadyChange,
  stream,
  videoRef,
}) {
  const isStartDisabled =
    !isVideoReady || isSequenceRunning || isCapturingFrame || !stream

  return (
    <main className="screen camera-screen">
      <section className="camera-content" aria-labelledby="camera-title">
        <div className="camera-heading">
          <BrandHeader />
          <h1 id="camera-title">촬영 준비</h1>
          <p className="screen-description">
            화면을 확인하고 촬영할 준비를 해주세요.
          </p>
        </div>

        <CameraPreview
          captureStatus={captureStatus}
          countdown={countdown}
          currentShotIndex={currentShotIndex}
          facingMode={facingMode}
          isFlashVisible={isFlashVisible}
          isSequenceRunning={isSequenceRunning}
          isSwitchingCamera={isSwitchingCamera}
          isVideoReady={isVideoReady}
          nextShotRemaining={nextShotRemaining}
          videoRef={videoRef}
          onVideoReadyChange={onVideoReadyChange}
          stream={stream}
        />

        <CaptureProgress
          capturedPhotos={capturedPhotos}
          currentShotIndex={currentShotIndex}
          isSequenceRunning={isSequenceRunning}
        />

        <div className="camera-stage" aria-live="polite">
          <span className="stage-dot" aria-hidden="true" />
          <span>{captureStatus || cameraNotice || '카메라 연결 완료'}</span>
        </div>

        {captureError && (
          <div className="camera-alert" role="alert" aria-live="assertive">
            <p>{captureError}</p>
          </div>
        )}

        {canSwitchCamera && (
          <button
            className="button button-secondary camera-switch-button"
            disabled={isSwitchingCamera || isSequenceRunning}
            type="button"
            onClick={onSwitchCamera}
          >
            {isSwitchingCamera ? '카메라 전환 중...' : '카메라 전환'}
          </button>
        )}

        <div className="camera-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={isSequenceRunning ? onCancelCapture : onBack}
          >
            {isSequenceRunning ? '촬영 취소' : '돌아가기'}
          </button>
          <button
            className="button button-primary"
            disabled={isStartDisabled}
            type="button"
            onClick={onStartCapture}
          >
            {!isVideoReady ? '카메라 준비 중...' : '6장 촬영 시작'}
          </button>
        </div>
        <p className="helper-text camera-helper">
          {isSequenceRunning
            ? '카운트다운이 끝나면 자동으로 사진이 촬영돼요.'
            : '총 여섯 장을 연속으로 촬영할 예정이에요.'}
        </p>
      </section>
    </main>
  )
}

function ReviewScreen({
  capturedPhotos,
  isReconnectingCamera,
  onCompleteSelection,
  onRetake,
  onTogglePhoto,
  selectedPhotoIds,
  selectionNotice,
}) {
  const selectedCount = selectedPhotoIds.length

  return (
    <main className="screen review-screen">
      <section className="review-content" aria-labelledby="review-title">
        <div className="review-heading">
          <BrandHeader />
          <h1 id="review-title">6장 중 4장을 골라 주세요</h1>
          <p className="screen-description">선택한 순서대로 최종 네컷에 배치돼요.</p>
        </div>

        <div className="selection-summary" aria-live="polite">
          <strong>
            {selectedCount} / {REQUIRED_SELECTION_COUNT}장 선택
          </strong>
          <span>{selectionNotice || '사진을 누르면 선택 순서가 지정돼요.'}</span>
        </div>

        <div className="review-grid">
          {capturedPhotos.map((photo) => {
            const selectedIndex = selectedPhotoIds.indexOf(photo.id)
            const selectionOrder = selectedIndex + 1
            const isSelected = selectedIndex >= 0
            const ariaLabel = isSelected
              ? `촬영 ${photo.shotNumber}번 사진, 최종 네컷의 ${selectionOrder}번째 사진으로 선택됨`
              : `촬영 ${photo.shotNumber}번 사진, 선택되지 않음`

            return (
              <button
                aria-label={ariaLabel}
                aria-pressed={isSelected}
                className={`review-photo-button ${isSelected ? 'review-photo-selected' : ''}`}
                key={photo.id}
                type="button"
                onClick={() => onTogglePhoto(photo.id)}
              >
                <span className="review-shot-label">촬영 {photo.shotNumber}</span>
                {isSelected && (
                  <span className="review-selection-badge">
                    <span aria-hidden="true">{selectionOrder}</span>
                    <span className="sr-only">선택됨</span>
                  </span>
                )}
                {isSelected && <span className="review-selected-text">선택됨</span>}
              <img
                className="review-photo"
                src={photo.url}
                alt={`${photo.shotNumber}번째 촬영 사진`}
              />
              </button>
            )
          })}
        </div>

        <div className="review-actions">
          <button
            className="button button-secondary"
            disabled={isReconnectingCamera}
            type="button"
            onClick={onRetake}
          >
            {isReconnectingCamera ? '카메라 다시 연결 중...' : '전체 다시 촬영'}
          </button>
          <button
            className="button button-primary"
            disabled={selectedCount !== REQUIRED_SELECTION_COUNT}
            type="button"
            onClick={onCompleteSelection}
          >
            {selectedCount === REQUIRED_SELECTION_COUNT
              ? '선택한 4장 확인하기'
              : '4장을 모두 선택해 주세요'}
          </button>
        </div>
      </section>
    </main>
  )
}

function SelectionPreviewScreen({
  isReconnectingCamera,
  onBackToReview,
  onDecorateFrame,
  onRetake,
  selectionNotice,
  selectedPhotos,
}) {
  const cutLabels = ['첫 번째 컷', '두 번째 컷', '세 번째 컷', '네 번째 컷']
  const canDecorateFrame = selectedPhotos.length === REQUIRED_SELECTION_COUNT

  return (
    <main className="screen selection-preview-screen">
      <section className="selection-preview-content" aria-labelledby="selection-preview-title">
        <div className="selection-preview-heading">
          <BrandHeader />
          <h1 id="selection-preview-title">선택한 사진을 확인해 주세요</h1>
          <p className="screen-description">
            이 순서대로 최종 네컷에 배치될 예정이에요.
          </p>
        </div>

        {selectionNotice && (
          <div className="selection-preview-notice" role="alert">
            <p>{selectionNotice}</p>
          </div>
        )}

        <div className="selected-strip-preview" aria-label="선택한 네컷 순서">
          {selectedPhotos.map((photo, index) => (
            <figure className="selected-photo-card" key={photo.id}>
              <figcaption className="selected-cut-label">{cutLabels[index]}</figcaption>
              <img
                className="selected-photo"
                src={photo.url}
                alt={`${cutLabels[index]}, ${photo.shotNumber}번째 촬영 사진`}
              />
            </figure>
          ))}
        </div>

        <div className="selection-preview-actions">
          <button className="button button-secondary" type="button" onClick={onBackToReview}>
            선택 다시 하기
          </button>
          <button
            className="button button-secondary"
            disabled={isReconnectingCamera}
            type="button"
            onClick={onRetake}
          >
            {isReconnectingCamera ? '카메라 다시 연결 중...' : '전체 다시 촬영'}
          </button>
          <button
            className="button button-primary"
            disabled={isReconnectingCamera || !canDecorateFrame}
            type="button"
            onClick={onDecorateFrame}
          >
            프레임 꾸미기
          </button>
        </div>
        <p className="helper-text review-helper">
          다음 단계에서 프레임 색상과 날짜 표시를 선택할 수 있어요.
        </p>
      </section>
    </main>
  )
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('start')
  const [cameraError, setCameraError] = useState('')
  const [cameraFacingMode, setCameraFacingMode] = useState('user')
  const [cameraNotice, setCameraNotice] = useState('')
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraDeviceCount, setCameraDeviceCount] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([])
  const [selectionNotice, setSelectionNotice] = useState('')
  const [frameColor, setFrameColor] = useState(DEFAULT_FRAME_COLOR)
  const [showFrameDate, setShowFrameDate] = useState(DEFAULT_SHOW_FRAME_DATE)
  const [finalImageBlob, setFinalImageBlob] = useState(null)
  const [finalImageUrl, setFinalImageUrl] = useState('')
  const [isRenderingFinalImage, setIsRenderingFinalImage] = useState(false)
  const [finalImageError, setFinalImageError] = useState('')
  const [isUploadingShareImage, setIsUploadingShareImage] = useState(false)
  const [sharedImageId, setSharedImageId] = useState('')
  const [sharedImagePageUrl, setSharedImagePageUrl] = useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [sharedImageExpiresAt, setSharedImageExpiresAt] = useState('')
  const [isShareImageUploaded, setIsShareImageUploaded] = useState(false)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrShareError, setQrShareError] = useState('')
  const [printShareNotice, setPrintShareNotice] = useState('')
  const [printShareError, setPrintShareError] = useState('')
  const [directPrintSupported, setDirectPrintSupported] = useState(() => isWebBluetoothSupported())
  const [printerSettings, setPrinterSettings] = useState(() => loadStoredPrinterSettings())
  const [printerConnectionState, setPrinterConnectionState] = useState(() =>
    isWebBluetoothSupported() ? 'disconnected' : 'unsupported',
  )
  const [printerDeviceName, setPrinterDeviceName] = useState(() => getStoredPrinterDeviceLabel())
  const [printerModel, setPrinterModel] = useState('')
  const [printerFirmwareVersion, setPrinterFirmwareVersion] = useState('')
  const [printerTransportDiagnostics, setPrinterTransportDiagnostics] = useState(() =>
    createDefaultPrinterTransportDiagnostics(),
  )
  const [printerStatusMessage, setPrinterStatusMessage] = useState('')
  const [printerBatteryPercent, setPrinterBatteryPercent] = useState(null)
  const [printerHealthStatus, setPrinterHealthStatus] = useState('확인 불가')
  const [isDirectPrintVerified, setIsDirectPrintVerified] = useState(
    () => loadStoredPrinterSettings().directPrintVerified,
  )
  const [isAwaitingTestPrintConfirmation, setIsAwaitingTestPrintConfirmation] = useState(false)
  const [printProgressPercent, setPrintProgressPercent] = useState(null)
  const [adminLongPrintProgress, setAdminLongPrintProgress] = useState(null)
  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [nextShotRemaining, setNextShotRemaining] = useState(null)
  const [isSequenceRunning, setIsSequenceRunning] = useState(false)
  const [isCapturingFrame, setIsCapturingFrame] = useState(false)
  const [isFlashVisible, setIsFlashVisible] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const [captureStatus, setCaptureStatus] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isReconnectingCamera, setIsReconnectingCamera] = useState(false)
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const qrButtonRef = useRef(null)
  const printerRef = useRef(null)
  const printerRestoreAttemptedRef = useRef(false)
  const testPrintInFlightRef = useRef(false)
  const capturedPhotosRef = useRef([])
  const finalImageUrlRef = useRef('')
  const finalImageJobRef = useRef(0)
  const captureTimeoutsRef = useRef(new Set())
  const captureSessionRef = useRef(0)
  const selectedPhotos = selectedPhotoIds
    .map((photoId) => capturedPhotos.find((photo) => photo.id === photoId))
    .filter(Boolean)
  const showPrinterSetupPanel = shouldShowPrinterSetup()
  const hasCompleteFrameSelection =
    selectedPhotoIds.length === REQUIRED_SELECTION_COUNT &&
    selectedPhotos.length === REQUIRED_SELECTION_COUNT &&
    selectedPhotos.every((photo) => Boolean(photo.url))
  const hasFinalImage = Boolean(finalImageBlob && finalImageUrl)
  const hasConfiguredPrinter = Boolean(
    printerSettings.deviceId ||
      printerSettings.deviceName ||
      printerDeviceName ||
      printerRef.current?.hasDevice(),
  )
  const isDirectPrintReady =
    directPrintSupported &&
    hasConfiguredPrinter &&
    printerConnectionState === 'connected'
  const shouldShowPrinterReconnect =
    directPrintSupported &&
    hasFinalImage &&
    !isDirectPrintReady &&
    printerConnectionState !== 'printing' &&
    (printerConnectionState === 'connecting' ||
      printerConnectionState === 'disconnected' ||
      printerConnectionState === 'error' ||
      !hasConfiguredPrinter)

  const clearCaptureTimers = useCallback(() => {
    captureTimeoutsRef.current.forEach((timer) => {
      clearTimeout(timer.timeoutId)
      timer.resolve(false)
    })
    captureTimeoutsRef.current.clear()
  }, [])

  const waitForCaptureDelay = useCallback((duration) => {
    return new Promise((resolve) => {
      const timer = {
        timeoutId: null,
        resolve,
      }

      timer.timeoutId = setTimeout(() => {
        captureTimeoutsRef.current.delete(timer)
        resolve(true)
      }, duration)
      captureTimeoutsRef.current.add(timer)
    })
  }, [])

  const waitForNextCountdownWindow = useCallback(
    async (sessionId, lastShotCapturedAt) => {
      const nextShotTargetAt = lastShotCapturedAt + SHOT_INTERVAL_MS
      const countdownStartAt = nextShotTargetAt - COUNTDOWN_DURATION_MS

      while (performance.now() < countdownStartAt) {
        if (captureSessionRef.current !== sessionId) {
          return false
        }

        setNextShotRemaining(
          Math.max(
            COUNTDOWN_SECONDS + 1,
            Math.ceil((nextShotTargetAt - performance.now()) / COUNTDOWN_TICK_MS),
          ),
        )

        const remainingUntilCountdown = countdownStartAt - performance.now()
        const completed = await waitForCaptureDelay(
          Math.min(COUNTDOWN_TICK_MS, Math.max(remainingUntilCountdown, 0)),
        )

        if (!completed || captureSessionRef.current !== sessionId) {
          return false
        }
      }

      setNextShotRemaining(null)
      return true
    },
    [waitForCaptureDelay],
  )

  const revokePhotoUrls = useCallback((photos) => {
    photos.forEach((photo) => {
      if (photo.url) {
        URL.revokeObjectURL(photo.url)
      }
    })
  }, [])

  const resetQrShareState = useCallback(() => {
    setIsUploadingShareImage(false)
    setSharedImageId('')
    setSharedImagePageUrl('')
    setQrCodeDataUrl('')
    setSharedImageExpiresAt('')
    setIsShareImageUploaded(false)
    setIsQrDialogOpen(false)
    setQrShareError('')
  }, [])

  const resetPrintShareState = useCallback(() => {
    setPrintShareNotice('')
    setPrintShareError('')
    setAdminLongPrintProgress(null)
    setPrintProgressPercent(null)
  }, [])

  const clearFinalImage = useCallback((options = {}) => {
    const { clearError = true } = options

    finalImageJobRef.current += 1
    resetQrShareState()
    resetPrintShareState()

    if (finalImageUrlRef.current) {
      URL.revokeObjectURL(finalImageUrlRef.current)
      finalImageUrlRef.current = ''
    }

    setFinalImageBlob(null)
    setFinalImageUrl('')

    if (clearError) {
      setFinalImageError('')
    }
  }, [resetPrintShareState, resetQrShareState])

  const storePrinterSettings = useCallback((nextSettings) => {
    const normalizedSettings = normalizePrinterSettings(nextSettings)

    setPrinterSettings(normalizedSettings)
    setIsDirectPrintVerified(normalizedSettings.directPrintVerified)
    saveStoredPrinterSettings(normalizedSettings)

    return normalizedSettings
  }, [])

  const getPrinterClient = useCallback(() => {
    if (!printerRef.current) {
      printerRef.current = createLuckJingleBlePrinter({
        onDisconnect: () => {
          testPrintInFlightRef.current = false
          setPrinterConnectionState((currentState) =>
            currentState === 'unsupported' ? currentState : 'disconnected',
          )
          setPrinterStatusMessage(DIRECT_PRINT_RECONNECT_MESSAGE)
          setPrintProgressPercent(null)

          if (finalImageUrlRef.current) {
            setPrintShareNotice('')
            setPrintShareError(DIRECT_PRINT_RECONNECT_MESSAGE)
          }
        },
        onBattery: (batteryPercent) => {
          setPrinterBatteryPercent(batteryPercent)
        },
        onModel: (model) => {
          setPrinterModel(model)
        },
        onDiagnostics: (diagnostics) => {
          setPrinterModel(diagnostics.model ?? '')
          setPrinterFirmwareVersion(diagnostics.firmwareVersion ?? '')
        },
        onTransportDiagnostics: (transportDiagnostics) => {
          setPrinterTransportDiagnostics({
            ...createDefaultPrinterTransportDiagnostics(),
            ...transportDiagnostics,
          })
        },
        onStatus: (status) => {
          setPrinterHealthStatus(getPrinterHealthStatusLabel(status))

          if (status?.message) {
            setPrinterStatusMessage(status.message)
          }
        },
      })
    }

    return printerRef.current
  }, [])

  const applyConnectedPrinterInfo = useCallback(
    (printerInfo, options = {}) => {
      const {
        connectionState = 'connected',
        preserveVerification = false,
        statusMessage = printerInfo?.status?.message ?? '프린터가 연결됐어요.',
      } = options
      const nextDeviceName = printerInfo?.deviceName ?? ''
      const nextDeviceId = printerInfo?.deviceId ?? ''
      const selectedDeviceLabel = nextDeviceName || '이름을 제공하지 않는 BLE 장치'
      const storedDeviceMatches =
        (nextDeviceId && printerSettings.deviceId === nextDeviceId) ||
        (nextDeviceName && printerSettings.deviceName === nextDeviceName)
      const nextDirectPrintVerified = preserveVerification
        ? printerSettings.directPrintVerified
        : storedDeviceMatches
          ? printerSettings.directPrintVerified
          : false
      const nextSettings = storePrinterSettings({
        ...printerSettings,
        deviceId: nextDeviceId,
        deviceName: nextDeviceName,
        directPrintVerified: nextDirectPrintVerified,
      })

      setPrinterConnectionState(connectionState)
      setPrinterDeviceName(selectedDeviceLabel)
      setPrinterModel(printerInfo?.model ?? '')
      setPrinterFirmwareVersion(printerInfo?.firmwareVersion ?? '')
      setPrinterTransportDiagnostics({
        ...createDefaultPrinterTransportDiagnostics(),
        ...printerInfo?.transportDiagnostics,
      })
      setPrinterBatteryPercent(
        Number.isFinite(printerInfo?.batteryPercent) ? printerInfo.batteryPercent : null,
      )
      setPrinterHealthStatus(getPrinterHealthStatusLabel(printerInfo?.status))
      setPrinterStatusMessage(statusMessage)
      setIsAwaitingTestPrintConfirmation(false)
      setIsDirectPrintVerified(nextSettings.directPrintVerified)

      return nextSettings
    },
    [printerSettings, storePrinterSettings],
  )

  const ensurePrinterConnectedForJob = useCallback(
    async (statusMessage, options = {}) => {
      const { connectionState = 'printing' } = options
      const printerClient = getPrinterClient()
      const printerInfo = await printerClient.ensureConnected({
        savedDevice: {
          deviceId: printerSettings.deviceId,
          deviceName: printerSettings.deviceName,
        },
      })

      applyConnectedPrinterInfo(printerInfo, {
        connectionState,
        preserveVerification: true,
        statusMessage,
      })

      return printerClient
    },
    [
      applyConnectedPrinterInfo,
      getPrinterClient,
      printerSettings.deviceId,
      printerSettings.deviceName,
    ],
  )

  const handlePrinterConnect = useCallback(async (options = {}) => {
    const { includeAllDevices = false } = options

    if (!directPrintSupported) {
      const nextMessage =
        '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.'

      setPrinterConnectionState('unsupported')
      setPrinterStatusMessage(nextMessage)
      return { ok: false, message: nextMessage }
    }

    setPrinterConnectionState('connecting')
    setPrinterStatusMessage(
      includeAllDevices
        ? 'Bluetooth 장치 선택창에서 프린터를 선택해 주세요.'
        : `${PRINTER_NAME_PREFIX}로 시작하는 프린터를 검색하고 있어요.`,
    )
    setIsAwaitingTestPrintConfirmation(false)

    try {
      const printerInfo = await getPrinterClient().requestAndConnect({ includeAllDevices })

      const nextSettings = applyConnectedPrinterInfo(printerInfo)

      return {
        directPrintVerified: Boolean(nextSettings?.directPrintVerified),
        ok: true,
        printerInfo,
      }
    } catch (error) {
      setPrinterConnectionState('disconnected')

      if (error?.name === 'NotFoundError') {
        const nextMessage = includeAllDevices
          ? '프린터 선택이 취소됐어요.'
          : PPS1_PRINTER_NOT_FOUND_MESSAGE

        setPrinterStatusMessage(nextMessage)
        return { ok: false, message: nextMessage }
      }

      const nextMessage = getPrinterErrorMessage(error)

      setPrinterStatusMessage(nextMessage)
      return { ok: false, message: nextMessage }
    }
  }, [applyConnectedPrinterInfo, directPrintSupported, getPrinterClient])

  const handleShowAllBleDevices = useCallback(() => {
    return handlePrinterConnect({ includeAllDevices: true })
  }, [handlePrinterConnect])

  const handlePrinterDisconnect = useCallback(async () => {
    await printerRef.current?.disconnect()
    storePrinterSettings({
      ...printerSettings,
      deviceId: '',
      deviceName: '',
      directPrintVerified: false,
    })
    setPrinterConnectionState(directPrintSupported ? 'disconnected' : 'unsupported')
    setPrinterDeviceName('')
    setPrinterModel('')
    setPrinterFirmwareVersion('')
    setPrinterTransportDiagnostics(createDefaultPrinterTransportDiagnostics())
    setPrinterBatteryPercent(null)
    setPrinterHealthStatus('확인 불가')
    setPrinterStatusMessage('프린터 연결을 해제했어요.')
    setIsAwaitingTestPrintConfirmation(false)
  }, [directPrintSupported, printerSettings, storePrinterSettings])

  const handlePrinterWidthChange = useCallback(
    (printWidth) => {
      storePrinterSettings({
        ...printerSettings,
        printWidth,
        directPrintVerified: false,
      })
      setIsAwaitingTestPrintConfirmation(false)
      setPrinterStatusMessage('인쇄 폭이 변경됐어요. 테스트 인쇄를 다시 확인해 주세요.')
    },
    [printerSettings, storePrinterSettings],
  )

  const handlePrinterDensityChange = useCallback(
    (density) => {
      storePrinterSettings({
        ...printerSettings,
        density,
        directPrintVerified: false,
      })
      setIsAwaitingTestPrintConfirmation(false)
      setPrinterStatusMessage('농도가 변경됐어요. 테스트 인쇄를 다시 확인해 주세요.')
    },
    [printerSettings, storePrinterSettings],
  )

  const handleTestRasterWriteModeChange = useCallback(
    (testRasterWriteMode) => {
      storePrinterSettings({
        ...printerSettings,
        testRasterWriteMode,
      })
      setPrinterStatusMessage('테스트 raster write mode를 변경했어요.')
    },
    [printerSettings, storePrinterSettings],
  )

  const handleTestPrint = useCallback(async () => {
    const diagnosticsPrinterClient = getPrinterClient()

    if (testPrintInFlightRef.current) {
      diagnosticsPrinterClient.recordDuplicateTestPrintBlocked()
      setPrinterStatusMessage('테스트 인쇄가 이미 진행 중이에요.')
      return
    }

    testPrintInFlightRef.current = true
    diagnosticsPrinterClient.recordTestPrintInvocation()

    try {
    if (!directPrintSupported) {
      setPrinterConnectionState('unsupported')
      setPrinterStatusMessage(
        '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.',
      )
      return
    }

    if (!hasConfiguredPrinter) {
      setPrinterStatusMessage('프린터 연결을 먼저 확인해 주세요.')
      return
    }

    setPrinterConnectionState('printing')
    setPrinterStatusMessage('테스트 인쇄 데이터를 전송하고 있어요.')
    setIsAwaitingTestPrintConfirmation(false)

    try {
      const printerClient = await ensurePrinterConnectedForJob('테스트 인쇄 데이터를 전송하고 있어요.')

      await printerClient.printTestPage(printerSettings, { allowReconnect: false })
      setPrinterConnectionState(printerClient.isConnected() ? 'connected' : 'disconnected')
      setPrinterStatusMessage(
        printerClient.isConnected()
          ? '테스트 인쇄 데이터 전송 완료'
          : '테스트 인쇄 데이터 전송 완료\n다음 인쇄 시 자동 재연결을 시도해요.',
      )
      setIsAwaitingTestPrintConfirmation(true)
    } catch (error) {
      if (error?.code === 'print-disconnected') {
        setPrinterConnectionState('disconnected')
        setPrinterStatusMessage(
          '테스트 인쇄 중 프린터 연결이 끊겼어요.\n용지가 정상 출력됐다면 정상 출력됨을 눌러 주세요.',
        )
        setIsAwaitingTestPrintConfirmation(true)
        return
      }

      const nextState =
        error?.code === 'connection-lost' ||
        error?.code === 'not-connected' ||
        error?.code === 'device-missing'
          ? 'disconnected'
          : 'error'

      setPrinterConnectionState(nextState)
      setPrinterStatusMessage(getPrinterErrorMessage(error))
    }
    } finally {
      testPrintInFlightRef.current = false
    }
  }, [
    directPrintSupported,
    ensurePrinterConnectedForJob,
    getPrinterClient,
    hasConfiguredPrinter,
    printerSettings,
  ])

  const handleConfirmTestPrint = useCallback(() => {
    storePrinterSettings({
      ...printerSettings,
      directPrintVerified: true,
    })
    setIsAwaitingTestPrintConfirmation(false)
    setPrinterStatusMessage('테스트 출력 확인 완료')
  }, [printerSettings, storePrinterSettings])

  const handleRefreshPrinterStatus = useCallback(async () => {
    if (!directPrintSupported) {
      setPrinterConnectionState('unsupported')
      setPrinterStatusMessage(
        '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.',
      )
      return
    }

    if (!hasConfiguredPrinter) {
      setPrinterStatusMessage('프린터 연결을 먼저 확인해 주세요.')
      return
    }

    setPrinterConnectionState('connecting')
    setPrinterStatusMessage('프린터 상태를 확인하고 있어요.')

    try {
      const printerClient = await ensurePrinterConnectedForJob('프린터 상태를 확인하고 있어요.', {
        connectionState: 'connected',
      })
      const diagnostics = await printerClient.queryPrinterDiagnostics()
      const batteryPercent = await printerClient.queryBattery()
      const status = await printerClient.queryStatus()

      setPrinterModel(diagnostics.model ?? '')
      setPrinterFirmwareVersion(diagnostics.firmwareVersion ?? '')
      setPrinterBatteryPercent(Number.isFinite(batteryPercent) ? batteryPercent : null)
      setPrinterHealthStatus(getPrinterHealthStatusLabel(status))
      setPrinterConnectionState(printerClient.isConnected() ? 'connected' : 'disconnected')
      setPrinterStatusMessage(
        status ? '프린터 상태를 확인했어요.' : '프린터 상태 응답을 받지 못했어요.',
      )
    } catch (error) {
      const nextMessage = getPrinterErrorMessage(error)

      setPrinterConnectionState('disconnected')
      setPrinterStatusMessage(nextMessage)
    }
  }, [
    directPrintSupported,
    ensurePrinterConnectedForJob,
    hasConfiguredPrinter,
  ])

  const resetFrameSettings = useCallback(() => {
    setFrameColor(DEFAULT_FRAME_COLOR)
    setShowFrameDate(DEFAULT_SHOW_FRAME_DATE)
  }, [])

  const clearCapturedPhotos = useCallback(() => {
    revokePhotoUrls(capturedPhotosRef.current)
    capturedPhotosRef.current = []
    setCapturedPhotos([])
    setSelectedPhotoIds([])
    setSelectionNotice('')
    clearFinalImage()
    resetFrameSettings()
  }, [clearFinalImage, resetFrameSettings, revokePhotoUrls])

  const resetCaptureState = useCallback((options = {}) => {
    const { clearError = true } = options

    captureSessionRef.current += 1
    clearCaptureTimers()
    setCurrentShotIndex(0)
    setCountdown(null)
    setNextShotRemaining(null)
    setIsSequenceRunning(false)
    setIsCapturingFrame(false)
    setIsFlashVisible(false)
    setCaptureStatus('')

    if (clearError) {
      setCaptureError('')
    }
  }, [clearCaptureTimers])

  const handleVideoReadyChange = useCallback((nextIsReady) => {
    setIsVideoReady(nextIsReady)
  }, [])

  const isCameraStreamActive = useCallback(() => {
    return Boolean(
      streamRef.current &&
        streamRef.current.getVideoTracks().some((track) => track.readyState === 'live'),
    )
  }, [])

  const stopCameraStream = useCallback((options = {}) => {
    const { resetDeviceCount = true, updateState = true } = options

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    if (updateState) {
      setCameraStream(null)
      setIsVideoReady(false)

      if (resetDeviceCount) {
        setCameraDeviceCount(0)
      }
    }
  }, [])

  useEffect(() => {
    capturedPhotosRef.current = capturedPhotos
  }, [capturedPhotos])

  useEffect(() => {
    return () => {
      captureSessionRef.current += 1
      clearCaptureTimers()
      revokePhotoUrls(capturedPhotosRef.current)
      capturedPhotosRef.current = []
      if (finalImageUrlRef.current) {
        URL.revokeObjectURL(finalImageUrlRef.current)
        finalImageUrlRef.current = ''
      }
      stopCameraStream({ updateState: false })
    }
  }, [clearCaptureTimers, revokePhotoUrls, stopCameraStream])

  useEffect(() => {
    const supported = isWebBluetoothSupported()

    setDirectPrintSupported(supported)
    setPrinterConnectionState((currentState) => {
      if (!supported) {
        return 'unsupported'
      }

      return currentState === 'unsupported' ? 'disconnected' : currentState
    })
  }, [])

  useEffect(() => {
    return () => {
      void printerRef.current?.disconnect({ forgetDevice: false })
    }
  }, [])

  useEffect(() => {
    if (
      !showPrinterSetupPanel ||
      !directPrintSupported ||
      printerRestoreAttemptedRef.current ||
      (!printerSettings.deviceId && !printerSettings.deviceName)
    ) {
      return
    }

    printerRestoreAttemptedRef.current = true
    setPrinterConnectionState('connecting')
    setPrinterStatusMessage('권한이 있는 프린터를 다시 연결하고 있어요.')

    getPrinterClient()
      .reconnectAuthorizedDevice({
        deviceId: printerSettings.deviceId,
        deviceName: printerSettings.deviceName,
      })
      .then((printerInfo) => {
        if (printerInfo) {
          applyConnectedPrinterInfo(printerInfo, { preserveVerification: true })
          return
        }

        setPrinterConnectionState('disconnected')
        setPrinterStatusMessage('저장된 프린터 권한을 찾지 못했어요.')
      })
      .catch(() => {
        setPrinterConnectionState('disconnected')
        setPrinterStatusMessage('프린터 자동 재연결을 완료하지 못했어요.')
      })
  }, [
    applyConnectedPrinterInfo,
    directPrintSupported,
    getPrinterClient,
    printerSettings.deviceId,
    printerSettings.deviceName,
    showPrinterSetupPanel,
  ])

  const getVideoDeviceCount = async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.enumerateDevices !== 'function'
    ) {
      return 0
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter((device) => device.kind === 'videoinput').length
    } catch {
      return 0
    }
  }

  const createCameraStream = (facingMode) => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
      },
      audio: false,
    })
  }

  const applyCameraStream = async (stream, facingMode) => {
    streamRef.current = stream
    setIsVideoReady(false)
    setCameraStream(stream)
    setCameraFacingMode(facingMode)
    setCameraDeviceCount(await getVideoDeviceCount())
  }

  const openCamera = async (facingMode = cameraFacingMode) => {
    if (isConnecting) {
      return false
    }

    setIsConnecting(true)
    setCameraError('')
    setCameraNotice('')
    stopCameraStream()

    const supportMessage = getCameraSupportMessage()

    if (supportMessage) {
      setCameraError(supportMessage)
      setIsConnecting(false)
      return false
    }

    try {
      const stream = await createCameraStream(facingMode)
      await applyCameraStream(stream, facingMode)
      setCurrentScreen('camera')
      return true
    } catch (error) {
      stopCameraStream()
      setCameraError(getCameraErrorMessage(error))
      setCurrentScreen('guide')
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const canCaptureFrame = useCallback(() => {
    const videoElement = videoRef.current

    return Boolean(
      isVideoReady &&
        isCameraStreamActive() &&
        videoElement?.videoWidth > 0 &&
        videoElement?.videoHeight > 0,
    )
  }, [isCameraStreamActive, isVideoReady])

  const handleCaptureFailure = useCallback(() => {
    resetCaptureState({ clearError: false })
    clearCapturedPhotos()
    setCaptureError(CAPTURE_ERROR_MESSAGE)
    setCaptureStatus('카메라 화면을 확인한 뒤 다시 시도해 주세요.')
  }, [clearCapturedPhotos, resetCaptureState])

  const cancelCaptureSequence = useCallback((options = {}) => {
    const { message = '' } = options

    resetCaptureState()
    clearCapturedPhotos()

    if (message) {
      setCaptureStatus(message)
    }
  }, [clearCapturedPhotos, resetCaptureState])

  const startCaptureSequence = async () => {
    if (isSequenceRunning || isCapturingFrame || !canCaptureFrame()) {
      setCaptureError(CAPTURE_ERROR_MESSAGE)
      return
    }

    resetCaptureState()
    clearCapturedPhotos()

    const sessionId = captureSessionRef.current + 1
    captureSessionRef.current = sessionId
    const nextPhotos = []

    setCaptureError('')
    setCaptureStatus('카운트다운 중')
    setCurrentShotIndex(0)
    setIsSequenceRunning(true)

    try {
      for (let shotIndex = 0; shotIndex < TOTAL_SHOTS; shotIndex += 1) {
        if (captureSessionRef.current !== sessionId) {
          return
        }

        setCurrentShotIndex(shotIndex)
        setCaptureStatus('카운트다운 중')

        for (let count = COUNTDOWN_SECONDS; count >= 1; count -= 1) {
          if (captureSessionRef.current !== sessionId) {
            return
          }

          setCountdown(count)

          const completed = await waitForCaptureDelay(COUNTDOWN_TICK_MS)

          if (!completed || captureSessionRef.current !== sessionId) {
            return
          }
        }

        setCountdown(null)
        setCaptureStatus('촬영 중')
        setIsCapturingFrame(true)

        if (!canCaptureFrame()) {
          throw new Error('Camera is not ready')
        }

        const shotCapturedAt = performance.now()
        const capturedPhoto = await captureFrameFromVideo(
          videoRef.current,
          cameraFacingMode,
          shotIndex + 1,
        )

        if (captureSessionRef.current !== sessionId) {
          revokePhotoUrls([capturedPhoto])
          return
        }

        nextPhotos.push(capturedPhoto)
        capturedPhotosRef.current = nextPhotos
        setCapturedPhotos([...nextPhotos])
        setIsCapturingFrame(false)
        setIsFlashVisible(true)

        await waitForCaptureDelay(FLASH_DURATION_MS)

        if (captureSessionRef.current !== sessionId) {
          return
        }

        setIsFlashVisible(false)

        if (shotIndex < TOTAL_SHOTS - 1) {
          setCurrentShotIndex(shotIndex + 1)
          setCaptureStatus('촬영 완료! 다음 사진을 준비해 주세요.')

          const completed = await waitForNextCountdownWindow(sessionId, shotCapturedAt)

          if (!completed || captureSessionRef.current !== sessionId) {
            return
          }
        }
      }

      if (captureSessionRef.current !== sessionId || nextPhotos.length !== TOTAL_SHOTS) {
        return
      }

      clearCaptureTimers()
      setCountdown(null)
      setIsSequenceRunning(false)
      setIsCapturingFrame(false)
      setIsFlashVisible(false)
      setCaptureStatus('')
      stopCameraStream()
      setCurrentScreen('review')
    } catch {
      if (captureSessionRef.current === sessionId) {
        handleCaptureFailure()
      }
    }
  }

  const handleBackToStart = () => {
    resetCaptureState()
    clearCapturedPhotos()
    stopCameraStream()
    setCameraError('')
    setCameraNotice('')
    setCurrentScreen('start')
  }

  const handleBackToGuide = () => {
    resetCaptureState()
    clearCapturedPhotos()
    stopCameraStream()
    setCameraError('')
    setCameraNotice('')
    setIsConnecting(false)
    setIsSwitchingCamera(false)
    setCurrentScreen('guide')
  }

  const handleSwitchCamera = async () => {
    if (isSwitchingCamera || isConnecting || isSequenceRunning) {
      return
    }

    const previousFacingMode = cameraFacingMode
    const nextFacingMode = previousFacingMode === 'user' ? 'environment' : 'user'

    setIsSwitchingCamera(true)
    setCameraError('')
    setCameraNotice('')
    stopCameraStream({ resetDeviceCount: false })

    try {
      const nextStream = await createCameraStream(nextFacingMode)
      await applyCameraStream(nextStream, nextFacingMode)
    } catch (switchError) {
      stopCameraStream({ resetDeviceCount: false })

      try {
        const restoredStream = await createCameraStream(previousFacingMode)
        await applyCameraStream(restoredStream, previousFacingMode)
        setCameraNotice('카메라 전환에 실패해서 기존 카메라를 유지하고 있어요.')
      } catch (restoreError) {
        stopCameraStream()
        setCameraError(getCameraErrorMessage(restoreError || switchError))
        setCurrentScreen('guide')
      }
    } finally {
      setIsSwitchingCamera(false)
    }
  }

  const handleRetakeAll = async () => {
    if (isReconnectingCamera) {
      return
    }

    resetCaptureState()
    clearCapturedPhotos()
    setIsReconnectingCamera(true)

    try {
      await openCamera(cameraFacingMode)
    } finally {
      setIsReconnectingCamera(false)
    }
  }

  const handleTogglePhotoSelection = (photoId) => {
    if (selectedPhotoIds.includes(photoId)) {
      setSelectionNotice('')
      setSelectedPhotoIds((currentSelectedIds) =>
        currentSelectedIds.filter((selectedId) => selectedId !== photoId),
      )
      return
    }

    if (selectedPhotoIds.length >= REQUIRED_SELECTION_COUNT) {
      setSelectionNotice('사진은 최대 4장까지 선택할 수 있어요.')
      return
    }

    setSelectionNotice('')
    setSelectedPhotoIds((currentSelectedIds) => [...currentSelectedIds, photoId])
  }

  const handleCompleteSelection = () => {
    if (!hasCompleteFrameSelection) {
      setSelectionNotice(FRAME_SELECTION_ERROR_MESSAGE)
      return
    }

    setSelectionNotice('')
    setCurrentScreen('selectionPreview')
  }

  const handleOpenFrame = () => {
    if (!hasCompleteFrameSelection) {
      setSelectionNotice(FRAME_SELECTION_ERROR_MESSAGE)
      setCurrentScreen('review')
      return
    }

    setSelectionNotice('')
    setCurrentScreen('frame')
  }

  const handleCreateFinalImage = async () => {
    if (isRenderingFinalImage) {
      return
    }

    if (!hasCompleteFrameSelection) {
      setFinalImageError(FINAL_IMAGE_ERROR_MESSAGE)
      return
    }

    setIsRenderingFinalImage(true)
    setFinalImageError('')
    clearFinalImage({ clearError: false })

    const finalImageJobId = finalImageJobRef.current + 1
    finalImageJobRef.current = finalImageJobId
    const isCurrentFinalImageJob = () => finalImageJobRef.current === finalImageJobId

    try {
      const shareImageId = createShareImageId()
      const sharePageUrl = createSharePageUrl(shareImageId)
      const nextQrCodeDataUrl = await createQrCodeDataUrl(sharePageUrl)
      const pngBlob = await renderFinalStrip({
        photos: selectedPhotos,
        frameColor,
        showDate: showFrameDate,
        dateText: formatLocalFrameDate(),
        qrCodeDataUrl: nextQrCodeDataUrl,
      })
      const pngUrl = URL.createObjectURL(pngBlob)

      if (!isCurrentFinalImageJob()) {
        URL.revokeObjectURL(pngUrl)
        return
      }

      finalImageUrlRef.current = pngUrl
      setFinalImageBlob(pngBlob)
      setFinalImageUrl(pngUrl)
      setSharedImageId(shareImageId)
      setSharedImagePageUrl(sharePageUrl)
      setSharedImageExpiresAt('')
      setQrCodeDataUrl(nextQrCodeDataUrl)
      setIsShareImageUploaded(false)
      setCurrentScreen('result')
      setIsRenderingFinalImage(false)
      setIsUploadingShareImage(true)

      try {
        const payload = await uploadFinalImageForShare(pngBlob, pngUrl, {
          imageId: shareImageId,
        })

        if (payload.id !== shareImageId) {
          throw new Error('Share image id mismatch')
        }

        if (!isCurrentFinalImageJob()) {
          return
        }

        setSharedImageExpiresAt(payload?.expiresAt ?? '')
        setIsShareImageUploaded(true)
        setQrShareError('')
      } catch {
        if (isCurrentFinalImageJob()) {
          setIsShareImageUploaded(false)
          setQrShareError(QR_SHARE_ERROR_MESSAGE)
        }
      } finally {
        if (isCurrentFinalImageJob()) {
          setIsUploadingShareImage(false)
        }
      }
    } catch {
      if (isCurrentFinalImageJob()) {
        clearFinalImage({ clearError: false })
        setFinalImageError(FINAL_IMAGE_ERROR_MESSAGE)
        setIsRenderingFinalImage(false)
        setIsUploadingShareImage(false)
      }
    } finally {
      if (isCurrentFinalImageJob()) {
        setIsRenderingFinalImage(false)
      }
    }
  }

  const handleCloseQrDialog = useCallback(() => {
    setIsQrDialogOpen(false)

    window.requestAnimationFrame(() => {
      qrButtonRef.current?.focus()
    })
  }, [])

  const handleOpenQrShare = async () => {
    if (!finalImageBlob || isUploadingShareImage) {
      return
    }

    const hasPreparedShareTarget = Boolean(sharedImageId && sharedImagePageUrl && qrCodeDataUrl)

    if (hasPreparedShareTarget && isShareImageUploaded) {
      setQrShareError('')
      setIsQrDialogOpen(true)
      return
    }

    setIsUploadingShareImage(true)
    setQrShareError('')

    try {
      const payload = await uploadFinalImageForShare(
        finalImageBlob,
        finalImageUrl,
        hasPreparedShareTarget ? { imageId: sharedImageId } : {},
      )

      if (hasPreparedShareTarget && payload.id !== sharedImageId) {
        throw new Error('Share image id mismatch')
      }

      const pageUrl = hasPreparedShareTarget ? sharedImagePageUrl : payload.pageUrl
      const nextQrCodeDataUrl = hasPreparedShareTarget
        ? qrCodeDataUrl
        : await createQrCodeDataUrl(pageUrl)

      setSharedImageId(payload.id)
      setSharedImagePageUrl(pageUrl)
      setSharedImageExpiresAt(payload?.expiresAt ?? '')
      setQrCodeDataUrl(nextQrCodeDataUrl)
      setIsShareImageUploaded(true)
      setIsQrDialogOpen(true)
    } catch {
      setIsShareImageUploaded(false)
      setQrShareError(QR_SHARE_ERROR_MESSAGE)
    } finally {
      setIsUploadingShareImage(false)
    }
  }

  const handleShareForPrint = async () => {
    if (!finalImageBlob || printerConnectionState === 'printing') {
      return
    }

    setPrintShareNotice('')
    setPrintShareError('')
    setPrintProgressPercent(null)

    if (!directPrintSupported) {
      const nextMessage =
        '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.'

      setPrinterConnectionState('unsupported')
      setPrinterStatusMessage(nextMessage)
      setPrintShareError(nextMessage)
      return
    }

    if (!hasConfiguredPrinter) {
      setPrinterStatusMessage(DIRECT_PRINT_NOT_CONFIGURED_MESSAGE)
      setPrintShareError(DIRECT_PRINT_NOT_CONFIGURED_MESSAGE)
      return
    }

    if (printerConnectionState !== 'connected' || !printerRef.current?.isConnected()) {
      setPrinterConnectionState('disconnected')
      setPrinterStatusMessage(DIRECT_PRINT_RECONNECT_MESSAGE)
      setPrintShareError(DIRECT_PRINT_RECONNECT_MESSAGE)
      return
    }

    setPrinterConnectionState('printing')
    setPrinterStatusMessage('인쇄 데이터를 전송하고 있어요.')
    setPrintProgressPercent(0)

    try {
      const printerClient = await ensurePrinterConnectedForJob('인쇄 데이터를 전송하고 있어요.')

      await printerClient.printImageBlob(finalImageBlob, printerSettings, {
        allowReconnect: false,
        onProgress: ({ percent }) => {
          setPrintProgressPercent(percent)
        },
      })
      setPrinterConnectionState(printerClient.isConnected() ? 'connected' : 'disconnected')
      setPrinterStatusMessage(
        printerClient.isConnected()
          ? DIRECT_PRINT_COMPLETE_MESSAGE
          : `${DIRECT_PRINT_COMPLETE_MESSAGE}\n다음 인쇄 전 프린터 다시 연결을 눌러 주세요.`,
      )
      setPrintShareNotice(DIRECT_PRINT_COMPLETE_MESSAGE)
      setPrintProgressPercent(null)
    } catch (error) {
      const nextMessage = getPrinterErrorMessage(error)
      const nextState =
        error?.code === 'connection-lost' ||
        error?.code === 'not-connected' ||
        error?.code === 'device-missing' ||
        error?.code === 'print-disconnected'
          ? 'disconnected'
          : 'error'

      setPrinterConnectionState(nextState)
      setPrinterStatusMessage(nextMessage)
      setPrintShareError(nextMessage)
      setPrintProgressPercent(null)
    }
  }

  const handleReconnectPrinterFromResult = useCallback(async () => {
    if (printerConnectionState === 'connecting' || printerConnectionState === 'printing') {
      return
    }

    setPrintShareNotice('')
    setPrintShareError('')
    setPrintProgressPercent(null)

    const result = await handlePrinterConnect()

    if (result?.ok) {
      const nextMessage = DIRECT_PRINT_RECONNECTED_MESSAGE

      setPrinterStatusMessage(nextMessage)
      setPrintShareNotice(nextMessage)
      setPrintShareError('')
      return
    }

    if (result?.message) {
      setPrintShareError(result.message)
    }
  }, [handlePrinterConnect, printerConnectionState])

  const handleAdminLongPrintExperiment = async () => {
    if (!showPrinterSetupPanel || !finalImageBlob || printerConnectionState === 'printing') {
      return
    }

    setPrintShareNotice('')
    setPrintShareError('')
    setAdminLongPrintProgress(null)
    setPrintProgressPercent(0)

    if (!directPrintSupported) {
      const nextMessage =
        '직접 인쇄를 사용하려면 Bluetooth 인쇄를 지원하는 부스 브라우저가 필요해요.'

      setPrinterConnectionState('unsupported')
      setPrinterStatusMessage(nextMessage)
      setPrintShareError(nextMessage)
      setPrintProgressPercent(null)
      return
    }

    if (!hasConfiguredPrinter) {
      setPrinterStatusMessage(DIRECT_PRINT_NOT_CONFIGURED_MESSAGE)
      setPrintShareError(DIRECT_PRINT_NOT_CONFIGURED_MESSAGE)
      setPrintProgressPercent(null)
      return
    }

    setPrinterConnectionState('printing')
    setPrinterStatusMessage('관리자 네컷 실험 인쇄 데이터를 전송하고 있어요.')

    try {
      const printerClient = await ensurePrinterConnectedForJob(
        '관리자 네컷 실험 인쇄 데이터를 전송하고 있어요.',
      )

      await printerClient.printAdminExperimentalImageBlob(finalImageBlob, printerSettings, {
        allowAdminLongPrintExperiment: true,
        allowReconnect: false,
        onProgress: (progress) => {
          setAdminLongPrintProgress(progress)
          setPrintProgressPercent(progress.percent)
        },
      })
      setPrinterConnectionState(printerClient.isConnected() ? 'connected' : 'disconnected')
      setPrinterStatusMessage(
        printerClient.isConnected()
          ? '관리자 네컷 실험 인쇄 전송 완료'
          : '관리자 네컷 실험 인쇄 전송 완료\n다음 인쇄 시 자동 재연결을 시도해요.',
      )
      setPrintShareNotice('관리자 네컷 실험 인쇄 전송 완료')
      setPrintProgressPercent(null)
    } catch (error) {
      const nextMessage = getPrinterErrorMessage(error)
      const nextState =
        error?.code === 'connection-lost' ||
        error?.code === 'not-connected' ||
        error?.code === 'device-missing' ||
        error?.code === 'print-disconnected'
          ? 'disconnected'
          : 'error'

      setPrinterConnectionState(nextState)
      setPrinterStatusMessage(nextMessage)
      setPrintShareError(nextMessage)
      setPrintProgressPercent(null)
    }
  }

  const handleBackToSelectionPreview = () => {
    if (!hasCompleteFrameSelection) {
      setSelectionNotice(FRAME_SELECTION_ERROR_MESSAGE)
      setCurrentScreen('review')
      return
    }

    setCurrentScreen('selectionPreview')
  }

  useEffect(() => {
    if (currentScreen !== 'frame' || hasCompleteFrameSelection) {
      return
    }

    setSelectionNotice(FRAME_SELECTION_ERROR_MESSAGE)
    setCurrentScreen('review')
  }, [currentScreen, hasCompleteFrameSelection])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isSequenceRunning) {
        cancelCaptureSequence({
          message: '화면을 다시 확인한 뒤 촬영을 시작해 주세요.',
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [cancelCaptureSequence, isSequenceRunning])

  return (
    <div className="life4cut-app">
      {currentScreen === 'start' && (
        <StartScreen
          printerSetupPanel={
            showPrinterSetupPanel ? (
              <PrinterSetupPanel
                directPrintSupported={directPrintSupported}
                longPrintDensityLabel={getPrinterDensityLabel(SAFE_PHOTO_DENSITY)}
                minLongPrintBatteryPercent={MIN_LONG_PRINT_BATTERY_PERCENT}
                longDirectPrintEnabled={true}
                isAwaitingTestPrintConfirmation={isAwaitingTestPrintConfirmation}
                isDirectPrintVerified={isDirectPrintVerified}
                printerBatteryPercent={printerBatteryPercent}
                printerConnectionState={printerConnectionState}
                printerDeviceName={printerDeviceName}
                printerFirmwareVersion={printerFirmwareVersion}
                printerHealthStatus={printerHealthStatus}
                printerModel={printerModel}
                printerSettings={printerSettings}
                printerStatusMessage={printerStatusMessage}
                printerTransportDiagnostics={printerTransportDiagnostics}
                onConfirmTestPrint={handleConfirmTestPrint}
                onConnectAnyBleDevice={handleShowAllBleDevices}
                onConnectPrinter={handlePrinterConnect}
                onDensityChange={handlePrinterDensityChange}
                onDisconnectPrinter={handlePrinterDisconnect}
                onPrintTest={handleTestPrint}
                onTestRasterWriteModeChange={handleTestRasterWriteModeChange}
                onPrintWidthChange={handlePrinterWidthChange}
                onRefreshStatus={handleRefreshPrinterStatus}
              />
            ) : null
          }
          onStart={() => setCurrentScreen('guide')}
        />
      )}

      {currentScreen === 'guide' && (
        <GuideScreen
          cameraError={cameraError}
          isConnecting={isConnecting}
          onBack={handleBackToStart}
          onOpenCamera={() => openCamera()}
        />
      )}

      {currentScreen === 'camera' && (
        <CameraScreen
          canSwitchCamera={cameraDeviceCount >= 2}
          capturedPhotos={capturedPhotos}
          captureError={captureError}
          captureStatus={captureStatus}
          cameraNotice={cameraNotice}
          countdown={countdown}
          currentShotIndex={currentShotIndex}
          facingMode={cameraFacingMode}
          isCapturingFrame={isCapturingFrame}
          isFlashVisible={isFlashVisible}
          isSequenceRunning={isSequenceRunning}
          isSwitchingCamera={isSwitchingCamera}
          isVideoReady={isVideoReady}
          nextShotRemaining={nextShotRemaining}
          stream={cameraStream}
          onBack={handleBackToGuide}
          onCancelCapture={() => cancelCaptureSequence()}
          onStartCapture={startCaptureSequence}
          onSwitchCamera={handleSwitchCamera}
          onVideoReadyChange={handleVideoReadyChange}
          videoRef={videoRef}
        />
      )}

      {currentScreen === 'review' && (
        <ReviewScreen
          capturedPhotos={capturedPhotos}
          isReconnectingCamera={isReconnectingCamera}
          selectedPhotoIds={selectedPhotoIds}
          selectionNotice={selectionNotice}
          onCompleteSelection={handleCompleteSelection}
          onRetake={handleRetakeAll}
          onTogglePhoto={handleTogglePhotoSelection}
        />
      )}

      {currentScreen === 'selectionPreview' && (
        <SelectionPreviewScreen
          isReconnectingCamera={isReconnectingCamera}
          selectedPhotos={selectedPhotos}
          onBackToReview={() => setCurrentScreen('review')}
          onDecorateFrame={handleOpenFrame}
          onRetake={handleRetakeAll}
          selectionNotice={selectionNotice}
        />
      )}

      {currentScreen === 'frame' && (
        <FrameCustomizer
          brandHeader={<BrandHeader />}
          frameColor={frameColor}
          finalImageError={finalImageError}
          isRenderingFinalImage={isRenderingFinalImage}
          selectedPhotos={selectedPhotos}
          showDate={showFrameDate}
          onBackToSelection={handleBackToSelectionPreview}
          onCreateFinalImage={handleCreateFinalImage}
          onFrameColorChange={setFrameColor}
          onShowDateChange={setShowFrameDate}
        />
      )}

      {currentScreen === 'result' && (
        <FinalResultScreen
          adminLongPrintProgress={adminLongPrintProgress}
          finalImageUrl={finalImageUrl}
          hasFinalImage={hasFinalImage}
          isDirectPrintReady={isDirectPrintReady}
          isLongDirectPrintEnabled={true}
          isPrinterSetupMode={showPrinterSetupPanel}
          isQrDialogOpen={isQrDialogOpen}
          isShareImageUploaded={isShareImageUploaded}
          isUploadingShareImage={isUploadingShareImage}
          printProgressPercent={printProgressPercent}
          printShareError={printShareError}
          printShareNotice={printShareNotice}
          printerConnectionState={printerConnectionState}
          qrButtonRef={qrButtonRef}
          qrCodeDataUrl={qrCodeDataUrl}
          qrShareError={qrShareError}
          sharedImageExpiresAt={sharedImageExpiresAt}
          sharedImagePageUrl={sharedImagePageUrl}
          showPrinterReconnect={shouldShowPrinterReconnect}
          onAdminLongPrintExperiment={handleAdminLongPrintExperiment}
          onBackToFrame={handleOpenFrame}
          onCloseQrDialog={handleCloseQrDialog}
          onOpenQrShare={handleOpenQrShare}
          onReconnectPrinter={handleReconnectPrinterFromResult}
          onShareForPrint={handleShareForPrint}
          onStartOver={handleBackToStart}
        />
      )}
    </div>
  )
}

export default App
