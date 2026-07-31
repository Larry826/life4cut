const DEFAULT_FRAME_MESSAGE = 'OAZ LIFE4CUT'

const FRAME_OPTIONS = [
  {
    id: 'white',
    label: '화이트',
    background: '#ffffff',
    foreground: '#211822',
    border: '#e7dfe8',
  },
  {
    id: 'black',
    label: '블랙',
    background: '#18141a',
    foreground: '#ffffff',
    border: '#342b36',
  },
  {
    id: 'purple',
    label: '퍼플',
    background: '#76518f',
    foreground: '#ffffff',
    border: '#5b3970',
  },
  {
    id: 'pink',
    label: '핑크',
    background: '#f3a6cb',
    foreground: '#3b2330',
    border: '#db79ad',
  },
]

const cutOrderLabels = ['첫 번째', '두 번째', '세 번째', '네 번째']

function formatLocalFrameDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

function getFrameOption(frameColor) {
  return FRAME_OPTIONS.find((option) => option.id === frameColor) ?? FRAME_OPTIONS[0]
}

function PhotoStripPreview({ frameColor, frameMessage, selectedPhotos, showDate }) {
  const frameOption = getFrameOption(frameColor)
  const trimmedMessage = frameMessage.trim()
  const hasCustomMessage = trimmedMessage.length > 0
  const previewMessage = hasCustomMessage ? trimmedMessage : DEFAULT_FRAME_MESSAGE
  const formattedDate = formatLocalFrameDate()

  return (
    <figure
      className="frame-strip"
      style={{
        '--frame-background': frameOption.background,
        '--frame-border': frameOption.border,
        '--frame-foreground': frameOption.foreground,
      }}
      aria-label={`${frameOption.label} 프레임으로 꾸민 세로 네컷 미리보기`}
    >
      <div className="frame-strip-photos">
        {selectedPhotos.map((photo, index) => (
          <img
            className="frame-strip-photo"
            src={photo.url}
            alt={`최종 네컷의 ${cutOrderLabels[index]} 사진`}
            key={photo.id}
          />
        ))}
      </div>
      <figcaption className="frame-strip-footer">
        <p className="frame-strip-message" title={previewMessage}>
          {previewMessage}
        </p>
        {hasCustomMessage && <p className="frame-strip-brand">OAZ LIFE4CUT</p>}
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
            className={`frame-color-button ${isSelected ? 'frame-color-button-selected' : ''}`}
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
            <span className="frame-color-swatch" aria-hidden="true" />
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
  frameMessage,
  frameNotice,
  maxMessageLength,
  onBackToSelection,
  onFrameColorChange,
  onFrameMessageChange,
  onShowDateChange,
  selectedPhotos,
  showDate,
}) {
  const hasValidPhotos =
    selectedPhotos.length === 4 && selectedPhotos.every((photo) => photo?.id && photo?.url)
  const messageCountId = 'frame-message-count'
  const messageNoticeId = 'frame-message-notice'

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
            선택한 네 장에 어울리는 색상과 문구를 골라 보세요.
          </p>
        </div>

        <div className="frame-layout">
          <div className="frame-preview-area" aria-label="프레임 미리보기 영역">
            <PhotoStripPreview
              frameColor={frameColor}
              frameMessage={frameMessage}
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

            <div className="frame-setting-group">
              <label className="frame-field-label" htmlFor="frame-message-input">
                하단 문구
              </label>
              <input
                aria-describedby={`${messageCountId}${frameNotice ? ` ${messageNoticeId}` : ''}`}
                className="frame-message-input"
                id="frame-message-input"
                maxLength={maxMessageLength}
                placeholder="우리의 오늘을 기억해"
                type="text"
                value={frameMessage}
                onChange={(event) => onFrameMessageChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                  }
                }}
              />
              <p className="frame-message-count" id={messageCountId}>
                {frameMessage.length} / {maxMessageLength}
              </p>
              {frameNotice && (
                <p className="frame-field-notice" id={messageNoticeId}>
                  {frameNotice}
                </p>
              )}
            </div>

            <div className="frame-actions">
              <button className="button button-secondary" type="button" onClick={onBackToSelection}>
                사진 선택으로 돌아가기
              </button>
              <button className="button button-primary button-disabled" disabled type="button">
                최종 이미지 만들기 준비 중
              </button>
            </div>
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
