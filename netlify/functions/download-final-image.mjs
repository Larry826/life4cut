import { getStore } from '@netlify/blobs'

const STORE_NAME = 'life4cut-final-images'
const IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createHtmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getImageId(request, context) {
  const contextId = context?.params?.id

  if (typeof contextId === 'string') {
    return contextId
  }

  const pathParts = new URL(request.url).pathname.split('/').filter(Boolean)

  return pathParts[pathParts.length - 1] ?? ''
}

function isExpired(expiresAt) {
  const expiresTime = Date.parse(expiresAt)

  return !Number.isFinite(expiresTime) || expiresTime <= Date.now()
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeFilename(filename) {
  const safeFilename =
    typeof filename === 'string'
      ? filename.replace(/[\r\n"\\/]/g, '').replace(/[^\w.-]/g, '_')
      : ''

  return safeFilename ? safeFilename.slice(0, 120) : 'OAZ_Life4Cut.png'
}

function createErrorPage(title, message) {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OAZ_인생네컷</title>
    <style>
      body {
        margin: 0;
        min-width: 320px;
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        box-sizing: border-box;
        color: #211822;
        background: #fff9fc;
        font: 16px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(100%, 440px);
        padding: 28px;
        border: 1px solid #eadfea;
        border-radius: 14px;
        background: #ffffff;
        box-shadow: 0 18px 38px rgba(76, 47, 88, 0.1);
      }

      p {
        color: #6f6470;
      }
    </style>
  </head>
  <body>
    <main>
      <p>OAZ_인생네컷</p>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`
}

function createDownloadPage(id, filename) {
  const imageSrc = `/api/final-images/${id}`
  const downloadHref = `/api/final-images/${id}?download=1`
  const safeFilename = escapeAttribute(sanitizeFilename(filename))

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OAZ_인생네컷 다운로드</title>
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-width: 320px;
        min-height: 100dvh;
        color: #211822;
        background:
          radial-gradient(circle at 90% 10%, #fff0f7 0%, transparent 32%),
          linear-gradient(135deg, #ffffff, #fff9fc 58%, #fbf7ff);
        font: 16px/1.6 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      main {
        width: min(100%, 520px);
        margin: 0 auto;
        padding: 28px 18px 40px;
      }

      .brand {
        display: inline-flex;
        min-height: 34px;
        align-items: center;
        padding: 7px 12px;
        border: 1px solid #f4d4e6;
        border-radius: 999px;
        color: #7c3561;
        background: #fff0f7;
        font-weight: 800;
      }

      h1 {
        margin: 20px 0 0;
        font-size: 2rem;
        line-height: 1.16;
      }

      p {
        margin: 12px 0 0;
        color: #6f6470;
      }

      img {
        display: block;
        width: 100%;
        height: auto;
        margin: 24px 0 18px;
        border: 1px solid #eadfea;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 38px rgba(76, 47, 88, 0.12);
      }

      a {
        display: inline-flex;
        width: 100%;
        min-height: 56px;
        align-items: center;
        justify-content: center;
        padding: 14px 18px;
        border-radius: 8px;
        color: #ffffff;
        background: linear-gradient(135deg, #ed5ba7, #7c4d9e);
        font-weight: 900;
        text-decoration: none;
      }

      .note {
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="brand">OAZ_인생네컷</p>
      <h1>네컷 이미지가 준비됐어요</h1>
      <p>아래 이미지를 확인하고 저장해 주세요.</p>
      <img src="${imageSrc}" alt="완성된 OAZ 네컷 이미지">
      <a href="${downloadHref}" download="${safeFilename}">이미지 저장하기</a>
      <p class="note">이 이미지는 생성 후 24시간 동안만 제공돼요.</p>
      <p class="note">저장 버튼이 동작하지 않으면 이미지를 길게 눌러 저장해 주세요.</p>
    </main>
  </body>
</html>`
}

export default async function downloadFinalImagePage(request, context) {
  if (request.method !== 'GET') {
    return createHtmlResponse(
      createErrorPage('페이지를 열 수 없어요', '올바른 접근 방식으로 다시 시도해 주세요.'),
      405,
    )
  }

  const id = getImageId(request, context)

  if (!IMAGE_ID_PATTERN.test(id)) {
    return createHtmlResponse(
      createErrorPage('이미지를 찾지 못했어요', 'QR 주소를 다시 확인해 주세요.'),
      404,
    )
  }

  try {
    const store = getStore(STORE_NAME)
    const entry = await store.getMetadata(id)

    if (!entry) {
      return createHtmlResponse(
        createErrorPage('이미지를 찾지 못했어요', '이미지가 만료됐거나 삭제됐어요.'),
        404,
      )
    }

    if (isExpired(entry.metadata?.expiresAt)) {
      await store.delete(id)
      return createHtmlResponse(
        createErrorPage('제공 시간이 지났어요', '이 이미지는 생성 후 24시간 동안만 제공돼요.'),
        410,
      )
    }

    return createHtmlResponse(createDownloadPage(id, entry.metadata?.filename))
  } catch {
    return createHtmlResponse(
      createErrorPage('페이지를 열지 못했어요', '잠시 후 다시 시도해 주세요.'),
      500,
    )
  }
}

export const config = {
  path: '/download/:id',
  method: 'GET',
}
