'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'

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
  tints = ['#B9E5FB', '#6CC5F8', '#2E93F0'],
  height = 170,
  parallax = true,
}: {
  className?: string
  /** Background colour of the section immediately below this divider. */
  to?: string
  /** Decorative wave layers drawn behind the solid `to` wave. */
  tints?: string[]
  height?: number
  /** Drift the layers horizontally as the divider crosses the viewport. */
  parallax?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const layers = [...tints, to]

  return (
    <div
      ref={ref}
      className={`pointer-events-none relative w-full overflow-hidden ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      {layers.map((color, i) => {
        const isBase = i === layers.length - 1
        // Back layers ride higher so their crests break above the base wave.
        const lift = (layers.length - 1 - i) * 20
        // …and travel further as you scroll, which reads as depth.
        const depth = (layers.length - i) * 6
        return (
          <ParallaxLayer
            key={`${color}-${i}`}
            progress={scrollYProgress}
            distance={parallax && !reduce ? depth : 0}
          >
            <motion.svg
              className="absolute bottom-0 left-0 h-full"
              style={{ width: '220%', opacity: isBase ? 1 : 0.4 + i * 0.14 }}
              viewBox="0 0 2880 160"
              preserveAspectRatio="none"
              animate={reduce ? undefined : { x: ['0%', '-45.4545%'] }}
              transition={{
                duration: 26 - i * 5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            >
              {/*
                Two full periods across the viewBox, and the loop translates by
                exactly one period (1310/2880 ≈ 45.4545%) so the seam is invisible.
              */}
              <path
                fill={color}
                d={`M0,${86 - lift}
                   C160,${34 - lift} 320,${138 - lift} 480,${86 - lift}
                   C640,${34 - lift} 800,${138 - lift} 960,${86 - lift}
                   C1120,${34 - lift} 1280,${138 - lift} 1440,${86 - lift}
                   C1600,${34 - lift} 1760,${138 - lift} 1920,${86 - lift}
                   C2080,${34 - lift} 2240,${138 - lift} 2400,${86 - lift}
                   C2560,${34 - lift} 2720,${138 - lift} 2880,${86 - lift}
                   L2880,160 L0,160 Z`}
              />
            </motion.svg>
          </ParallaxLayer>
        )
      })}
    </div>
  )
}

/**
 * Wraps one wave layer so scroll parallax and the endless loop can coexist:
 * a single element cannot take both a `style.x` and an animated `x`, so the
 * scroll offset lives on this wrapper and the loop stays on the SVG inside.
 */
function ParallaxLayer({
  progress,
  distance,
  children,
}: {
  progress: ReturnType<typeof useScroll>['scrollYProgress']
  distance: number
  children: React.ReactNode
}) {
  const x = useTransform(progress, [0, 1], ['0%', `${-distance}%`])
  return (
    <motion.div className="absolute inset-0" style={{ x }}>
      {children}
    </motion.div>
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
