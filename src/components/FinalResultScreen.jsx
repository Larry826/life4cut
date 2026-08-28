import QrDownloadDialog from './QrDownloadDialog'

function FinalResultScreen({
  adminLongPrintProgress,
  finalImageUrl,
  hasFinalImage,
  isDirectPrintReady,
  isLongDirectPrintEnabled,
  isPrinterSetupMode,
  isQrDialogOpen,
  isUploadingShareImage,
  printProgressPercent,
  printShareError,
  printShareNotice,
  printerConnectionState,
  qrButtonRef,
  qrCodeDataUrl,
  qrShareError,
  sharedImageExpiresAt,
  sharedImagePageUrl,
  showPrinterReconnect,
  onAdminLongPrintExperiment,
  onBackToFrame,
  onCloseQrDialog,
  onOpenQrShare,
  onReconnectPrinter,
  onShareForPrint,
  onStartOver,
}) {
  const canOpenQrShare = hasFinalImage && !isUploadingShareImage
  const isPrintingDirectly = printerConnectionState === 'printing'
  const isPrinterConnecting = printerConnectionState === 'connecting'
  const isPrinterBusy = isPrintingDirectly || isPrinterConnecting
  const canShareForPrint = hasFinalImage && !isPrinterBusy
  const canEditFrame = Boolean(hasFinalImage && !isPrinterBusy && onBackToFrame)
  const canReconnectPrinter =
    Boolean(showPrinterReconnect && hasFinalImage && !isPrinterBusy && onReconnectPrinter)
  const canAdminLongPrint = isPrinterSetupMode && hasFinalImage && !isPrinterBusy
  const adminProgressPercent = Number.isFinite(adminLongPrintProgress?.percent)
    ? adminLongPrintProgress.percent
    : printProgressPercent
  const printButtonLabel =
    isPrintingDirectly && Number.isFinite(printProgressPercent)
      ? `인쇄 중... ${printProgressPercent}%`
      : isPrintingDirectly
        ? '인쇄 중...'
        : isPrinterConnecting
          ? '프린터 연결 중...'
        : '인쇄하기'
  const hasQrDialogData = Boolean(qrCodeDataUrl && sharedImagePageUrl)
  const adminProgressLabel =
    adminLongPrintProgress &&
    Number.isFinite(adminLongPrintProgress.completedBytes) &&
    Number.isFinite(adminLongPrintProgress.totalBytes)
      ? `${adminLongPrintProgress.completedBytes} / ${adminLongPrintProgress.totalBytes} bytes, ${adminLongPrintProgress.completedPackets ?? 0} / ${adminLongPrintProgress.totalPackets ?? 0} packets, ${adminLongPrintProgress.percent ?? 0}%`
      : ''
  const hasAdminLongPrintProgress =
    isPrinterSetupMode && adminProgressLabel && Number.isFinite(adminProgressPercent)
  const printButtonDescription = [
    'print-feature-note',
    'print-feature-detail',
    printShareNotice ? 'print-share-notice' : '',
    printShareError ? 'print-share-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
                {isUploadingShareImage ? 'QR 준비 중...' : 'QR로 다운로드'}
              </button>
              <button
                aria-describedby={printButtonDescription}
                className="button button-secondary"
                disabled={!canShareForPrint}
                type="button"
                onClick={onShareForPrint}
              >
                {printButtonLabel}
              </button>
            </div>

            <div className="result-secondary-actions">
              <button
                className="button button-secondary result-edit-frame-button"
                disabled={!canEditFrame}
                type="button"
                onClick={onBackToFrame}
              >
                프레임 다시 선택하기
              </button>
              <button className="result-start-over-button" type="button" onClick={onStartOver}>
                처음부터 다시 촬영
              </button>
            </div>

            <p className="helper-text result-privacy-note">
              QR 기능을 사용하면 완성 이미지가 다운로드를 위해
              <br />
              서버에 24시간 동안 임시 저장돼요.
            </p>

            <div className="helper-text result-print-note">
              {!isLongDirectPrintEnabled ? (
                <>
                  <p id="print-feature-note">
                    직접 인쇄 프로토콜을 확인 중이에요.
                  </p>
                  <p className="result-print-detail" id="print-feature-detail">
                    QR 다운로드는 계속 사용할 수 있어요.
                  </p>
                </>
              ) : isDirectPrintReady ? (
                <>
                  <p id="print-feature-note">
                    인쇄하기를 누르면 설정된 Bluetooth 프린터로 바로 전송돼요.
                  </p>
                  <p className="result-print-detail" id="print-feature-detail">
                    연결이 끊기면 프린터 다시 연결 버튼으로 다시 선택해 주세요.
                  </p>
                </>
              ) : (
                <>
                  <p id="print-feature-note">
                    {showPrinterReconnect ? '프린터 연결이 필요해요.' : '직접 인쇄가 준비되지 않았어요.'}
                  </p>
                  <p className="result-print-detail" id="print-feature-detail">
                    {showPrinterReconnect
                      ? '프린터 다시 연결을 눌러 선택해 주세요. 계속 안 되면 관리자에게 알려 주세요.'
                      : '관리자에게 프린터 연결 상태를 확인해 달라고 요청해 주세요.'}
                  </p>
                </>
              )}
            </div>

            {showPrinterReconnect && (
              <div className="printer-reconnect-card" aria-live="polite">
                <p>프린터 연결이 필요해요.</p>
                <button
                  className="button button-secondary"
                  disabled={!canReconnectPrinter}
                  type="button"
                  onClick={onReconnectPrinter}
                >
                  {isPrinterConnecting ? '프린터 연결 중...' : '프린터 다시 연결'}
                </button>
              </div>
            )}

            {isPrinterSetupMode && (
              <div className="admin-long-print-experiment" aria-live="polite">
                <p className="admin-long-print-title">관리자 long-print 실험</p>
                <p className="result-print-detail">
                  20B with-response raster, FF03 credit, stop ACK로 완성 네컷을 전송해요.
                </p>
                <button
                  className="button button-secondary"
                  disabled={!canAdminLongPrint}
                  type="button"
                  onClick={onAdminLongPrintExperiment}
                >
                  {isPrintingDirectly && Number.isFinite(adminProgressPercent)
                    ? `관리자 네컷 인쇄 중... ${adminProgressPercent}%`
                    : '관리자 네컷 long-print 실험'}
                </button>
                {hasAdminLongPrintProgress && (
                  <div className="admin-long-print-progress">
                    <progress max="100" value={adminProgressPercent}>
                      {adminProgressPercent}%
                    </progress>
                    {adminProgressLabel && <small>{adminProgressLabel}</small>}
                  </div>
                )}
              </div>
            )}

            {printShareNotice && (
              <div
                className="print-share-alert print-share-alert-info"
                id="print-share-notice"
                role="status"
                aria-live="polite"
              >
                <p>{printShareNotice}</p>
              </div>
            )}

            {printShareError && (
              <div className="print-share-alert" id="print-share-error" role="alert">
                <p>{printShareError}</p>
              </div>
            )}

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
