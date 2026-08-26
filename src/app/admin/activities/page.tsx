import Link from 'next/link'

import { CATEGORIES, DIFFICULTIES } from '@/lib/constants'
import { getAllActivitiesForAdmin } from '@/lib/queries'
import { formatDateTime, formatPrice, isPast } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminActivitiesPage() {
  const activities = await getAllActivitiesForAdmin().catch(() => [])

  const upcoming = activities.filter((a) => !isPast(a.startsAt))
  const past = activities.filter((a) => isPast(a.startsAt))

  return (
    <div className="space-y-10">
      <Group title="Upcoming & drafts" activities={upcoming} empty="Nothing scheduled yet." />
      {past.length > 0 && <Group title="Past activities" activities={past} empty="" muted />}
    </div>
  )
}

function Group({
  title,
  activities,
  empty,
  muted,
}: {
  title: string
  activities: Awaited<ReturnType<typeof getAllActivitiesForAdmin>>
  empty: string
  muted?: boolean
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-deep">{title}</h2>

      {activities.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-foam p-10 text-center">
          <p className="text-sm text-tide">{empty}</p>
          <Link href="/admin/activities/new" className="btn btn-primary mt-5 !py-2 !text-sm">
            + New activity
          </Link>
        </div>
      ) : (
        <div className={`mt-4 overflow-hidden rounded-2xl border border-foam ${muted ? 'opacity-75' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr className="bg-mist/70 text-left text-xs font-bold uppercase tracking-wide text-tide">
                  <Th>Activity</Th>
                  <Th>When</Th>
                  <Th>Where</Th>
                  <Th>Price</Th>
                  <Th>Level</Th>
                  <Th>Signed up</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-t border-foam/70 bg-white hover:bg-mist/40">
                    <Td>
                      <Link
                        href={`/admin/activities/${a.id}`}
                        className="font-semibold text-deep hover:text-brand"
                      >
                        {a.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-tide">
                        {CATEGORIES[a.category].emoji} {CATEGORIES[a.category].label}
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-tide">{formatDateTime(a.startsAt)}</Td>
                    <Td className="max-w-52 truncate text-tide">{a.location}</Td>
                    <Td className="whitespace-nowrap text-tide">
                      {formatPrice(a.price, a.currency)}
                    </Td>
                    <Td className="whitespace-nowrap text-tide">
                      {DIFFICULTIES[a.difficulty].label}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold text-deep">
                      {a.attendeeCount}
                      {a.capacity ? ` / ${a.capacity}` : ''}
                    </Td>
                    <Td>
                      {a.published ? (
                        <span className="chip bg-kelp/12 text-kelp">Live</span>
                      ) : (
                        <span className="chip bg-sand/40 text-deep">Draft</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Link
                        href={`/admin/activities/${a.id}`}
                        className="text-xs font-semibold text-brand hover:underline"
                      >
                        Manage →
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ''}`}>{children}</td>
}
