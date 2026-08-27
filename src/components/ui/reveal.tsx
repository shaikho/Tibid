'use client'

import { motion, useInView, useReducedMotion, type Variants } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
}

type Amount = number | 'some' | 'all'

/**
 * Whether this element should be shown yet.
 *
 * Deliberately `useInView` + a declarative `animate`, rather than motion's
 * `whileInView`. `whileInView` is a gesture: with `once: true` it stops
 * observing the moment it fires, and — critically — it does NOT propagate its
 * variant to children that mount later.
 *
 * That combination silently hid content. Filtering the activity list re-renders
 * the same RevealGroup with different children: the group had already fired, so
 * it sat at "show" with its observer detached, while each freshly mounted card
 * started at `initial="hidden"` with nothing left to move it to "show". The
 * cards were in the DOM at full height and permanently invisible, and a reload
 * — which remounts the group — "fixed" it.
 *
 * `animate` is state, not a gesture, so a child mounting into an already-shown
 * parent inherits "show" and animates in normally.
 */
function useRevealed(ref: RefObject<Element | null>, amount: Amount, once: boolean): boolean {
  const inView = useInView(ref, { once, amount })
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Mounted entirely above the viewport — the reader is already past it, so
    // there is no intersection left to observe and it must not stay hidden.
    if (el.getBoundingClientRect().bottom <= 0) setScrolledPast(true)
  }, [ref])

  return inView || scrolledPast
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className,
  once = true,
  amount = 'some',
}: {
  children: ReactNode
  delay?: number
  direction?: Direction
  className?: string
  once?: boolean
  /**
   * 'some' (any pixel visible) is the default on purpose. A numeric threshold
   * on an element taller than the viewport can never be reached, which would
   * leave the content permanently at opacity 0 — invisible but still capturing
   * clicks on whatever sits underneath it.
   */
  amount?: Amount
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const revealed = useRevealed(ref, amount, once)
  const { x, y } = reduce ? offsets.none : offsets[direction]

  const variants: Variants = {
    hidden: { opacity: 0, x, y, filter: reduce ? 'none' : 'blur(6px)' },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: reduce ? 0.01 : 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={revealed ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  )
}

/** Staggers direct children. Pair with <RevealItem>. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  delay = 0,
  amount = 'some',
}: {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  amount?: Amount
}) {
  const ref = useRef<HTMLDivElement>(null)
  const revealed = useRevealed(ref, amount, true)

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={revealed ? 'show' : 'hidden'}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({
  children,
  className,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  direction?: Direction
}) {
  const reduce = useReducedMotion()
  const { x, y } = reduce ? offsets.none : offsets[direction]

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: reduce ? 0.01 : 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}
