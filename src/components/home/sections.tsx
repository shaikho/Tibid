'use client'

import { animate, motion, useInView, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal'
import { DriftX, Parallax, ScrollSettle } from '@/components/ui/scroll-motion'
import { DotGrid } from '@/components/ui/waves'
import { CATEGORIES, CATEGORY_ORDER, SITE, VALUES } from '@/lib/constants'
import type { CommunityStats } from '@/lib/queries'

/* -------------------------------------------------------------------------- */
/*  Statement / story                                                          */
/* -------------------------------------------------------------------------- */

export function StorySection({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <section id="story" className="section relative overflow-hidden">
      <DotGrid />
      <div className="container-tibid relative">
        <div className="grid items-start gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal direction="right">
            <SectionLabel>Our statement</SectionLabel>
            <h2 className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] text-deep">
              A wave doesn&rsquo;t ask
              <br />
              <span className="text-gradient-wave">who&rsquo;s ready.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-tide">
              TIBID started with a simple idea: movement is better shared. Not as a race, not as a
              leaderboard — as a rhythm whole cities can fall into together.
            </p>
            <p className="mt-4 max-w-lg leading-relaxed text-tide/85">
              Every week we meet somewhere across Dubai and Sharjah to run, play, stretch, climb
              or ride. Some people are training for something. Most people just want to move,
              breathe and meet someone new. Both are exactly right.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-ghost"
              >
                Follow {SITE.instagramHandle}
              </a>
              <Link href={isSignedIn ? '/activities' : '/signup'} className="btn btn-outline">
                {isSignedIn ? 'See upcoming activities' : 'Create your profile'}
              </Link>
            </div>
          </Reveal>

          <Parallax speed={26}>
            <RevealGroup className="grid gap-4 sm:grid-cols-2">
              {VALUES.map((value) => (
                <RevealItem key={value.title}>
                  <div className="card card-hover h-full p-6">
                    <div className="text-3xl">{value.emoji}</div>
                    <h3 className="mt-4 font-display text-lg font-bold text-deep">{value.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-tide/85">{value.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Parallax>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Categories                                                                 */
/* -------------------------------------------------------------------------- */

export function CategoriesSection() {
  return (
    <section id="categories" className="section relative bg-deep text-mist">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(55rem 28rem at 10% 0%, rgba(0,107,212,0.5), transparent 60%), radial-gradient(45rem 26rem at 90% 100%, rgba(108,197,248,0.22), transparent 60%)',
        }}
      />
      <div className="container-tibid relative">
        <Reveal className="max-w-2xl">
          <SectionLabel dark>What we do</SectionLabel>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05]">
            Five ways to move with us
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-foam/80">
            One community, five rhythms. Pick whichever one your body is asking for this week.
          </p>
        </Reveal>

        <ScrollSettle>
          <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_ORDER.map((key) => {
              const cat = CATEGORIES[key]
              return (
                <RevealItem key={key}>
                  <Link
                    href={`/activities?category=${key}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-wave border border-white/10 bg-white/[0.04] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <span
                      aria-hidden
                      className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                      style={{ background: cat.accent }}
                    />
                    <span className="relative text-4xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                      {cat.emoji}
                    </span>
                    <h3 className="relative mt-5 font-display text-xl font-bold">{cat.label}</h3>
                    <p className="relative mt-2 flex-1 text-sm leading-relaxed text-foam/70">
                      {cat.blurb}
                    </p>
                    <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-crest">
                      See sessions
                      <span className="transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </Link>
                </RevealItem>
              )
            })}

            <RevealItem>
              <div className="flex h-full flex-col justify-center rounded-wave border border-dashed border-white/20 p-7 text-center">
                <p className="font-display text-lg font-bold text-white">Something else?</p>
                <p className="mt-2 text-sm leading-relaxed text-foam/70">
                  We add new formats when enough of you ask. Tell us on Instagram.
                </p>
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-crest hover:text-white"
                >
                  Send us a DM →
                </a>
              </div>
            </RevealItem>
          </RevealGroup>
        </ScrollSettle>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stats                                                                      */
/* -------------------------------------------------------------------------- */

export function StatsBand({ stats }: { stats: CommunityStats }) {
  const items = [
    { value: stats.members, label: 'Community profiles' },
    { value: stats.activities, label: 'Activities published' },
    { value: stats.signups, label: 'Sign-ups so far' },
    { value: stats.categories || 5, label: 'Ways to move' },
  ]

  return (
    <section className="relative -mt-px bg-gradient-to-r from-brand-deeper via-brand to-brand-light py-14 text-white">
      <div className="container-tibid">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.label} className="text-center">
              <div className="font-display text-[clamp(2.2rem,5vw,3.4rem)] font-extrabold leading-none">
                <Counter to={item.value} delay={i * 0.08} />
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Counter({ to, delay = 0 }: { to: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setValue(to)
      return
    }
    const controls = animate(0, to, {
      duration: 1.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to, delay, reduce])

  return <span ref={ref}>{value.toLocaleString()}</span>
}

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export function GallerySection({
  items,
}: {
  items: Array<{ id: string; imageUrl: string; caption: string | null }>
}) {
  if (!items.length) return null

  return (
    <section id="gallery" className="section overflow-hidden">
      <div className="container-tibid">
        <Reveal className="max-w-2xl">
          <SectionLabel>Moments</SectionLabel>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] text-deep">
            The bit that keeps
            <br />
            <span className="text-gradient-wave">people coming back</span>
          </h2>
        </Reveal>
      </div>

      <DriftX distance={40}>
        <RevealGroup className="mt-12 flex gap-4 overflow-x-auto px-5 pb-4 no-scrollbar md:px-8">
          {items.map((item) => (
            <RevealItem key={item.id} className="shrink-0">
              <figure className="group relative h-72 w-64 overflow-hidden rounded-wave sm:h-80 sm:w-72">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.caption ?? ''}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {item.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-abyss/90 to-transparent p-4 text-sm font-medium text-white opacity-0 transition-opacity duration-400 group-hover:opacity-100">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </DriftX>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Closing CTA                                                                */
/* -------------------------------------------------------------------------- */

export function JoinSection({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <section className="section relative">
      <div className="container-tibid">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand via-brand-dark to-deep px-7 py-16 text-center text-white sm:px-14 sm:py-20">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-crest/25 blur-3xl"
              animate={{ x: [0, 40, 0], y: [0, 24, 0] }}
              transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-kelp/25 blur-3xl"
              animate={{ x: [0, -36, 0], y: [0, -20, 0] }}
              transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />

            <span className="relative text-5xl">🌊</span>
            <h2 className="relative mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05]">
              {isSignedIn ? 'See you at the next one' : 'Join the journey'}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-white/85">
              {isSignedIn
                ? 'Your details are saved, so joining an activity takes about ten seconds. Pick the one your body is asking for this week.'
                : 'Create a profile once. After that, joining any activity takes about ten seconds — your details fill themselves in.'}
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/activities"
                className="btn w-full !bg-white !px-8 !py-3.5 !text-base !text-brand-deeper hover:-translate-y-0.5 sm:w-auto"
              >
                Browse activities
              </Link>
              <Link
                href={isSignedIn ? '/profile#my-activities' : '/signup'}
                className="btn w-full border-2 border-white/40 !px-8 !py-3.5 !text-base text-white hover:border-white sm:w-auto"
              >
                {isSignedIn ? 'My activities' : 'Create your profile'}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

export function SectionLabel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${
        dark ? 'text-crest' : 'text-brand'
      }`}
    >
      <span className="inline-block h-px w-8 bg-current opacity-50" />
      {children}
    </span>
  )
}
