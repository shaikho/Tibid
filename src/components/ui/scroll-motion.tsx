'use client'

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'

/**
 * Scroll-linked motion helpers.
 *
 * Everything here is decorative, so everything here collapses to a no-op under
 * `prefers-reduced-motion`. Scroll-driven parallax is one of the most reliable
 * ways to make people motion-sick, and it is never load-bearing for meaning.
 */

/** A thin wave-coloured progress bar pinned to the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })
  const reduce = useReducedMotion()

  if (reduce) return null

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[55] h-[3px] origin-left bg-gradient-to-r from-brand-deeper via-brand to-crest"
    />
  )
}

/**
 * Moves its children vertically as they cross the viewport.
 * `speed` is the total travel in pixels across the full crossing.
 */
export function Parallax({
  children,
  speed = 60,
  className,
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Scales and fades its children slightly as they enter, so a section feels like
 * it settles into place rather than snapping in.
 */
export function ScrollSettle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'start 0.45'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.955, 1])
  const opacity = useTransform(scrollYProgress, [0, 1], [0.35, 1])

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  )
}

/** Drifts a decorative element horizontally with scroll — used for wave accents. */
export function DriftX({
  children,
  distance = 80,
  className,
}: {
  children: ReactNode
  distance?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], [-distance, distance])

  if (reduce) return <div className={className}>{children}</div>

  return (
    <motion.div ref={ref} style={{ x }} className={className}>
      {children}
    </motion.div>
  )
}
