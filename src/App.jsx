import { useCallback, useEffect, useRef, useState } from 'react'
import oazLogo from './assets/oaz_logo.png'
import './App.css'
import FinalResultScreen from './components/FinalResultScreen'
import FrameCustomizer from './components/FrameCustomizer'
import {
  DEFAULT_FRAME_COLOR,
  DEFAULT_FRAME_INPUT_MESSAGE,
  DEFAULT_SHOW_FRAME_DATE,
  FRAME_MESSAGE_MAX_LENGTH,
  formatLocalFrameDate,
} from './constants/frameOptions'
import { captureFrameFromVideo } from './utils/captureFrame'
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

function createFinalImageFileName(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `OAZ_Life4Cut_${year}${month}${day}_${hours}${minutes}.png`
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

function StartScreen({ onStart }) {
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
          다음 단계에서 프레임 색상과 문구를 선택할 수 있어요.
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
  const [frameMessage, setFrameMessage] = useState(DEFAULT_FRAME_INPUT_MESSAGE)
  const [frameNotice, setFrameNotice] = useState('')
  const [finalImageBlob, setFinalImageBlob] = useState(null)
  const [finalImageUrl, setFinalImageUrl] = useState('')
  const [isRenderingFinalImage, setIsRenderingFinalImage] = useState(false)
  const [finalImageError, setFinalImageError] = useState('')
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
  const capturedPhotosRef = useRef([])
  const finalImageUrlRef = useRef('')
  const captureTimeoutsRef = useRef(new Set())
  const captureSessionRef = useRef(0)
  const selectedPhotos = selectedPhotoIds
    .map((photoId) => capturedPhotos.find((photo) => photo.id === photoId))
    .filter(Boolean)
  const hasCompleteFrameSelection =
    selectedPhotoIds.length === REQUIRED_SELECTION_COUNT &&
    selectedPhotos.length === REQUIRED_SELECTION_COUNT &&
    selectedPhotos.every((photo) => Boolean(photo.url))
  const hasFinalImage = Boolean(finalImageBlob && finalImageUrl)

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

  const clearFinalImage = useCallback((options = {}) => {
    const { clearError = true } = options

    if (finalImageUrlRef.current) {
      URL.revokeObjectURL(finalImageUrlRef.current)
      finalImageUrlRef.current = ''
    }

    setFinalImageBlob(null)
    setFinalImageUrl('')

    if (clearError) {
      setFinalImageError('')
    }
  }, [])

  const resetFrameSettings = useCallback(() => {
    setFrameColor(DEFAULT_FRAME_COLOR)
    setShowFrameDate(DEFAULT_SHOW_FRAME_DATE)
    setFrameMessage(DEFAULT_FRAME_INPUT_MESSAGE)
    setFrameNotice('')
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
    setFrameNotice('')
    setCurrentScreen('frame')
  }

  const handleFrameMessageChange = (nextMessage) => {
    const messageWithoutLineBreaks = nextMessage.replace(/[\r\n]/g, '')

    setFrameMessage(messageWithoutLineBreaks)
    setFrameNotice(
      messageWithoutLineBreaks.length >= FRAME_MESSAGE_MAX_LENGTH
        ? '하단 문구는 최대 24자까지 입력할 수 있어요.'
        : '',
    )
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

    try {
      const pngBlob = await renderFinalStrip({
        photos: selectedPhotos,
        frameColor,
        showDate: showFrameDate,
        frameMessage,
        dateText: formatLocalFrameDate(),
      })
      const pngUrl = URL.createObjectURL(pngBlob)

      finalImageUrlRef.current = pngUrl
      setFinalImageBlob(pngBlob)
      setFinalImageUrl(pngUrl)
      setCurrentScreen('result')
    } catch {
      clearFinalImage({ clearError: false })
      setFinalImageError(FINAL_IMAGE_ERROR_MESSAGE)
    } finally {
      setIsRenderingFinalImage(false)
    }
  }

  const handleDownloadFinalImage = () => {
    if (!finalImageUrl) {
      return
    }

    const downloadLink = document.createElement('a')
    downloadLink.href = finalImageUrl
    downloadLink.download = createFinalImageFileName()
    document.body.append(downloadLink)
    downloadLink.click()
    downloadLink.remove()
  }

  const handleBackToFrameFromResult = () => {
    clearFinalImage()
    setCurrentScreen('frame')
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
      {currentScreen === 'start' && <StartScreen onStart={() => setCurrentScreen('guide')} />}

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
          frameMessage={frameMessage}
          frameNotice={frameNotice}
          finalImageError={finalImageError}
          isRenderingFinalImage={isRenderingFinalImage}
          maxMessageLength={FRAME_MESSAGE_MAX_LENGTH}
          selectedPhotos={selectedPhotos}
          showDate={showFrameDate}
          onBackToSelection={handleBackToSelectionPreview}
          onCreateFinalImage={handleCreateFinalImage}
          onFrameColorChange={setFrameColor}
          onFrameMessageChange={handleFrameMessageChange}
          onShowDateChange={setShowFrameDate}
        />
      )}

      {currentScreen === 'result' && (
        <FinalResultScreen
          brandHeader={<BrandHeader />}
          finalImageUrl={finalImageUrl}
          hasFinalImage={hasFinalImage}
          onBackToFrame={handleBackToFrameFromResult}
          onDownload={handleDownloadFinalImage}
          onStartOver={handleBackToStart}
        />
      )}
    </div>
  )
}

export default App
