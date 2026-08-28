import { randomUUID } from 'node:crypto'
import { getStore } from '@netlify/blobs'

const STORE_NAME = 'life4cut-final-images'
const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg'])
const MAX_UPLOAD_BYTES = 4_200_000
const EXPIRES_IN_MS = 24 * 60 * 60 * 1000
const REQUESTED_IMAGE_ID_HEADER = 'x-life4cut-image-id'
const IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createJsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function getContentType(request) {
  return request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? ''
}

function formatFileDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}${month}${day}_${hours}${minutes}`
}

function createFilename(contentType, date) {
  const extension = contentType === 'image/jpeg' ? 'jpg' : 'png'

  return `OAZ_Life4Cut_${formatFileDate(date)}.${extension}`
}

function getRequestedImageId(request) {
  const requestedId = request.headers.get(REQUESTED_IMAGE_ID_HEADER)?.trim()

  if (!requestedId) {
    return ''
  }

  return IMAGE_ID_PATTERN.test(requestedId) ? requestedId.toLowerCase() : null
}

async function saveImageBlob(store, imageData, metadata, requestedId = '') {
  if (requestedId) {
    const result = await store.set(requestedId, imageData, {
      metadata,
      onlyIfNew: true,
    })

    if (result.modified) {
      return requestedId
    }

    const conflictError = new Error('Image id conflict')
    conflictError.code = 'image_id_conflict'
    throw conflictError
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = randomUUID()
    const result = await store.set(id, imageData, {
      metadata,
      onlyIfNew: true,
    })

    if (result.modified) {
      return id
    }
  }

  throw new Error('Image id conflict')
}

export default async function uploadFinalImage(request) {
  if (request.method !== 'POST') {
    return createJsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const contentType = getContentType(request)

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return createJsonResponse({ error: 'unsupported_media_type' }, 415)
  }

  const imageData = await request.arrayBuffer()

  if (imageData.byteLength === 0) {
    return createJsonResponse({ error: 'empty_body' }, 400)
  }

  if (imageData.byteLength > MAX_UPLOAD_BYTES) {
    return createJsonResponse({ error: 'payload_too_large' }, 413)
  }

  const requestedId = getRequestedImageId(request)

  if (requestedId === null) {
    return createJsonResponse({ error: 'invalid_image_id' }, 400)
  }

  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + EXPIRES_IN_MS).toISOString()
    const metadata = {
      contentType,
      filename: createFilename(contentType, now),
      createdAt: now.toISOString(),
      expiresAt,
    }
    const store = getStore(STORE_NAME)
    const id = await saveImageBlob(store, imageData, metadata, requestedId)
    const origin = new URL(request.url).origin
    const pageUrl = new URL(`/download/${id}`, origin).href

    return createJsonResponse({
      id,
      pageUrl,
      expiresAt,
    })
  } catch (error) {
    if (error?.code === 'image_id_conflict') {
      return createJsonResponse({ error: 'image_id_conflict' }, 409)
    }

    return createJsonResponse({ error: 'upload_failed' }, 500)
  }
}

export const config = {
  path: '/api/final-images',
  method: 'POST',
  rateLimit: {
    windowLimit: 12,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
}
