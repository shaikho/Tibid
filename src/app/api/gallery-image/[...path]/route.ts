import { get } from '@vercel/blob'
import { eq } from 'drizzle-orm'

import { db, galleryItems } from '@/db'
import { blobConfigured, galleryProxyUrl, pathnameFromProxyUrl } from '@/lib/blob'

/**
 * Serves one Moments photo out of a *private* Blob store.
 *
 * A private blob can only be read with the store's read-write token, which must
 * stay on the server. So the browser asks us instead, and we stream the bytes
 * through. Photos in a public store never come through here — their URLs point
 * straight at the Blob CDN.
 *
 * Two guards keep this from becoming a way to read the whole store: the path
 * must sit under `gallery/`, and it must match a row that an admin actually
 * published. Anything else is a 404, including a real file that simply isn't in
 * the gallery.
 */

export const runtime = 'nodejs'

const NOT_FOUND = new Response('Not found', { status: 404 })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (!blobConfigured()) return NOT_FOUND

  const { path } = await params
  const requested = galleryProxyUrl((path ?? []).join('/'))
  const pathname = pathnameFromProxyUrl(requested)
  if (!pathname) return NOT_FOUND

  const [row] = await db
    .select({ id: galleryItems.id })
    .from(galleryItems)
    .where(eq(galleryItems.imageUrl, requested))
    .limit(1)
  if (!row) return NOT_FOUND

  try {
    const result = await get(pathname, { access: 'private' })
    if (!result?.stream) return NOT_FOUND

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType ?? 'application/octet-stream',
        // The random suffix in the pathname makes every upload a new URL, so
        // the bytes behind one can never change — cache it hard.
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NOT_FOUND
  }
}
