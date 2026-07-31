# Printing and QR download plan

## 현재 구현된 QR 다운로드 흐름

1. 사용자가 결과 화면에서 `QR 출력하기`를 누른다.
2. 브라우저가 완성 이미지 Blob을 QR 공유용 Blob으로 준비한다.
3. QR 공유용 이미지가 4MB를 넘으면 같은 비율을 유지한 채 JPEG로 압축한다.
4. 프론트엔드는 `/api/final-images`에 이미지를 업로드한다.
5. Netlify Function이 이미지를 Netlify Blobs에 24시간 만료 metadata와 함께 저장한다.
6. 서버가 `/download/{id}` 형태의 휴대폰 다운로드 페이지 URL을 반환한다.
7. 프론트엔드는 다운로드 페이지 URL로 QR 이미지를 생성한다.
8. QR 팝업에서 휴대폰으로 스캔할 수 있는 QR을 보여준다.

이미지는 사용자가 `QR 출력하기`를 누른 뒤에만 서버에 업로드한다. 결과 화면 진입만으로는 업로드하지 않는다.

## Netlify Functions와 Blobs

임시 저장소는 Netlify Blobs를 사용한다.

- Store 이름: `life4cut-final-images`
- Blob key: `crypto.randomUUID()`로 만든 예측하기 어려운 id
- Metadata:
  - `contentType`
  - `filename`
  - `createdAt`
  - `expiresAt`
- 만료 시간: 업로드 시점부터 24시간

비밀키, Netlify 토큰, Site ID는 코드나 Git에 저장하지 않는다.

## API 경로

### 업로드 API

- Function: `netlify/functions/upload-final-image.mjs`
- Path: `/api/final-images`
- Method: `POST`
- Body: `image/png` 또는 `image/jpeg`
- 최대 요청 크기: 약 4.2MB
- code-based rate limit: IP와 domain 기준 60초에 12회
- 성공 응답:

```json
{
  "id": "uuid",
  "pageUrl": "https://example.netlify.app/download/uuid",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### 이미지 제공 API

- Function: `netlify/functions/get-final-image.mjs`
- Path: `/api/final-images/:id`
- Method: `GET`
- 일반 보기: `/api/final-images/{id}`
- 다운로드: `/api/final-images/{id}?download=1`

만료된 이미지는 요청 시 즉시 삭제하고 `410`을 반환한다.

### 휴대폰 다운로드 페이지

- Function: `netlify/functions/download-final-image.mjs`
- Path: `/download/:id`
- Method: `GET`

React 앱을 다시 실행하지 않고, Function이 독립적인 HTML 페이지를 반환한다. 페이지에는 이미지 미리보기, `이미지 저장하기` 버튼, 24시간 만료 안내, 길게 눌러 저장 안내가 포함된다.

## QR 생성

QR은 이미지 Blob URL이나 Vite 로컬 URL이 아니라 서버가 반환한 다운로드 페이지 URL을 포함한다.

프론트엔드에서는 `qrcode` 패키지의 `QRCode.toDataURL()`을 사용한다.

```js
QRCode.toDataURL(pageUrl, {
  errorCorrectionLevel: 'M',
  width: 320,
  margin: 4,
  color: {
    dark: '#211822',
    light: '#ffffff',
  },
})
```

## QR 공유용 이미지 압축

기존 고해상도 PNG 생성 로직은 `src/utils/renderFinalStrip.js`에 유지한다. 이 PNG는 최종 이미지의 원본 데이터로 계속 사용한다.

서버 업로드 한도에 안전하게 맞추기 위해 QR 공유용 Blob은 별도 유틸에서 만든다.

- Utility: `src/utils/createShareImageBlob.js`
- 4MB 이하 PNG/JPEG는 그대로 사용
- 4MB를 넘으면 같은 비율로 Canvas에 다시 그리고 JPEG로 압축
- 필요한 경우 폭을 900px, 820px, 720px 순서로 줄여 시도
- 이미지 비율은 변경하지 않음

따라서 QR 다운로드용 이미지는 JPEG가 될 수 있지만, 최종 합성 PNG 생성 로직 자체는 변경하지 않는다.

## 만료 이미지 정리

- Function: `netlify/functions/cleanup-expired-images.mjs`
- Schedule: `@hourly`

정리 함수는 `life4cut-final-images` store를 순회하면서 metadata의 `expiresAt`이 지난 Blob만 삭제한다. 특정 항목 조회에 실패해도 다른 항목 정리는 계속한다.

다운로드와 이미지 제공 Function도 요청된 이미지가 만료됐으면 즉시 삭제한다.

## 개인정보 정책

서버에 저장되는 이미지는 개인 사진일 수 있으므로 다음 원칙을 유지한다.

- 사용자가 직접 QR 출력을 누른 경우에만 업로드
- 이미지 목록 조회 화면 제공 안 함
- 추측하기 어려운 UUID URL 사용
- 24시간 후 자동 삭제
- URL을 아는 사용자만 접근 가능

## 인쇄 기능 상태

`인쇄하기` 버튼은 결과 화면에 표시되지만 현재 disabled 상태다. 실제 프린터 연결은 아직 구현하지 않는다.

프린터 모델이 결정되면 다음 정보가 필요하다.

- 제조사와 정확한 모델명
- 태블릿 운영체제와 브라우저
- 연결 방식: Bluetooth, USB, Wi-Fi, 제조사 앱 또는 SDK
- 용지 폭과 해상도
- 컬러/흑백 지원 여부
- 자동 절단 지원 여부
- Web Bluetooth 또는 Web Serial 사용 가능 여부

인쇄 단계에서는 QR을 포함한 별도 print 전용 이미지를 만들지, 현재 완성 이미지를 그대로 출력할지 결정해야 한다.
