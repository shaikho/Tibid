import Link from 'next/link'

import { CATEGORIES } from '@/lib/constants'
import { getAdminOverview, getRecentRegistrations, getUpcomingActivities } from '@/lib/queries'
import { sheetsConfigured } from '@/lib/google-sheets'
import { dayParts, formatTime, initials, publicName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const [overview, upcoming, recent] = await Promise.all([
    getAdminOverview().catch(() => null),
    getUpcomingActivities({ limit: 5, includeUnpublished: true }).catch(() => []),
    getRecentRegistrations(8).catch(() => []),
  ])

  if (!overview) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-lg font-bold text-deep">Database not reachable</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-tide">
          Make sure <code className="rounded bg-mist px-1.5 py-0.5">DATABASE_URL</code> is set and
          you have run <code className="rounded bg-mist px-1.5 py-0.5">npm run db:push</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Upcoming activities" value={overview.upcoming} href="/admin/activities" />
        <Stat label="Total registrations" value={overview.totalRegistrations} href="/admin/registrations" />
        <Stat label="Community members" value={overview.members} href="/admin/members" />
        <Stat
          label="Awaiting Sheets sync"
          value={overview.pendingSheetSync}
          href="/admin/settings"
          tone={overview.pendingSheetSync > 0 && sheetsConfigured() ? 'warn' : 'default'}
        />
      </div>

      {!sheetsConfigured() && (
        <div className="rounded-2xl border border-sand/50 bg-sand/15 p-5">
          <h2 className="font-display text-base font-bold text-deep">
            Google Sheets sync isn&rsquo;t switched on yet
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tide">
            Registrations are being saved to the database as normal — they just aren&rsquo;t
            mirrored to your sheet. Add the three Google env vars in Vercel and every future sign-up
            appends automatically. Existing ones can be back-filled from Settings.
          </p>
          <Link href="/admin/settings" className="btn btn-outline mt-4 !py-2 !text-sm">
            Set it up
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-deep">Next up</h2>
            <Link href="/admin/activities" className="text-sm font-semibold text-brand hover:underline">
              All activities →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-tide">
              Nothing scheduled.{' '}
              <Link href="/admin/activities/new" className="font-semibold text-brand hover:underline">
                Create the first activity
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {upcoming.map((a) => {
                const { day, month, weekday } = dayParts(a.startsAt)
                return (
                  <li key={a.id}>
                    <Link
                      href={`/admin/activities/${a.id}`}
                      className="group flex items-center gap-3.5 rounded-2xl border border-foam/80 p-3 transition hover:border-brand/40 hover:bg-mist/50"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mist text-center">
                        <span className="block text-[9px] font-bold uppercase text-brand">
                          {weekday}
                        </span>
                        <span className="block font-display text-base font-bold leading-none text-deep">
                          {day}
                        </span>
                        <span className="block text-[8px] font-semibold uppercase text-tide">
                          {month}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-deep group-hover:text-brand">
                          {a.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-tide">
                          {CATEGORIES[a.category].emoji} {formatTime(a.startsAt)} ·{' '}
                          {a.attendeeCount} signed up
                        </span>
                      </span>
                      {!a.published && <span className="chip shrink-0 bg-sand/40 text-deep">Draft</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-deep">Latest sign-ups</h2>
            <Link href="/admin/registrations" className="text-sm font-semibold text-brand hover:underline">
              All registrations →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-tide">No registrations yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {recent.map(({ registration: r, activity: a }) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper text-[10px] font-bold text-white">
                    {initials(r.firstName, r.lastName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-deep">
                      {publicName(r.firstName, r.lastName)}
                    </span>
                    <span className="block truncate text-xs text-tide">{a.title}</span>
                  </span>
                  {!r.sheetSynced && sheetsConfigured() && (
                    <span className="chip shrink-0 bg-coral/10 text-coral">not synced</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  href,
  tone = 'default',
}: {
  label: string
  value: number
  href: string
  tone?: 'default' | 'warn'
}) {
  return (
    <Link
      href={href}
      className={`card card-hover block p-5 ${tone === 'warn' ? 'border-coral/40 bg-coral/5' : ''}`}
    >
      <div className="font-display text-3xl font-extrabold leading-none text-deep">
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-tide">{label}</div>
    </Link>
  )
}
