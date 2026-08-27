import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AttendeeList } from '@/components/activities/attendees'
import { MapPanel } from '@/components/activities/map-panel'
import { DifficultyDots } from '@/components/activities/activity-card'
import { RegistrationForm, type Prefill } from '@/components/activities/registration-form'
import { BrandedImage } from '@/components/ui/branded-image'
import { Reveal } from '@/components/ui/reveal'
import { getCurrentUser } from '@/lib/auth'
import { CATEGORIES, DIFFICULTIES } from '@/lib/constants'
import { getActivityBySlug, getPublicAttendees, getUserRegistration } from '@/lib/queries'
import {
  countdownParts,
  dayParts,
  formatPrice,
  formatTime,
  isPast,
  normalizeInstagram,
} from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const activity = await getActivityBySlug(slug).catch(() => null)
  if (!activity) return { title: 'Activity not found' }

  return {
    title: activity.title,
    description:
      activity.tagline ??
      `${CATEGORIES[activity.category].label} with TIBID Community — ${activity.location}.`,
    openGraph: {
      title: activity.title,
      description: activity.tagline ?? undefined,
      images: activity.coverImage ? [{ url: activity.coverImage }] : undefined,
    },
  }
}

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ joined?: string }>
}) {
  const { slug } = await params
  const { joined } = await searchParams
  const activity = await getActivityBySlug(slug).catch(() => null)
  if (!activity) notFound()

  const user = await getCurrentUser().catch(() => null)

  if (!activity.published && user?.role !== 'admin') notFound()

  const [attendees, existing] = await Promise.all([
    getPublicAttendees(activity.id).catch(() => []),
    user ? getUserRegistration(activity.id, user.id).catch(() => null) : Promise.resolve(null),
  ])

  const cat = CATEGORIES[activity.category]
  const diff = DIFFICULTIES[activity.difficulty]
  const { day, month, weekday } = dayParts(activity.startsAt)
  const past = isPast(activity.startsAt)
  const countdown = countdownParts(activity.startsAt)
  const spotsLeft =
    activity.capacity && activity.capacity > 0 ? activity.capacity - attendees.length : null

  const prefill: Prefill | null = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? '',
        gender: user.gender ?? '',
        instagram: normalizeInstagram(user.instagram) ?? '',
        emergencyContactName: user.emergencyContactName ?? '',
        emergencyContactPhone: user.emergencyContactPhone ?? '',
        healthNotes: user.healthNotes ?? '',
        isTibidMember: user.isTibidMember,
        photoConsent: user.photoConsent,
      }
    : null

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 h-[34rem]">
          <BrandedImage
            src={activity.coverImage}
            alt=""
            category={activity.category}
            priority
            showLogo={false}
            className="h-full w-full"
          />
          {/*
            Explicit stops rather than a two-stop gradient: the title and tagline
            sit around 70-75% of this box, so the fade to the page background is
            held back until below them. A simple `to-shell` washes the tagline out.
          */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(2,16,31,0.80) 0%, rgba(2,16,31,0.66) 45%, rgba(2,16,31,0.52) 72%, rgba(2,16,31,0.28) 88%, #F6FBFF 100%)',
            }}
          />
        </div>

        <div className="container-tibid relative pb-8 pt-10">
          <Reveal>
            <Link
              href={`/activities?category=${activity.category}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-crest transition hover:text-white"
            >
              ← All {cat.label.toLowerCase()} sessions
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="chip bg-white/95 text-brand-deeper">
                {cat.emoji} {cat.label}
              </span>
              {!activity.published && (
                <span className="chip bg-sand text-deep">Draft — admins only</span>
              )}
              {past && <span className="chip bg-white/20 text-white backdrop-blur">Completed</span>}
              {!past && spotsLeft !== null && spotsLeft <= 0 && (
                <span className="chip bg-coral text-white">Full — waitlist open</span>
              )}
              {!past && countdown && (
                <span className="chip bg-kelp text-white">
                  In {countdown.days > 0 ? `${countdown.days}d ` : ''}
                  {countdown.hours}h {countdown.minutes}m
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.1rem,5.6vw,3.9rem)] font-extrabold leading-[1.03] text-white drop-shadow-sm">
              {activity.title}
            </h1>
            {activity.tagline && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foam/95">
                {activity.tagline}
              </p>
            )}
          </Reveal>

          {/* Key facts */}
          <Reveal delay={0.12} className="mt-9">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Fact
                icon="📅"
                label="Date"
                value={`${weekday} ${day} ${month}`}
                sub={new Date(activity.startsAt).getFullYear().toString()}
              />
              <Fact
                icon="⏰"
                label="Starts"
                value={formatTime(activity.startsAt)}
                sub={activity.endsAt ? `Until ${formatTime(activity.endsAt)}` : 'UAE time'}
              />
              <Fact
                icon="💳"
                label="Price"
                value={formatPrice(activity.price, activity.currency)}
                sub={Number(activity.price) > 0 ? 'Payable on the day' : 'No charge to join'}
              />
              <Fact
                icon="📈"
                label="Difficulty"
                value={diff.label}
                sub={
                  activity.capacity
                    ? `${attendees.length}/${activity.capacity} signed up`
                    : `${attendees.length} signed up`
                }
                extra={<DifficultyDots level={diff.dots} />}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------ Content ------------------------------ */}
      <section className="pb-8">
        <div className="container-tibid">
          <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr]">
            {/* Left column */}
            <div className="space-y-8">
              {activity.description && (
                <Reveal>
                  <div className="card p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold text-deep">About this session</h2>
                    <div className="mt-4 space-y-3.5 leading-relaxed text-tide">
                      {activity.description
                        .split(/\n{2,}|\n/)
                        .filter(Boolean)
                        .map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                    </div>

                    {activity.whatToBring && (
                      <div className="mt-6 rounded-2xl border border-brand/15 bg-mist/60 p-5">
                        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-brand-deeper">
                          What to bring
                        </h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tide">
                          {activity.whatToBring}
                        </p>
                      </div>
                    )}
                  </div>
                </Reveal>
              )}

              {past ? (
                <Reveal>
                  <div className="card p-8 text-center">
                    <div className="text-4xl">🌊</div>
                    <h2 className="mt-4 font-display text-xl font-bold text-deep">
                      This one has already happened
                    </h2>
                    <p className="mx-auto mt-2 max-w-md leading-relaxed text-tide">
                      Thanks to everyone who showed up. Have a look at what&rsquo;s coming next.
                    </p>
                    <Link href="/activities" className="btn btn-primary mt-6">
                      See upcoming activities
                    </Link>
                  </div>
                </Reveal>
              ) : joined || (existing && existing.status !== 'cancelled') ? (
                <ConfirmedCard
                  justJoined={Boolean(joined)}
                  waitlisted={joined === 'waitlist' || existing?.status === 'waitlist'}
                  activityTitle={activity.title}
                  whenLabel={`${weekday} ${day} ${month} at ${formatTime(activity.startsAt)}`}
                />
              ) : (
                <RegistrationForm
                  activityId={activity.id}
                  participationLabel={activity.participationLabel}
                  participationOptions={activity.participationOptions}
                  prefill={prefill}
                  isSignedIn={Boolean(user)}
                  loginHref={`/login?next=/activities/${activity.slug}`}
                />
              )}
            </div>

            {/* Right column */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <MapPanel
                mapLink={activity.mapLink}
                location={activity.location}
                meetingPoint={activity.meetingPoint}
              />

              <AttendeeList
                attendees={attendees}
                isPublic={activity.attendeesPublic}
                capacity={activity.capacity}
              />

              {!past && (
                <a href="#register" className="btn btn-primary w-full !py-3.5 lg:hidden">
                  Sign up for this activity
                </a>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * One card covers both "you just signed up" and "you signed up earlier" —
 * so the celebratory state is server-rendered and never flashes.
 */
function ConfirmedCard({
  justJoined,
  waitlisted,
  activityTitle,
  whenLabel,
}: {
  justJoined: boolean
  waitlisted: boolean
  activityTitle: string
  whenLabel: string
}) {
  const heading = waitlisted
    ? "You're on the waitlist"
    : justJoined
      ? "You're in! See you there."
      : "You're already signed up"

  const body = waitlisted
    ? "This one is at capacity, so you're first in the queue — we'll message you the moment a spot frees up."
    : justJoined
      ? `Your name is on the list for ${activityTitle}. See you on ${whenLabel}.`
      : `See you on ${whenLabel}.`

  return (
    <Reveal>
      <div
        className="card relative scroll-mt-28 overflow-hidden p-8 text-center sm:p-12"
        id="register"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(30rem 16rem at 50% -10%, rgba(18,178,143,0.18), transparent 65%)',
          }}
        />
        <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-kelp to-brand text-4xl text-white shadow-tide">
          {waitlisted ? '⏳' : '🌊'}
        </div>

        <h2 className="relative mt-7 font-display text-2xl font-extrabold text-deep sm:text-3xl">
          {heading}
        </h2>
        <p className="relative mx-auto mt-3 max-w-md leading-relaxed text-tide">{body}</p>

        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/profile#my-activities" className="btn btn-primary">
            Manage my activities
          </Link>
          <Link href="/activities" className="btn btn-outline">
            Find another activity
          </Link>
        </div>
      </div>
    </Reveal>
  )
}

function Fact({
  icon,
  label,
  value,
  sub,
  extra,
}: {
  icon: string
  label: string
  value: string
  sub?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl border border-white/40 p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 flex items-center gap-2 font-display text-lg font-bold text-deep">
        {value}
        {extra}
      </div>
      {sub && <div className="mt-0.5 text-xs text-tide/80">{sub}</div>}
    </div>
  )
}
