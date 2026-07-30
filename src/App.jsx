import { useState } from 'react'
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
        <p className="brand-name">OAZ_인생네컷</p>
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

function GuideScreen({ onBack }) {
  return (
    <main className="screen guide-screen">
      <section className="guide-content" aria-labelledby="guide-title">
        <div className="guide-heading">
          <p className="brand-name">OAZ_인생네컷</p>
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

        <div className="guide-actions">
          <button className="button button-secondary" type="button" onClick={onBack}>
            돌아가기
          </button>
          <button
            aria-describedby="camera-pending-note"
            className="button button-primary button-disabled"
            disabled
            type="button"
          >
            카메라 기능 준비 중
          </button>
        </div>
        <p className="helper-text guide-helper" id="camera-pending-note">
          다음 단계에서 카메라를 연결할 예정이에요.
        </p>
      </section>
    </main>
  )
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('start')

  return (
    <div className="life4cut-app">
      {currentScreen === 'start' ? (
        <StartScreen onStart={() => setCurrentScreen('guide')} />
      ) : (
        <GuideScreen onBack={() => setCurrentScreen('start')} />
      )}
    </div>
  )
}

export default App
