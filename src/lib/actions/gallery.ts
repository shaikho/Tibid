'use server'

import { del, put } from '@vercel/blob'
import { asc, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db, galleryItems } from '@/db'
import { categoryEnum, type Category } from '@/db/schema'
import { requireAdmin } from '@/lib/auth'

export type GalleryState = {
  ok?: boolean
  message?: string
  error?: string
}

const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export async function blobConfigured(): Promise<boolean> {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function parseCategory(value: FormDataEntryValue | null): Category | null {
  const v = typeof value === 'string' ? value : ''
  return categoryEnum.enumValues.includes(v as Category) ? (v as Category) : null
}

/**
 * Adds one photo to the Moments gallery.
 *
 * Two routes in, because organisers will have photos in two places: a file on
 * the phone or laptop, and a link to something already hosted. A file goes to
 * Vercel Blob; a URL is stored as-is. Only the Blob route needs setup, so the
 * URL route keeps working before anyone creates a Blob store.
 */
export async function addGalleryItemAction(
  _prev: GalleryState,
  formData: FormData,
): Promise<GalleryState> {
  await requireAdmin()

  const caption = String(formData.get('caption') ?? '').trim() || null
  const category = parseCategory(formData.get('category'))
  const pastedUrl = String(formData.get('imageUrl') ?? '').trim()
  const file = formData.get('file')

  let imageUrl: string | null = null

  if (file instanceof File && file.size > 0) {
    if (!(await blobConfigured())) {
      return {
        error:
          'File uploads need a Vercel Blob store. Create one in Vercel → Storage, or paste an image URL instead.',
      }
    }
    if (!ALLOWED.includes(file.type)) {
      return { error: `That file type (${file.type || 'unknown'}) is not an image we can use.` }
    }
    if (file.size > MAX_BYTES) {
      return {
        error: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — please keep it under 8 MB.`,
      }
    }

    try {
      // addRandomSuffix keeps two photos with the same filename from colliding.
      const blob = await put(`gallery/${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      })
      imageUrl = blob.url
    } catch (error) {
      return {
        error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  } else if (pastedUrl) {
    try {
      const parsed = new URL(pastedUrl)
      if (parsed.protocol !== 'https:') return { error: 'Image links must start with https://' }
      imageUrl = parsed.toString()
    } catch {
      return { error: 'That does not look like a valid image URL.' }
    }
  }

  if (!imageUrl) return { error: 'Choose a photo to upload, or paste an image URL.' }

  // New photos go to the front — the most recent moment is the interesting one.
  const [{ min }] = await db
    .select({ min: sql<number>`coalesce(min(${galleryItems.sortOrder}), 0)::int` })
    .from(galleryItems)

  await db.insert(galleryItems).values({
    imageUrl,
    caption,
    category,
    sortOrder: min - 1,
  })

  revalidatePath('/')
  revalidatePath('/admin/gallery')

  return { ok: true, message: 'Photo added to Moments.' }
}

export async function updateGalleryItemAction(
  id: string,
  caption: string,
  category: string,
): Promise<void> {
  await requireAdmin()

  await db
    .update(galleryItems)
    .set({
      caption: caption.trim() || null,
      category: parseCategory(category),
    })
    .where(eq(galleryItems.id, id))

  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

export async function deleteGalleryItemAction(id: string): Promise<void> {
  await requireAdmin()

  const [row] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1)
  if (!row) return

  await db.delete(galleryItems).where(eq(galleryItems.id, id))

  // Best effort: drop the stored file too, but only one we uploaded. A pasted
  // link may point anywhere, and the row should disappear either way.
  if ((await blobConfigured()) && row.imageUrl.includes('.public.blob.vercel-storage.com')) {
    await del(row.imageUrl).catch(() => undefined)
  }

  revalidatePath('/')
  revalidatePath('/admin/gallery')
}

/** Moves one photo up or down in the running order. */
export async function reorderGalleryItemAction(
  id: string,
  direction: 'up' | 'down',
): Promise<void> {
  await requireAdmin()

  const rows = await db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.createdAt))

  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) return

  const swapWith = direction === 'up' ? index - 1 : index + 1
  if (swapWith < 0 || swapWith >= rows.length) return

  // Rewrite the whole sequence so positions stay dense even if they started
  // out sparse or duplicated.
  const ordered = [...rows]
  ;[ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]]

  await Promise.all(
    ordered.map((row, i) =>
      db.update(galleryItems).set({ sortOrder: i }).where(eq(galleryItems.id, row.id)),
    ),
  )

  revalidatePath('/')
  revalidatePath('/admin/gallery')
}
