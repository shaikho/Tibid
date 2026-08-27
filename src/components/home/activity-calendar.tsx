'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Reveal } from '@/components/ui/reveal'
import type { Category } from '@/db/schema'
import { CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

import { SectionLabel } from './sections'

/**
 * A month view of what's on.
 *
 * Every date is handled as a `YYYY-MM-DD` string computed on the server in
 * UAE time — including `todayKey`. Nothing here calls `new Date()` for the
 * current date, because a browser in another timezone would disagree with the
 * server and highlight the wrong day (and trip a hydration mismatch on the way).
 * The only date arithmetic below is on UTC-constructed dates used purely to lay
 * out a grid of numbers, which is timezone-independent.
 */

export type CalendarActivity = {
  id: string
  slug: string
  title: string
  category: Category
  /** YYYY-MM-DD in Asia/Dubai */
  dateKey: string
  timeLabel: string
  priceLabel: string
  location: string
  isPast: boolean
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function keyOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

/** Monday-first index of the 1st of the month. */
function leadingBlanks(year: number, month: number) {
  return (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
}

export function ActivityCalendar({
  activities,
  todayKey,
}: {
  activities: CalendarActivity[]
  todayKey: string
}) {
  const [todayYear, todayMonth] = todayKey.split('-').map(Number)
  const [cursor, setCursor] = useState({ year: todayYear, month: todayMonth - 1 })
  const [openDay, setOpenDay] = useState<string | null>(null)
  const reduce = useReducedMotion()

  // Touch has no pointerleave, so the peek needs its own way out.
  useEffect(() => {
    if (!openDay) return

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenDay(null)
    }
    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return
      const target = e.target as HTMLElement | null
      if (!target?.closest('#calendar')) setOpenDay(null)
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openDay])

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>()
    for (const a of activities) {
      const list = map.get(a.dateKey)
      if (list) list.push(a)
      else map.set(a.dateKey, [a])
    }
    return map
  }, [activities])

  /** Months we actually hold data for, so navigation can't wander into a void. */
  const bounds = useMemo(() => {
    const keys = activities.map((a) => a.dateKey).sort()
    const first = keys[0] ?? todayKey
    const last = keys[keys.length - 1] ?? todayKey
    const toIndex = (k: string) => {
      const [y, m] = k.split('-').map(Number)
      return y * 12 + (m - 1)
    }
    return {
      min: Math.min(toIndex(first), todayYear * 12 + todayMonth - 1),
      max: Math.max(toIndex(last), todayYear * 12 + todayMonth - 1),
    }
  }, [activities, todayKey, todayYear, todayMonth])

  const cursorIndex = cursor.year * 12 + cursor.month
  const canGoBack = cursorIndex > bounds.min
  const canGoForward = cursorIndex < bounds.max

  function shift(delta: number) {
    setOpenDay(null)
    const next = cursorIndex + delta
    if (next < bounds.min || next > bounds.max) return
    setCursor({ year: Math.floor(next / 12), month: next % 12 })
  }

  const total = daysInMonth(cursor.year, cursor.month)
  const blanks = leadingBlanks(cursor.year, cursor.month)
  const cells: Array<{ day: number; key: string } | null> = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: total }, (_, i) => ({
      day: i + 1,
      key: keyOf(cursor.year, cursor.month, i + 1),
    })),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthCount = activities.filter((a) =>
    a.dateKey.startsWith(`${cursor.year}-${pad(cursor.month + 1)}`),
  ).length

  return (
    <section id="calendar" className="section relative scroll-mt-24 overflow-hidden bg-shell">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(45rem 22rem at 85% 0%, rgba(0,107,212,0.10), transparent 65%), radial-gradient(40rem 20rem at 10% 100%, rgba(108,197,248,0.16), transparent 65%)',
        }}
      />

      <div className="container-tibid relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>The month ahead</SectionLabel>
          <h2 className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] text-deep">
            When we&rsquo;re <span className="text-gradient-wave">moving</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-tide">
            Hover a highlighted day to see what&rsquo;s on — or tap it on your phone.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto max-w-3xl rounded-wave border border-foam/80 bg-white p-5 shadow-[0_24px_70px_-40px_rgba(4,30,58,0.45)] sm:p-8">
            {/* Month header */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => shift(-1)}
                disabled={!canGoBack}
                aria-label="Previous month"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-foam text-tide transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-foam disabled:hover:text-tide"
              >
                <svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden>
                  <path
                    d="M7.5 1 1.5 7l6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="text-center">
                <h3 className="font-display text-xl font-bold text-deep sm:text-2xl">
                  {MONTH_NAMES[cursor.month]} {cursor.year}
                </h3>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-tide/80">
                  {monthCount === 0
                    ? 'Nothing scheduled yet'
                    : `${monthCount} ${monthCount === 1 ? 'activity' : 'activities'}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => shift(1)}
                disabled={!canGoForward}
                aria-label="Next month"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-foam text-tide transition hover:border-brand/50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-foam disabled:hover:text-tide"
              >
                <svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden>
                  <path
                    d="m1.5 1 6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Weekday labels */}
            <div className="mt-7 grid grid-cols-7 gap-1 sm:gap-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="pb-2 text-center text-[10px] font-bold uppercase tracking-widest text-tide/60 sm:text-xs"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {cells.map((cell, i) => {
                if (!cell) return <div key={`blank-${i}`} className="h-14 sm:h-[4.25rem]" />

                const dayActivities = byDay.get(cell.key) ?? []
                const hasActivities = dayActivities.length > 0
                const isToday = cell.key === todayKey
                const isOpen = openDay === cell.key
                const row = Math.floor(i / 7)
                const col = i % 7
                const showAbove = row >= 3
                const align = col <= 1 ? 'left' : col >= 5 ? 'right' : 'center'

                return (
                  <div key={cell.key} className="relative h-14 sm:h-[4.25rem]">
                    <button
                      type="button"
                      disabled={!hasActivities}
                      /*
                       * Hover and tap have to be told apart explicitly.
                       *
                       * A tap fires pointerenter AND focus AND click. When all
                       * three drove the same toggle, the peek opened on enter
                       * and closed again on click, so it never appeared on a
                       * phone at all. Hover is gated on a mouse pointer,
                       * keyboard opening on :focus-visible (false for a tap or
                       * a mouse click), and the click toggle is left to handle
                       * touch by itself.
                       */
                      onPointerEnter={(e) => {
                        if (e.pointerType === 'mouse' && hasActivities) setOpenDay(cell.key)
                      }}
                      onPointerLeave={(e) => {
                        if (e.pointerType === 'mouse') {
                          setOpenDay((v) => (v === cell.key ? null : v))
                        }
                      }}
                      onFocus={(e) => {
                        if (hasActivities && e.currentTarget.matches(':focus-visible')) {
                          setOpenDay(cell.key)
                        }
                      }}
                      onClick={() =>
                        hasActivities && setOpenDay((v) => (v === cell.key ? null : cell.key))
                      }
                      aria-expanded={hasActivities ? isOpen : undefined}
                      aria-label={
                        hasActivities
                          ? `${cell.day} ${MONTH_NAMES[cursor.month]} — ${dayActivities.length} ${
                              dayActivities.length === 1 ? 'activity' : 'activities'
                            }`
                          : `${cell.day} ${MONTH_NAMES[cursor.month]} — nothing scheduled`
                      }
                      className={cn(
                        'group relative flex h-full w-full flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-300 sm:rounded-2xl',
                        hasActivities
                          ? 'cursor-pointer border-brand/25 bg-mist text-brand-deeper hover:-translate-y-0.5 hover:border-brand hover:shadow-tide'
                          : 'cursor-default border-transparent text-tide/45',
                        isToday && 'ring-2 ring-brand ring-offset-2 ring-offset-white',
                        isOpen && 'border-brand shadow-tide',
                      )}
                    >
                      <span className={cn('leading-none', isToday && 'text-brand')}>
                        {cell.day}
                      </span>

                      {hasActivities && (
                        <span className="mt-1 flex gap-0.5">
                          {dayActivities.slice(0, 3).map((a) => (
                            <span
                              key={a.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: CATEGORIES[a.category].accent }}
                            />
                          ))}
                        </span>
                      )}

                      {isToday && (
                        <span className="absolute -bottom-0.5 text-[8px] font-bold uppercase tracking-wider text-brand sm:text-[9px]">
                          Today
                        </span>
                      )}
                    </button>

                    <AnimatePresence>
                      {isOpen && hasActivities && (
                        <motion.div
                          initial={{ opacity: 0, y: showAbove ? 6 : -6, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: showAbove ? 6 : -6, scale: 0.97 }}
                          transition={{ duration: reduce ? 0.01 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                          role="tooltip"
                          className={cn(
                            'absolute z-40 w-60 rounded-2xl border border-foam bg-white p-3 text-left shadow-float sm:w-72',
                            showAbove ? 'bottom-full mb-2' : 'top-full mt-2',
                            align === 'left' && 'left-0',
                            align === 'right' && 'right-0',
                            align === 'center' && 'left-1/2 -translate-x-1/2',
                          )}
                        >
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand">
                            {cell.day} {MONTH_NAMES[cursor.month]}
                          </p>

                          <ul className="space-y-2">
                            {dayActivities.map((a) => (
                              <li key={a.id}>
                                <Link
                                  href={`/activities/${a.slug}`}
                                  className="block rounded-xl p-2 transition hover:bg-mist"
                                >
                                  <span className="flex items-start gap-2">
                                    <span className="text-base leading-none">
                                      {CATEGORIES[a.category].emoji}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-xs font-bold leading-snug text-deep">
                                        {a.title}
                                      </span>
                                      <span className="mt-0.5 block text-[11px] text-tide">
                                        {a.timeLabel} · {a.priceLabel}
                                      </span>
                                      <span className="mt-0.5 block truncate text-[11px] text-tide/70">
                                        {a.location}
                                      </span>
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-foam/70 pt-5">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <span
                  key={key}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-tide"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: cat.accent }}
                    aria-hidden
                  />
                  {cat.label}
                </span>
              ))}
            </div>
          </div>

          {activities.length === 0 && (
            <p className="mt-6 text-center text-sm text-tide">
              Nothing on the calendar just yet — new sessions go up every week.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
