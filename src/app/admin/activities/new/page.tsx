import { ActivityForm } from '@/components/admin/activity-form'
import { createActivityAction } from '@/lib/actions/activities'

export const dynamic = 'force-dynamic'

export default function NewActivityPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-extrabold text-deep">Create an activity</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-tide">
          Fill this in and hit save. Leave it unpublished while you&rsquo;re still tweaking — nobody
          sees it until you tick “Publish”.
        </p>
      </div>

      <ActivityForm action={createActivityAction} submitLabel="Create activity" />
    </div>
  )
}
