'use client'

import { useEffect, useRef, useState } from 'react'

import type { Category } from '@/db/schema'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * An image that never leaves a hole in the layout.
 *
 * A plain `<img src={coverImage}>` has two failure modes people actually hit:
 * a slow image leaves a blank rectangle for as long as it takes, and a dead URL
 * leaves the browser's broken-image icon there permanently. Either way the card
 * looks broken rather than merely image-less.
 *
 * So the branded placeholder is always painted first, underneath, and is what
 * you see until the real image has decoded. The image then fades in over it. If
 * it never arrives, the placeholder simply stays — which is the same thing an
 * activity with no cover image shows, so a broken URL and no URL look identical
 * instead of one of them looking like a bug.
 */

type Status = 'loading' | 'loaded' | 'failed'

export function BrandedImage({
  src,
  alt,
  category,
  className,
  imgClassName,
  priority = false,
  showLogo = true,
}: {
  src: string | null | undefined
  alt: string
  /** Tints the placeholder in the activity's colour. */
  category?: Category
  className?: string
  imgClassName?: string
  priority?: boolean
  showLogo?: boolean
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'failed')

  /*
   * A cached image can finish decoding before React attaches onLoad, and then
   * neither handler ever fires — the image would sit at opacity 0 forever. On
   * mount, ask the element what already happened. `complete` with a zero
   * naturalWidth means it completed by failing.
   */
  useEffect(() => {
    if (!src) {
      setStatus('failed')
      return
    }
    setStatus('loading')

    const el = ref.current
    if (el?.complete) {
      setStatus(el.naturalWidth > 0 ? 'loaded' : 'failed')
    }
  }, [src])

  const accent = category ? CATEGORIES[category].accent : '#006BD4'

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder — always rendered, always underneath. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, #02101F 130%)` }}
      >
        {showLogo && (
          <span className="absolute inset-0 grid place-items-center p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tibid-logo.png"
              alt=""
              width={1472}
              height={704}
              /*
                One opacity utility, chosen with a ternary — never two.
                `cn()` is a plain join, not tailwind-merge, so emitting both
                `opacity-30` and `opacity-0` leaves the winner to whichever
                Tailwind happens to write later in the stylesheet. It picked
                opacity-30, and the logo never faded.
              */
              className={cn(
                'w-[58%] max-w-[190px] brightness-0 invert transition-opacity duration-500',
                status === 'loaded' ? 'opacity-0' : 'opacity-30',
              )}
            />
          </span>
        )}

        <svg
          aria-hidden
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-12 w-full text-white/20"
        >
          <path
            fill="currentColor"
            d="M0,40 C60,10 120,70 200,40 C280,10 340,70 400,40 L400,80 L0,80 Z"
          />
        </svg>
      </div>

      {/*
        A failed image is unmounted, which would also take its alt text out of
        the accessibility tree — so anyone using a screen reader would lose the
        caption entirely, not just the picture. Keep the description available.
      */}
      {status === 'failed' && alt ? <span className="sr-only">{alt}</span> : null}

      {/* The real image, fading in only once it has actually decoded. */}
      {src && status !== 'failed' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={(e) => setStatus(e.currentTarget.naturalWidth > 0 ? 'loaded' : 'failed')}
          onError={() => setStatus('failed')}
          className={cn(
            'relative h-full w-full object-cover transition-opacity duration-700',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      )}
    </div>
  )
}
