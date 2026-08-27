'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, useRef, useState, useTransition } from 'react'

import { Alert, SelectField, SubmitButton, TextField } from '@/components/ui/form'
import type { GalleryItem } from '@/db/schema'
import {
  addGalleryItemAction,
  deleteGalleryItemAction,
  reorderGalleryItemAction,
  updateGalleryItemAction,
  type GalleryState,
} from '@/lib/actions/gallery'
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/constants'
import { cn } from '@/lib/utils'

const initial: GalleryState = {}

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((c) => ({
  value: c,
  label: `${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`,
}))

export function GalleryManager({ items, blobReady }: { items: GalleryItem[]; blobReady: boolean }) {
  const [state, formAction] = useActionState(addGalleryItemAction, initial)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setPreview(null)
      setFileName(null)
      return
    }
    setFileName(file.name)
    // Object URLs are revoked when replaced so a long session doesn't leak them.
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
  }

  return (
    <div className="space-y-8">
      {/* ------------------------------ Add ------------------------------ */}
      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-deep">Add a photo</h2>
        <p className="mt-1 text-sm leading-relaxed text-tide">
          Photos appear in the <strong className="text-deep">Moments</strong> strip on the home
          page, newest first.
        </p>

        {!blobReady && (
          <div className="mt-4 rounded-2xl border border-sand/50 bg-sand/15 p-4 text-sm leading-relaxed text-tide">
            <p className="font-semibold text-deep">File uploads aren&rsquo;t switched on yet</p>
            <p className="mt-1">
              In Vercel: <strong>Storage → Create Database → Blob</strong>, connect it to this
              project, then redeploy. It injects{' '}
              <code className="rounded bg-white px-1">BLOB_READ_WRITE_TOKEN</code> automatically.
              Until then you can still add photos by pasting an image URL below.
            </p>
          </div>
        )}

        {state.error && (
          <div className="mt-4">
            <Alert>{state.error}</Alert>
          </div>
        )}
        {state.ok && (
          <div className="mt-4">
            <Alert tone="success">{state.message}</Alert>
          </div>
        )}

        <form
          ref={formRef}
          action={(fd) => {
            formAction(fd)
            formRef.current?.reset()
            setPreview(null)
            setFileName(null)
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <span className="field-label">Photo</span>
            <label
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition',
                blobReady
                  ? 'border-foam hover:border-brand/50 hover:bg-mist/40'
                  : 'cursor-not-allowed border-foam/60 opacity-60',
              )}
            >
              <input
                type="file"
                name="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                disabled={!blobReady}
                onChange={onFileChange}
                className="sr-only"
              />
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt=""
                    className="mb-3 h-32 w-auto rounded-xl object-cover shadow-tide"
                  />
                  <span className="text-sm font-semibold text-brand">{fileName}</span>
                  <span className="mt-1 text-xs text-tide">Choose a different photo</span>
                </>
              ) : (
                <>
                  <span className="text-3xl">📸</span>
                  <span className="mt-2 text-sm font-semibold text-deep">
                    {blobReady ? 'Choose a photo' : 'Uploads unavailable — paste a URL below'}
                  </span>
                  <span className="mt-1 text-xs text-tide">JPG, PNG, WebP or GIF · up to 8 MB</span>
                </>
              )}
            </label>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-tide/60">
            <span className="h-px flex-1 bg-foam" />
            or
            <span className="h-px flex-1 bg-foam" />
          </div>

          <TextField
            label="Image URL"
            name="imageUrl"
            type="url"
            placeholder="https://…"
            hint="Any public https image link — handy for photos already hosted elsewhere."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Caption"
              name="caption"
              placeholder="Friday morning run crew"
              hint="Shown when someone hovers the photo."
            />
            <SelectField
              label="Activity (optional)"
              name="category"
              placeholder="Not tied to one"
              options={CATEGORY_OPTIONS}
            />
          </div>

          <SubmitButton pendingLabel="Adding…">Add to Moments</SubmitButton>
        </form>
      </section>

      {/* ------------------------------ List ------------------------------ */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-deep">
            In the gallery <span className="text-sm font-medium text-tide">({items.length})</span>
          </h2>
          {items.length > 0 && (
            <a href="/#gallery" className="text-sm font-semibold text-brand hover:underline">
              See it live →
            </a>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foam p-10 text-center text-sm text-tide">
            No photos yet. The Moments section stays hidden on the home page until you add one.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  isFirst={i === 0}
                  isLast={i === items.length - 1}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}

function GalleryCard({
  item,
  isFirst,
  isLast,
}: {
  item: GalleryItem
  isFirst: boolean
  isLast: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(item.caption ?? '')
  const [category, setCategory] = useState<string>(item.category ?? '')

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: pending ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
      className="card overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt={item.caption ?? ''} className="h-full w-full object-cover" />

        <div className="absolute left-2 top-2 flex gap-1">
          <button
            type="button"
            disabled={isFirst || pending}
            onClick={() => startTransition(() => void reorderGalleryItemAction(item.id, 'up'))}
            aria-label="Move earlier"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs text-deep shadow backdrop-blur transition hover:bg-white disabled:opacity-30"
          >
            ←
          </button>
          <button
            type="button"
            disabled={isLast || pending}
            onClick={() => startTransition(() => void reorderGalleryItemAction(item.id, 'down'))}
            aria-label="Move later"
            className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-xs text-deep shadow backdrop-blur transition hover:bg-white disabled:opacity-30"
          >
            →
          </button>
        </div>

        {item.category && (
          <span className="absolute right-2 top-2 chip bg-white/90 text-brand-deeper backdrop-blur">
            {CATEGORIES[item.category].emoji} {CATEGORIES[item.category].label}
          </span>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div className="space-y-3">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption"
              className="field !py-2 !text-sm"
              aria-label="Caption"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field !py-2 !text-sm"
              aria-label="Activity"
            >
              <option value="">Not tied to one</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c].label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => {
                    void updateGalleryItemAction(item.id, caption, category)
                    setEditing(false)
                  })
                }
                className="btn btn-primary !py-2 !text-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaption(item.caption ?? '')
                  setCategory(item.category ?? '')
                  setEditing(false)
                }}
                className="btn btn-ghost !py-2 !text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="min-h-5 text-sm font-medium text-deep">
              {item.caption || <span className="text-tide/50">No caption</span>}
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-foam/70 pt-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm('Remove this photo from Moments?')) {
                    startTransition(() => void deleteGalleryItemAction(item.id))
                  }
                }}
                className="ml-auto text-xs font-semibold text-coral hover:underline"
              >
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </motion.li>
  )
}
