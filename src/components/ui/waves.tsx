'use client'

import { motion, useReducedMotion } from 'motion/react'

/**
 * A band of layered, endlessly scrolling SVG waves that transitions one section
 * into the next.
 *
 * The important detail: the *last* layer is drawn in `to`, the background colour
 * of the section that follows. It fills everything below the wave crest, so the
 * divider melts into the next section instead of ending in a hard-edged stripe.
 * The `tints` layers sit above it and are purely decorative.
 */
export function WaveDivider({
  className = '',
  to = '#F6FBFF',
  tints = ['#B9E5FB', '#6CC5F8'],
  height = 120,
}: {
  className?: string
  /** Background colour of the section immediately below this divider. */
  to?: string
  /** Decorative wave layers drawn behind the solid `to` wave. */
  tints?: string[]
  height?: number
}) {
  const reduce = useReducedMotion()
  const layers = [...tints, to]

  return (
    <div
      className={`pointer-events-none relative w-full overflow-hidden ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {layers.map((color, i) => {
        const isBase = i === layers.length - 1
        // Decorative layers ride higher so their crests peek above the base wave.
        const lift = (layers.length - 1 - i) * 13
        return (
          <motion.svg
            key={`${color}-${i}`}
            className="absolute bottom-0 left-0 h-full"
            style={{ width: '200%', opacity: isBase ? 1 : 0.45 + i * 0.12 }}
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
            animate={reduce ? undefined : { x: ['0%', '-50%'] }}
            transition={{
              duration: 30 - i * 7,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            <path
              fill={color}
              d={`M0,${58 - lift + i * 4}
                 C360,${88 - lift} 720,${28 - lift} 1440,${58 - lift + i * 4}
                 C2160,${88 - lift} 2520,${28 - lift} 2880,${58 - lift + i * 4}
                 L2880,120 L0,120 Z`}
            />
          </motion.svg>
        )
      })}
    </div>
  )
}

/** Soft drifting colour blobs behind hero / section content. */
export function OceanBackdrop({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,107,212,0.30),transparent_65%)] animate-[drift_18s_ease-in-out_infinite] blur-2xl" />
      <div className="absolute -right-40 top-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(108,197,248,0.38),transparent_65%)] animate-[drift_26s_ease-in-out_infinite] blur-2xl" />
      <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(18,178,143,0.20),transparent_65%)] animate-[drift_22s_ease-in-out_infinite] blur-2xl" />
    </div>
  )
}

/** Fine dotted grid — adds texture without noise. */
export function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(0,107,212,0.14) 1px, transparent 0)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}
    />
  )
}
