import { useEffect, useRef } from 'react'

function formatExpiresAt(expiresAt) {
  const date = new Date(expiresAt)

  if (Number.isNaN(date.getTime())) {
    return '24시간 동안 제공돼요.'
  }

  return `${date.toLocaleString('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })}까지 제공돼요.`
}

function QrDownloadDialog({
  expiresAt,
  isOpen,
  qrCodeDataUrl,
  onClose,
}) {
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const dialog = dialogRef.current

    if (!dialog) {
      return undefined
    }

    if (typeof dialog.showModal === 'function' && !dialog.open) {
      dialog.showModal()
    } else if (!dialog.open) {
      dialog.setAttribute('open', '')
    }

    closeButtonRef.current?.focus()

    return () => {
      if (dialog.open) {
        dialog.close()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <dialog
      aria-describedby="qr-dialog-description"
      aria-labelledby="qr-dialog-title"
      aria-modal="true"
      className="qr-dialog"
      ref={dialogRef}
      role="dialog"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="qr-dialog-content">
        <div className="qr-dialog-copy">
          <h2 id="qr-dialog-title">휴대폰으로 QR을 촬영해 주세요</h2>
          <p id="qr-dialog-description">
            휴대폰에서 사진을 확인하고 저장할 수 있어요.
          </p>
        </div>

        <div className="qr-image-card">
          <img
            className="qr-code-image"
            src={qrCodeDataUrl}
            alt="완성된 네컷 다운로드 QR 코드"
          />
        </div>

        <p className="qr-expiration-text">{formatExpiresAt(expiresAt)}</p>

        <button
          className="button button-primary"
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </dialog>
  )
}

export default QrDownloadDialog
