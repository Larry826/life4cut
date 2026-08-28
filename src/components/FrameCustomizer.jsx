import {
  FRAME_BRAND_MESSAGE,
  FRAME_OPTIONS,
  formatLocalFrameDate,
  getFrameOption,
} from '../constants/frameOptions'

const cutOrderLabels = ['첫 번째', '두 번째', '세 번째', '네 번째']
const oazSideLabels = ['OAZ', '하나와영', 'HANAWAYOUNG', '']

function PhotoStripPreview({ frameColor, selectedPhotos, showDate }) {
  const frameOption = getFrameOption(frameColor)
  const formattedDate = formatLocalFrameDate()
  const isOazFrame = frameOption.id === 'oaz'

  return (
    <figure
      className={`frame-strip frame-strip-${frameOption.id}`}
      style={{
        '--frame-background': frameOption.background,
        '--frame-border': frameOption.border,
        '--frame-foreground': frameOption.foreground,
        '--frame-accent': frameOption.accent,
        '--frame-soft-accent': frameOption.softAccent,
      }}
      aria-label={`${frameOption.label} 프레임으로 꾸민 세로 네컷 미리보기`}
    >
      <div className="frame-strip-topbar" aria-hidden="true">
        <span className="frame-strip-qr-preview" />
      </div>
      <div className="frame-strip-photos">
        {selectedPhotos.map((photo, index) => {
          const sideLabel = isOazFrame ? oazSideLabels[index] : ''

          return (
            <div
              className={`frame-strip-photo-cell ${
                sideLabel ? 'frame-strip-photo-cell-labeled' : ''
              }`}
              key={photo.id}
            >
              {sideLabel && (
                <span
                  className="frame-strip-side-text frame-strip-side-text-left"
                  aria-hidden="true"
                >
                  {sideLabel}
                </span>
              )}
              <img
                className="frame-strip-photo"
                src={photo.url}
                alt={`최종 네컷의 ${cutOrderLabels[index]} 사진`}
              />
              {sideLabel && (
                <span
                  className="frame-strip-side-text frame-strip-side-text-right"
                  aria-hidden="true"
                >
                  {sideLabel}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <figcaption className="frame-strip-footer">
        <p className="frame-strip-message" title={FRAME_BRAND_MESSAGE}>
          {FRAME_BRAND_MESSAGE}
        </p>
        {showDate && <p className="frame-strip-date">{formattedDate}</p>}
      </figcaption>
    </figure>
  )
}

function FrameColorSelector({ frameColor, onFrameColorChange }) {
  return (
    <div className="frame-color-options" role="group" aria-label="프레임 색상">
      {FRAME_OPTIONS.map((option) => {
        const isSelected = option.id === frameColor

        return (
          <button
            className={`frame-color-button frame-color-button-${option.id} ${
              isSelected ? 'frame-color-button-selected' : ''
            }`}
            style={{
              '--option-background': option.background,
              '--option-border': option.border,
              '--option-foreground': option.foreground,
            }}
            aria-pressed={isSelected}
            type="button"
            key={option.id}
            onClick={() => onFrameColorChange(option.id)}
          >
            <span
              className={`frame-color-swatch frame-color-swatch-${option.id}`}
              aria-hidden="true"
            />
            <span className="frame-color-label">{option.label}</span>
            <span className="frame-color-selected-text">
              {isSelected ? '선택됨' : '선택'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FrameCustomizer({
  brandHeader,
  frameColor,
  finalImageError,
  isRenderingFinalImage,
  onBackToSelection,
  onCreateFinalImage,
  onFrameColorChange,
  onShowDateChange,
  selectedPhotos,
  showDate,
}) {
  const hasValidPhotos =
    selectedPhotos.length === 4 && selectedPhotos.every((photo) => photo?.id && photo?.url)

  if (!hasValidPhotos) {
    return (
      <main className="screen frame-screen">
        <section className="frame-content frame-empty-state" aria-labelledby="frame-title">
          <div className="frame-heading">
            {brandHeader}
            <h1 id="frame-title">프레임을 꾸며 주세요</h1>
          </div>
          <div className="frame-data-alert" role="alert">
            <p>
              선택한 사진 정보를 확인하지 못했어요.
              <br />
              사진을 다시 선택해 주세요.
            </p>
            <button className="button button-secondary" type="button" onClick={onBackToSelection}>
              사진 선택으로 돌아가기
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="screen frame-screen">
      <section className="frame-content" aria-labelledby="frame-title">
        <div className="frame-heading">
          {brandHeader}
          <h1 id="frame-title">프레임을 꾸며 주세요</h1>
          <p className="screen-description">
            선택한 네 장에 어울리는 색상과 날짜 표시를 골라 보세요.
          </p>
        </div>

        <div className="frame-layout">
          <div className="frame-preview-area" aria-label="프레임 미리보기 영역">
            <PhotoStripPreview
              frameColor={frameColor}
              selectedPhotos={selectedPhotos}
              showDate={showDate}
            />
          </div>

          <aside className="frame-settings-panel" aria-labelledby="frame-settings-title">
            <h2 id="frame-settings-title">프레임 설정</h2>

            <div className="frame-setting-group">
              <h3>프레임 색상</h3>
              <FrameColorSelector
                frameColor={frameColor}
                onFrameColorChange={onFrameColorChange}
              />
            </div>

            <div className="frame-setting-group">
              <label className="frame-toggle">
                <input
                  checked={showDate}
                  className="frame-toggle-input"
                  type="checkbox"
                  onChange={(event) => onShowDateChange(event.target.checked)}
                />
                <span className="frame-toggle-copy">
                  <strong>촬영 날짜 표시</strong>
                  <span>프레임 아래에 오늘 날짜를 표시해요.</span>
                </span>
              </label>
            </div>

            {finalImageError && (
              <div className="frame-render-alert" role="alert">
                <p>{finalImageError}</p>
              </div>
            )}

            <div className="frame-actions">
              <button className="button button-secondary" type="button" onClick={onBackToSelection}>
                사진 선택으로 돌아가기
              </button>
              <button
                className="button button-primary"
                disabled={isRenderingFinalImage}
                type="button"
                onClick={onCreateFinalImage}
              >
                {isRenderingFinalImage ? '이미지 만드는 중...' : '최종 이미지 만들기'}
              </button>
            </div>
            <p className="sr-only" aria-live="polite">
              {isRenderingFinalImage ? '완성 이미지를 만들고 있습니다.' : ''}
            </p>
            <p className="helper-text frame-helper">
              다음 단계에서 완성된 네컷 이미지를 저장할 수 있어요.
            </p>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default FrameCustomizer
