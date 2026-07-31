import QrDownloadDialog from './QrDownloadDialog'

function FinalResultScreen({
  finalImageUrl,
  hasFinalImage,
  isQrDialogOpen,
  isUploadingShareImage,
  qrButtonRef,
  qrCodeDataUrl,
  qrShareError,
  sharedImageExpiresAt,
  sharedImagePageUrl,
  onCloseQrDialog,
  onOpenQrShare,
  onStartOver,
}) {
  const canOpenQrShare = hasFinalImage && !isUploadingShareImage
  const hasQrDialogData = Boolean(qrCodeDataUrl && sharedImagePageUrl)

  return (
    <main className="screen result-page">
      <section className="result-screen" aria-labelledby="result-title">
        <div className="result-layout">
          <aside className="result-control-panel">
            <p className="result-brand-label">OAZ_인생네컷</p>
            <h1 id="result-title">네컷 이미지가 완성됐어요</h1>
            <p className="screen-description">완성된 네컷을 확인해 주세요.</p>

            <div className="result-primary-actions">
              <button
                className="button button-primary"
                disabled={!canOpenQrShare}
                ref={qrButtonRef}
                type="button"
                onClick={onOpenQrShare}
              >
                {isUploadingShareImage ? 'QR 준비 중...' : 'QR 출력하기'}
              </button>
              <button
                aria-describedby="print-feature-note"
                className="button button-secondary"
                disabled
                type="button"
              >
                인쇄하기
              </button>
              <button className="button button-secondary" type="button" onClick={onStartOver}>
                처음으로 돌아가기
              </button>
            </div>

            <p className="helper-text result-privacy-note">
              QR 기능을 사용하면 완성 이미지가 다운로드를 위해
              <br />
              서버에 24시간 동안 임시 저장돼요.
            </p>

            <p className="helper-text result-print-note" id="print-feature-note">
              프린터 연결 후 사용할 수 있어요.
            </p>

            <div className="qr-status-area" aria-live="polite">
              {isUploadingShareImage && <p>서버에 이미지를 임시 저장하고 있어요.</p>}
              {!isUploadingShareImage && sharedImagePageUrl && (
                <p>QR 다운로드 페이지가 준비됐어요.</p>
              )}
            </div>

            {qrShareError && (
              <div className="qr-share-alert" role="alert">
                <p>{qrShareError}</p>
              </div>
            )}

            {hasQrDialogData && (
              <QrDownloadDialog
                expiresAt={sharedImageExpiresAt}
                isOpen={isQrDialogOpen}
                qrCodeDataUrl={qrCodeDataUrl}
                onClose={onCloseQrDialog}
              />
            )}
          </aside>

          <div className="result-image-panel" aria-label="완성된 네컷 이미지 미리보기">
            {hasFinalImage ? (
              <img
                className="final-preview-image"
                src={finalImageUrl}
                alt="완성된 OAZ 네컷 이미지"
              />
            ) : (
              <div className="result-empty" role="alert">
                <p>완성 이미지를 확인하지 못했어요.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default FinalResultScreen
