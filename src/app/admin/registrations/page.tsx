import { RegistrationsTable } from '@/components/admin/registrations-table'
import { getRecentRegistrations } from '@/lib/queries'
import { formatDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminRegistrationsPage() {
  const rows = await getRecentRegistrations(500).catch(() => [])

  const registrations = rows.map(({ registration, activity }) => ({
    ...registration,
    activityTitle: activity.title,
    submittedAt: formatDateTime(registration.createdAt),
  }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-deep">All registrations</h2>
        <p className="mt-1 text-sm leading-relaxed text-tide">
          Every sign-up across every activity, newest first. Search by name, email, phone or
          activity. Tick the box to check someone in on the day.
        </p>
      </div>

      <RegistrationsTable
        registrations={registrations}
        showActivity
        exportHref="/api/admin/export"
      />
    </div>
  )
}
