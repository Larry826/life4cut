import { getStore } from '@netlify/blobs'

const STORE_NAME = 'life4cut-final-images'
const IMAGE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isExpired(expiresAt, now) {
  const expiresTime = Date.parse(expiresAt)

  return Number.isFinite(expiresTime) && expiresTime <= now
}

export default async function cleanupExpiredImages() {
  const now = Date.now()
  let checkedCount = 0
  let deletedCount = 0

  try {
    const store = getStore(STORE_NAME)
    const { blobs } = await store.list()

    for (const blob of blobs) {
      if (!IMAGE_ID_PATTERN.test(blob.key)) {
        continue
      }

      try {
        checkedCount += 1
        const entry = await store.getMetadata(blob.key)

        if (entry && isExpired(entry.metadata?.expiresAt, now)) {
          await store.delete(blob.key)
          deletedCount += 1
        }
      } catch {
        // Keep cleaning other entries even if one item cannot be inspected.
      }
    }

    return Response.json(
      { checkedCount, deletedCount },
      {
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  } catch {
    return Response.json(
      { error: 'cleanup_failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  }
}

export const config = {
  schedule: '@hourly',
}
