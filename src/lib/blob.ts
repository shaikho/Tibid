import { del, put } from '@vercel/blob'

/**
 * Uploading Moments photos to Vercel Blob, whichever kind of store exists.
 *
 * A Blob store is created as either public or private, and that choice cannot
 * be changed afterwards. `put()` requires you to declare which one you are
 * writing to, and rejects the call outright if you get it wrong:
 *
 *   Vercel Blob: Cannot use public access on a private store.
 *   The store is configured with private access.
 *
 * Hardcoding `access: 'public'` therefore breaks for anyone whose store happens
 * to be private, with an error that reads like a bug in the site rather than a
 * setting in their Vercel dashboard. So we detect the store's access mode from
 * the store itself, on the first upload, and remember it.
 *
 * The two modes then differ in how the photo is *read back*:
 *
 *   public  — the returned URL is served straight off the Blob CDN, and the
 *             home page can point an <img> at it.
 *   private — the blob is only readable with the store token, which must never
 *             reach the browser. We store a link to our own route instead, and
 *             that route streams the bytes through with the token server-side.
 *
 * Either way the caller just gets back a URL that works in an <img src>.
 */

export type StoreAccess = 'public' | 'private'

/** Path prefix for every photo we upload, and the guard for the read route. */
export const GALLERY_PREFIX = 'gallery/'

/** The route that serves photos out of a private store. */
export const GALLERY_PROXY_PREFIX = '/api/gallery-image/'

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Remembered for the life of the serverless instance. Detection costs one
 * failed upload attempt, and the answer cannot change without the user
 * creating a different store — at which point the instance is replaced anyway.
 */
let detected: StoreAccess | null = null

/**
 * True when Blob refused the call *only* because we named the wrong access
 * mode. Deliberately narrow: a size limit, a bad token or a network failure
 * must surface to the admin rather than silently triggering a retry that will
 * fail the same way.
 */
function isAccessMismatch(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    /cannot use (public|private) access on a (private|public) store/i.test(message) ||
    /store is configured with (public|private) access/i.test(message)
  )
}

export function galleryProxyUrl(pathname: string): string {
  return GALLERY_PROXY_PREFIX + pathname.split('/').map(encodeURIComponent).join('/')
}

/** The blob pathname behind one of our proxy URLs, or null if it isn't one. */
export function pathnameFromProxyUrl(url: string): string | null {
  if (!url.startsWith(GALLERY_PROXY_PREFIX)) return null
  const raw = url.slice(GALLERY_PROXY_PREFIX.length)
  if (!raw) return null

  let decoded: string
  try {
    decoded = raw.split('/').map(decodeURIComponent).join('/')
  } catch {
    return null
  }

  // No traversal out of the gallery folder, whatever arrives in the URL.
  if (decoded.includes('..') || !decoded.startsWith(GALLERY_PREFIX)) return null
  return decoded
}

/**
 * Stores one image and returns a URL an <img> can use.
 *
 * Tries the store's known access mode first; on a first upload it tries public
 * and falls back to private, since public is the common case and its URL is the
 * better one (served by the CDN, no function invocation per view).
 */
export async function putGalleryImage(
  filename: string,
  body: File,
  contentType: string,
): Promise<{ url: string; access: StoreAccess }> {
  const order: StoreAccess[] = detected
    ? [detected, detected === 'public' ? 'private' : 'public']
    : ['public', 'private']

  let lastError: unknown

  for (const access of order) {
    try {
      // addRandomSuffix keeps two photos with the same filename from colliding,
      // and makes a private blob's pathname unguessable.
      const blob = await put(`${GALLERY_PREFIX}${filename}`, body, {
        access,
        addRandomSuffix: true,
        // Stated outright rather than left to be inferred from the extension:
        // a phone photo saved as `IMG_0421` with no extension would otherwise
        // be stored as a generic download and refuse to render in an <img>.
        contentType,
      })
      detected = access
      return {
        url: access === 'public' ? blob.url : galleryProxyUrl(blob.pathname),
        access,
      }
    } catch (error) {
      lastError = error
      if (!isAccessMismatch(error)) throw error
    }
  }

  throw lastError
}

/**
 * Best-effort removal of a stored file. Only ever deletes something we put
 * there: a pasted link may point anywhere on the web, and the gallery row
 * should disappear whether or not the file does.
 */
export async function deleteGalleryImage(url: string): Promise<void> {
  if (!blobConfigured()) return

  const privatePathname = pathnameFromProxyUrl(url)
  if (privatePathname) {
    await del(privatePathname).catch(() => undefined)
    return
  }

  if (/\.blob\.vercel-storage\.com\//.test(url)) {
    await del(url).catch(() => undefined)
  }
}
