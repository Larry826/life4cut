import { getStore } from '@netlify/blobs'

const STORE_NAME = 'life4cut-final-images'
const IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg'])

function createJsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
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

function sanitizeFilename(filename, contentType) {
  const fallbackExtension = contentType === 'image/jpeg' ? 'jpg' : 'png'
  const fallback = `OAZ_Life4Cut.${fallbackExtension}`
  const safeFilename =
    typeof filename === 'string'
      ? filename.replace(/[\r\n"\\/]/g, '').replace(/[^\w.-]/g, '_')
      : ''

  if (!safeFilename) {
    return fallback
  }

  return safeFilename.slice(0, 120)
}

function createContentDisposition(dispositionType, metadata) {
  const contentType = metadata?.contentType
  const filename = sanitizeFilename(metadata?.filename, contentType)

  return `${dispositionType}; filename="${filename}"`
}

export default async function getFinalImage(request, context) {
  if (request.method !== 'GET') {
    return createJsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const id = getImageId(request, context)

  if (!IMAGE_ID_PATTERN.test(id)) {
    return createJsonResponse({ error: 'not_found' }, 404)
  }

  try {
    const store = getStore(STORE_NAME)
    const entry = await store.getWithMetadata(id, { type: 'arrayBuffer' })

    if (!entry) {
      return createJsonResponse({ error: 'not_found' }, 404)
    }

    const contentType = entry.metadata?.contentType

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      await store.delete(id)
      return createJsonResponse({ error: 'not_found' }, 404)
    }

    if (isExpired(entry.metadata?.expiresAt)) {
      await store.delete(id)
      return createJsonResponse({ error: 'expired' }, 410)
    }

    const requestUrl = new URL(request.url)
    const shouldDownload = requestUrl.searchParams.get('download') === '1'
    const dispositionType = shouldDownload ? 'attachment' : 'inline'

    return new Response(entry.data, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': createContentDisposition(dispositionType, entry.metadata),
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return createJsonResponse({ error: 'image_unavailable' }, 500)
  }
}

export const config = {
  path: '/api/final-images/:id',
  method: 'GET',
}
