import type { Metadata } from 'next'
import Link from 'next/link'

import { ProfileForms } from '@/app/profile/profile-forms'
import { SectionLabel } from '@/components/home/sections'
import { Reveal } from '@/components/ui/reveal'
import { OceanBackdrop } from '@/components/ui/waves'
import { requireUser } from '@/lib/auth'
import { CATEGORIES } from '@/lib/constants'
import { getMyRegistrations } from '@/lib/queries'
import { dayParts, formatTime, initials, isPast } from '@/lib/utils'

export const metadata: Metadata = { title: 'My profile' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>
}) {
  const user = await requireUser('/login?next=/profile')
  const [rows, { password }] = await Promise.all([
    getMyRegistrations(user.id).catch(() => []),
    searchParams,
  ])

  const upcoming = rows.filter(
    (r) => !isPast(r.activity.startsAt) && r.registration.status !== 'cancelled',
  )
  const history = rows.filter(
    (r) => isPast(r.activity.startsAt) || r.registration.status === 'cancelled',
  )

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-mist to-shell pb-12 pt-36">
        <OceanBackdrop />
        <div className="container-tibid relative">
          {/* Confirms the reset landed. Rendered server-side from the redirect
              so it survives revalidation rather than flashing and vanishing. */}
          {password === 'updated' && (
            <Reveal className="mb-8">
              <p
                role="status"
                className="rounded-xl border border-kelp/30 bg-kelp/8 px-4 py-3 text-sm font-medium text-kelp"
              >
                Your password has been updated and you are signed in. Anywhere else you were signed
                in has been signed out.
              </p>
            </Reveal>
          )}

          <Reveal className="flex flex-wrap items-center gap-5">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper font-display text-2xl font-bold text-white shadow-tide">
              {initials(user.firstName, user.lastName)}
            </span>
            <div>
              <SectionLabel>Your profile</SectionLabel>
              <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-none text-deep">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-2 text-tide">
                {user.email}
                {user.role === 'admin' && (
                  <Link href="/admin" className="ml-3 chip bg-brand text-white hover:bg-brand-dark">
                    Admin dashboard →
                  </Link>
                )}
              </p>
            </div>
            <div className="ml-auto flex gap-2">
              <Link href="/activities" className="btn btn-primary">
                Find an activity
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-20">
        <div className="container-tibid">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
            <ProfileForms user={user} />

            <div id="my-activities" className="scroll-mt-28 space-y-6">
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-deep">Coming up</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-3 text-sm leading-relaxed text-tide">
                    You&rsquo;re not signed up for anything yet.{' '}
                    <Link href="/activities" className="font-semibold text-brand hover:underline">
                      Have a look at what&rsquo;s on
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {upcoming.map(({ registration, activity }) => (
                      <MyActivityRow
                        key={registration.id}
                        slug={activity.slug}
                        title={activity.title}
                        category={activity.category}
                        startsAt={activity.startsAt}
                        status={registration.status}
                      />
                    ))}
                  </ul>
                )}
              </div>

              {history.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-display text-lg font-bold text-deep">History</h2>
                  <ul className="mt-4 space-y-3 opacity-75">
                    {history.slice(0, 10).map(({ registration, activity }) => (
                      <MyActivityRow
                        key={registration.id}
                        slug={activity.slug}
                        title={activity.title}
                        category={activity.category}
                        startsAt={activity.startsAt}
                        status={registration.status}
                      />
                    ))}
                  </ul>
                  <p className="mt-5 border-t border-foam/70 pt-4 text-xs text-tide/70">
                    {history.length} completed or cancelled sign-up
                    {history.length === 1 ? '' : 's'}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function MyActivityRow({
  slug,
  title,
  category,
  startsAt,
  status,
}: {
  slug: string
  title: string
  category: keyof typeof CATEGORIES
  startsAt: Date
  status: string
}) {
  const { day, month, weekday } = dayParts(startsAt)

  return (
    <li>
      <Link
        href={`/activities/${slug}`}
        className="group flex items-center gap-4 rounded-2xl border border-foam/80 p-3 transition hover:border-brand/40 hover:bg-mist/50"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-mist text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-brand">
            {weekday}
          </span>
          <span className="block font-display text-lg font-bold leading-none text-deep">{day}</span>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-tide">
            {month}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-deep transition group-hover:text-brand">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-tide">
            {CATEGORIES[category].emoji} {CATEGORIES[category].label} · {formatTime(startsAt)}
          </span>
        </span>
        {status !== 'going' && (
          <span
            className={`chip shrink-0 ${
              status === 'waitlist' ? 'bg-sand/40 text-deep' : 'bg-coral/10 text-coral'
            }`}
          >
            {status}
          </span>
        )}
      </Link>
    </li>
  )
}
