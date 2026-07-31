function FinalResultScreen({
  finalImageUrl,
  hasFinalImage,
  onBackToFrame,
  onDownload,
  onStartOver,
}) {
  return (
    <main className="screen result-screen">
      <section className="result-content" aria-labelledby="result-title">
        <div className="result-main-layout">
          <div className="result-copy-panel">
            <p className="result-brand-label">OAZ_인생네컷</p>
            <h1 id="result-title">
              네컷 이미지가
              <br />
              완성됐어요
            </h1>
            <p className="screen-description">
              완성된 네컷을 확인해 주세요.
              <br />
              인쇄하거나 프레임을 다시 수정할 수 있어요.
            </p>
          </div>

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

        <div className="result-action-panel">
          <div className="result-primary-actions">
            <button
              aria-describedby="print-feature-note"
              className="button button-primary"
              disabled
              type="button"
            >
              인쇄하기
            </button>
            <button className="button button-secondary" type="button" onClick={onBackToFrame}>
              프레임 다시 꾸미기
            </button>
            <button className="button button-secondary" type="button" onClick={onStartOver}>
              처음부터 다시 촬영
            </button>
          </div>

          <p className="helper-text result-print-note" id="print-feature-note">
            프린터 연결과 QR 다운로드 기능은 다음 단계에서 추가할 예정이에요.
          </p>

          <button
            className="button button-secondary result-download-button"
            disabled={!hasFinalImage}
            type="button"
            onClick={onDownload}
          >
            PNG 파일로 저장
          </button>
          <p className="helper-text result-helper">
            모바일 브라우저에서는 이미지가 새 화면에 열리면 이미지를 길게 눌러 저장해
            주세요.
          </p>
        </div>
      </section>
    </main>
  )
}

export default FinalResultScreen
