import { SITE } from './constants'

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

/* -------------------------------------------------------------------------- */
/*  Dates — always rendered in the community's timezone (Asia/Dubai)           */
/* -------------------------------------------------------------------------- */

const TZ = SITE.timezone

/**
 * Intl output can differ between ICU versions — Node and the browser sometimes
 * disagree on narrow no-break spaces (U+202F / U+00A0) around AM/PM. That is
 * invisible to a reader but produces a React hydration mismatch, so every
 * formatter here is normalised to plain spaces.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/[\u202f\u00a0\u2009\u2007]/g, ' ')
}

export function formatDate(date: Date | string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    }).format(new Date(date)),
  )
}

export function formatShortDate(date: Date | string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: TZ,
    }).format(new Date(date)),
  )
}

export function formatTime(date: Date | string): string {
  return normalizeSpaces(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: TZ,
    }).format(new Date(date)),
  ).toUpperCase()
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`
}

export function dayParts(date: Date | string) {
  const d = new Date(date)
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    normalizeSpaces(new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: TZ }).format(d))
  return {
    day: fmt({ day: '2-digit' }),
    month: fmt({ month: 'short' }).toUpperCase(),
    weekday: fmt({ weekday: 'short' }).toUpperCase(),
  }
}

/**
 * A stable YYYY-MM-DD key for a date, in the community's timezone.
 *
 * The calendar groups by this. It is always computed on the server and passed
 * to the client as a string: deriving "today" in the browser would give a
 * different answer for anyone outside Dubai and would not match what the server
 * rendered.
 */
export function dateKey(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now()
}

export function countdownParts(target: Date | string) {
  const diff = new Date(target).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return { days, hours, minutes }
}

/**
 * Converts a `datetime-local` input value (which has no timezone) into a real
 * Date, interpreting the wall-clock time as Asia/Dubai. Dubai has no DST, so a
 * fixed +04:00 offset is correct year-round.
 */
export function dubaiLocalToDate(value: string): Date {
  return new Date(`${value.length === 16 ? `${value}:00` : value}+04:00`)
}

/** Inverse of the above — formats a Date for a `datetime-local` input. */
export function dateToDubaiLocal(date: Date | string): string {
  const d = new Date(date)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

/* -------------------------------------------------------------------------- */
/*  Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function formatPrice(price: string | number, currency = 'AED'): string {
  const n = typeof price === 'string' ? Number.parseFloat(price) : price
  if (!Number.isFinite(n) || n <= 0) return 'Free'
  return `${currency} ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`
}

export function initials(first: string, last: string): string {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase()
}

/** "Sarah A." — keeps the public attendee list friendly but not fully identifying. */
export function publicName(first: string, last: string): string {
  const l = last.trim()
  return l ? `${first.trim()} ${l.charAt(0).toUpperCase()}.` : first.trim()
}

export function normalizeInstagram(handle: string | null | undefined): string | null {
  if (!handle) return null
  const cleaned = handle
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/+$/, '')
    .replace(/^@/, '')
  return cleaned ? `@${cleaned}` : null
}

export function instagramUrl(handle: string | null | undefined): string | null {
  const h = normalizeInstagram(handle)
  return h ? `https://instagram.com/${h.slice(1)}` : null
}
