import Link from 'next/link'

import { BrandedImage } from '@/components/ui/branded-image'
import type { ActivityWithCount } from '@/lib/queries'
import { CATEGORIES, DIFFICULTIES } from '@/lib/constants'
import { cn, dayParts, formatPrice, formatTime, isPast } from '@/lib/utils'

export function ActivityCard({
  activity,
  className,
}: {
  activity: ActivityWithCount
  className?: string
}) {
  const cat = CATEGORIES[activity.category]
  const diff = DIFFICULTIES[activity.difficulty]
  const { day, month, weekday } = dayParts(activity.startsAt)
  const past = isPast(activity.startsAt)
  const spotsLeft =
    activity.capacity && activity.capacity > 0 ? activity.capacity - activity.attendeeCount : null
  const full = spotsLeft !== null && spotsLeft <= 0

  return (
    <Link
      href={`/activities/${activity.slug}`}
      className={cn('card card-hover group relative flex flex-col overflow-hidden', className)}
    >
      {/* Cover — the branded placeholder holds the space until (or unless) the
          real image arrives, so a slow or dead URL never leaves a blank box. */}
      <div className="relative h-44 overflow-hidden">
        <BrandedImage
          src={activity.coverImage}
          alt=""
          category={activity.category}
          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
        />

        {/* Date chip */}
        <div className="absolute left-4 top-4 rounded-2xl bg-white/95 px-3 py-2 text-center shadow-[0_8px_24px_-10px_rgba(4,30,58,0.5)] backdrop-blur">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand">
            {weekday}
          </div>
          <div className="font-display text-2xl font-bold leading-none text-deep">{day}</div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-tide">
            {month}
          </div>
        </div>

        <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
          <span className="chip bg-white/95 text-brand-deeper backdrop-blur">
            {cat.emoji} {cat.label}
          </span>
          {past && <span className="chip bg-deep/85 text-foam backdrop-blur">Completed</span>}
          {!past && full && <span className="chip bg-coral text-white">Full</span>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-deep transition-colors group-hover:text-brand">
          {activity.title}
        </h3>
        {activity.tagline && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-tide/85">
            {activity.tagline}
          </p>
        )}

        <dl className="mt-4 space-y-2 text-sm text-tide">
          <Row icon={<ClockIcon />}>{formatTime(activity.startsAt)}</Row>
          <Row icon={<PinIcon />}>
            <span className="line-clamp-1">{activity.location}</span>
          </Row>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-foam/70 pt-4">
          <span className="chip bg-mist text-brand-deeper">
            {formatPrice(activity.price, activity.currency)}
          </span>
          <span className="chip bg-mist text-brand-deeper">
            <DifficultyDots level={diff.dots} /> {diff.label}
          </span>
          <span className="ml-auto chip bg-kelp/12 text-kelp">
            {activity.attendeeCount} going
            {spotsLeft !== null && spotsLeft > 0 && (
              <span className="font-normal text-tide/70"> · {spotsLeft} left</span>
            )}
          </span>
        </div>
      </div>

      {/* Hover sheen */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand via-surf to-crest transition-transform duration-500 group-hover:scale-x-100"
      />
    </Link>
  )
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 shrink-0 place-items-center text-brand">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

export function DifficultyDots({ level }: { level: number }) {
  if (level === 0) return <span aria-hidden>✦</span>
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            n <= level ? 'bg-brand' : 'bg-brand/25',
          )}
        />
      ))}
    </span>
  )
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.6V8l2.4 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14.5s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.4" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
