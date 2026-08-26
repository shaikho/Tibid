'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import Link from 'next/link'
import { useRef } from 'react'

import { OceanBackdrop, WaveDivider } from '@/components/ui/waves'

const HEADLINE = ['Inspired', 'by', 'waves.']

export function Hero({ nextActivity }: { nextActivity?: { title: string; slug: string } | null }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '22%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-gradient-to-b from-mist via-shell to-shell pt-28"
    >
      <OceanBackdrop />

      {/* Floating emoji orbs */}
      {!reduce &&
        [
          { emoji: '🏃', top: '18%', left: '6%', delay: 0 },
          { emoji: '🏐', top: '68%', left: '11%', delay: 1.1 },
          { emoji: '🧘', top: '24%', right: '9%', delay: 0.5 },
          { emoji: '🥾', top: '72%', right: '14%', delay: 1.6 },
          { emoji: '🐎', top: '46%', right: '4%', delay: 2.1 },
        ].map((orb) => (
          <motion.span
            key={orb.emoji}
            aria-hidden
            className="pointer-events-none absolute hidden select-none text-3xl opacity-40 lg:block xl:text-4xl"
            style={{ top: orb.top, left: orb.left, right: orb.right }}
            animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
            transition={{
              duration: 7,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              delay: orb.delay,
            }}
          >
            {orb.emoji}
          </motion.span>
        ))}

      <motion.div style={{ y, opacity }} className="container-tibid relative z-10 pb-40 text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-kelp opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-kelp" />
          </span>
          Dubai · All levels welcome
        </motion.div>

        <h1 className="font-display text-[clamp(2.9rem,10vw,7rem)] font-extrabold leading-[0.92] tracking-tight text-deep">
          {HEADLINE.map((word, i) => (
            <motion.span
              key={word}
              className="mr-[0.22em] inline-block"
              initial={{ opacity: 0, y: reduce ? 0 : 60, rotateX: reduce ? 0 : -45 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.85, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              {i === 2 ? <span className="text-gradient-wave">{word}</span> : word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-relaxed text-tide sm:text-xl"
        >
          Powered by and embracing movement — building an active, healthy community.
          <span className="block font-semibold text-deep">
            Run, play, stretch, climb, ride. Come exactly as you are.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.66 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href="/activities" className="btn btn-primary w-full !px-8 !py-3.5 !text-base sm:w-auto">
            See this week&rsquo;s activities
            <ArrowIcon />
          </Link>
          <Link href="/#story" className="btn btn-outline w-full !px-8 !py-3.5 !text-base sm:w-auto">
            What is TIBID?
          </Link>
        </motion.div>

        {nextActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-9 text-sm text-tide"
          >
            Next up:{' '}
            <Link
              href={`/activities/${nextActivity.slug}`}
              className="font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition hover:decoration-brand"
            >
              {nextActivity.title}
            </Link>
          </motion.div>
        )}
      </motion.div>

      <div className="absolute inset-x-0 bottom-0">
        <WaveDivider height={150} to="#F6FBFF" tints={['#B9E5FB', '#6CC5F8']} />
      </div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0], y: [0, 8, 8, 0] }}
        transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, delay: 1.4 }}
        className="absolute bottom-[10.5rem] left-1/2 z-10 -translate-x-1/2 text-brand/60"
      >
        <svg width="22" height="30" viewBox="0 0 22 30" fill="none">
          <rect x="1" y="1" width="20" height="28" rx="10" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="11" cy="9" r="2.4" fill="currentColor" />
        </svg>
      </motion.div>
    </section>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 8h11m0 0L9 3.5M13.5 8 9 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
