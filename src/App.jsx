import { useCallback, useEffect, useRef, useState } from 'react'
import oazLogo from './assets/oaz_logo.png'
import './App.css'

const guideItems = [
  {
    title: '네 장 연속 촬영',
    description: '준비가 끝나면 카운트다운 후 사진을 네 번 촬영해요.',
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
          <p className="screen-description">사진 네 장을 연속으로 촬영할 예정이에요.</p>
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

function CameraPreview({ facingMode, isSwitchingCamera, stream }) {
  const videoRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)

  useEffect(() => {
    const videoElement = videoRef.current

    if (!videoElement) {
      return undefined
    }

    setIsVideoReady(false)
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
  }, [stream])

  const handleVideoReady = () => {
    setIsVideoReady(true)

    const videoElement = videoRef.current
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
    </div>
  )
}

function CameraScreen({
  canSwitchCamera,
  cameraNotice,
  facingMode,
  isSwitchingCamera,
  onBack,
  onSwitchCamera,
  stream,
}) {
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
          facingMode={facingMode}
          isSwitchingCamera={isSwitchingCamera}
          stream={stream}
        />

        <div className="camera-stage" aria-live="polite">
          <span className="stage-dot" aria-hidden="true" />
          <span>{cameraNotice || '카메라 연결 완료'}</span>
        </div>

        {canSwitchCamera && (
          <button
            className="button button-secondary camera-switch-button"
            disabled={isSwitchingCamera}
            type="button"
            onClick={onSwitchCamera}
          >
            {isSwitchingCamera ? '카메라 전환 중...' : '카메라 전환'}
          </button>
        )}

        <div className="camera-actions">
          <button className="button button-secondary" type="button" onClick={onBack}>
            돌아가기
          </button>
          <button className="button button-primary button-disabled" disabled type="button">
            촬영 기능 준비 중
          </button>
        </div>
        <p className="helper-text camera-helper">
          다음 단계에서 네 장 연속 촬영을 연결할 예정이에요.
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
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false)
  const streamRef = useRef(null)

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

      if (resetDeviceCount) {
        setCameraDeviceCount(0)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCameraStream({ updateState: false })
    }
  }, [stopCameraStream])

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
    setCameraStream(stream)
    setCameraFacingMode(facingMode)
    setCameraDeviceCount(await getVideoDeviceCount())
  }

  const openCamera = async (facingMode = cameraFacingMode) => {
    if (isConnecting) {
      return
    }

    setIsConnecting(true)
    setCameraError('')
    setCameraNotice('')
    stopCameraStream()

    const supportMessage = getCameraSupportMessage()

    if (supportMessage) {
      setCameraError(supportMessage)
      setIsConnecting(false)
      return
    }

    try {
      const stream = await createCameraStream(facingMode)
      await applyCameraStream(stream, facingMode)
      setCurrentScreen('camera')
    } catch (error) {
      stopCameraStream()
      setCameraError(getCameraErrorMessage(error))
      setCurrentScreen('guide')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleBackToStart = () => {
    stopCameraStream()
    setCameraError('')
    setCameraNotice('')
    setCurrentScreen('start')
  }

  const handleBackToGuide = () => {
    stopCameraStream()
    setCameraError('')
    setCameraNotice('')
    setIsConnecting(false)
    setIsSwitchingCamera(false)
    setCurrentScreen('guide')
  }

  const handleSwitchCamera = async () => {
    if (isSwitchingCamera || isConnecting) {
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
          cameraNotice={cameraNotice}
          facingMode={cameraFacingMode}
          isSwitchingCamera={isSwitchingCamera}
          stream={cameraStream}
          onBack={handleBackToGuide}
          onSwitchCamera={handleSwitchCamera}
        />
      )}
    </div>
  )
}

export default App
