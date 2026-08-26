'use client'

import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offsets: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  down: { x: 0, y: -28 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 },
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
  amount?: number | 'some' | 'all'
}) {
  const reduce = useReducedMotion()
  const { x, y } = reduce ? offsets.none : offsets[direction]

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y, filter: reduce ? 'none' : 'blur(6px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{
        duration: reduce ? 0.01 : 0.7,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
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
  amount?: number | 'some' | 'all'
}) {
  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
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
