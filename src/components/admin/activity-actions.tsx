'use client'

import { useTransition } from 'react'

import { Spinner } from '@/components/ui/form'
import {
  deleteActivityAction,
  duplicateActivityAction,
  togglePublishAction,
} from '@/lib/actions/activities'

export function ActivityActions({
  activityId,
  published,
  slug,
}: {
  activityId: string
  published: boolean
  slug: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Spinner className="text-brand" />}

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void togglePublishAction(activityId))}
        className={`btn !py-2 !text-sm ${published ? 'btn-outline' : 'btn-primary'}`}
      >
        {published ? 'Unpublish' : 'Publish now'}
      </button>

      <a
        href={`/activities/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-ghost !py-2 !text-sm"
      >
        Preview ↗
      </a>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => void duplicateActivityAction(activityId))}
        className="btn btn-ghost !py-2 !text-sm"
        title="Creates an unpublished copy scheduled one week later"
      >
        Duplicate for next week
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              'Delete this activity and every registration attached to it? This cannot be undone.',
            )
          ) {
            startTransition(() => void deleteActivityAction(activityId))
          }
        }}
        className="btn !py-2 !text-sm text-coral hover:bg-coral/10"
      >
        Delete
      </button>
    </div>
  )
}
