import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ActivityActions } from '@/components/admin/activity-actions'
import { ActivityForm } from '@/components/admin/activity-form'
import { RegistrationsTable } from '@/components/admin/registrations-table'
import { updateActivityAction } from '@/lib/actions/activities'
import { CATEGORIES } from '@/lib/constants'
import { getActivityById, getRegistrationsForActivity } from '@/lib/queries'
import { formatDateTime, formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ManageActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; duplicated?: string }>
}) {
  const { id } = await params
  const { created, duplicated } = await searchParams

  const activity = await getActivityById(id).catch(() => null)
  if (!activity) notFound()

  const registrations = await getRegistrationsForActivity(activity.id).catch(() => [])
  const going = registrations.filter((r) => r.status === 'going').length

  const boundUpdate = updateActivityAction.bind(null, activity.id)

  return (
    <div className="space-y-8">
      {(created || duplicated) && (
        <div className="rounded-2xl border border-kelp/30 bg-kelp/8 px-5 py-4 text-sm font-medium text-kelp">
          {duplicated
            ? 'Copy created — it is scheduled one week later and saved as a draft. Adjust it below, then publish.'
            : 'Activity created. It stays a draft until you publish it.'}
        </div>
      )}

      <header className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-mist text-brand-deeper">
                {CATEGORIES[activity.category].emoji} {CATEGORIES[activity.category].label}
              </span>
              {activity.published ? (
                <span className="chip bg-kelp/12 text-kelp">Live</span>
              ) : (
                <span className="chip bg-sand/40 text-deep">Draft</span>
              )}
              {!activity.attendeesPublic && (
                <span className="chip bg-mist text-tide">Attendee list hidden</span>
              )}
            </div>

            <h2 className="mt-3 font-display text-2xl font-extrabold text-deep">
              {activity.title}
            </h2>
            <p className="mt-1.5 text-sm text-tide">
              {formatDateTime(activity.startsAt)} · {activity.location} ·{' '}
              {formatPrice(activity.price, activity.currency)}
            </p>
          </div>

          <div className="text-right">
            <div className="font-display text-3xl font-extrabold leading-none text-deep">
              {going}
              {activity.capacity ? (
                <span className="text-lg text-tide/60">/{activity.capacity}</span>
              ) : null}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-tide">
              signed up
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-foam pt-5">
          <ActivityActions
            activityId={activity.id}
            published={activity.published}
            slug={activity.slug}
          />
        </div>
      </header>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-deep">Who&rsquo;s coming</h3>
          <Link
            href={`/activities/${activity.slug}`}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Public page →
          </Link>
        </div>

        <RegistrationsTable
          registrations={registrations.map((r) => ({
            ...r,
            submittedAt: formatDateTime(r.createdAt),
          }))}
          exportHref={`/api/admin/export?activityId=${activity.id}`}
        />
      </section>

      <section>
        <h3 className="mb-4 font-display text-lg font-bold text-deep">Edit details</h3>
        <ActivityForm action={boundUpdate} activity={activity} submitLabel="Save changes" />
      </section>
    </div>
  )
}
