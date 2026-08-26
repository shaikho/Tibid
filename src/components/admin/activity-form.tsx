'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import {
  Alert,
  CheckboxField,
  Field,
  SelectField,
  SubmitButton,
  TextArea,
  TextField,
} from '@/components/ui/form'
import type { Activity, Category } from '@/db/schema'
import type { ActivityFormState } from '@/lib/actions/activities'
import {
  CATEGORIES,
  CATEGORY_ORDER,
  DEFAULT_PARTICIPATION,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
} from '@/lib/constants'
import { buildEmbedUrl } from '@/lib/maps'
import { cn, dateToDubaiLocal } from '@/lib/utils'

const initial: ActivityFormState = {}

type Action = (prev: ActivityFormState, formData: FormData) => Promise<ActivityFormState>

export function ActivityForm({
  action,
  activity,
  submitLabel,
}: {
  action: Action
  activity?: Activity
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, initial)

  const [category, setCategory] = useState<Category>(activity?.category ?? 'running')
  const [mapLink, setMapLink] = useState(activity?.mapLink ?? '')
  const [participationLabel, setParticipationLabel] = useState(
    activity?.participationLabel ?? DEFAULT_PARTICIPATION.running.label,
  )
  const [participationOptions, setParticipationOptions] = useState(
    activity?.participationOptions?.join('\n') ?? DEFAULT_PARTICIPATION.running.options.join('\n'),
  )

  function onCategoryChange(next: Category) {
    setCategory(next)
    // Only auto-fill participation defaults for a brand-new activity.
    if (!activity) {
      setParticipationLabel(DEFAULT_PARTICIPATION[next].label)
      setParticipationOptions(DEFAULT_PARTICIPATION[next].options.join('\n'))
    }
  }

  const preview = mapLink ? buildEmbedUrl(mapLink, mapLink) : null

  return (
    <form action={formAction} className="space-y-6">
      {state.errors?._form && <Alert>{state.errors._form}</Alert>}
      {state.ok && <Alert tone="success">{state.message}</Alert>}

      {/* ----------------------- Category ----------------------- */}
      <Panel title="Category" subtitle="Which of the five TIBID formats is this?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onCategoryChange(c)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] px-3 py-4 text-sm font-semibold transition-all',
                category === c
                  ? 'border-brand bg-mist text-brand-deeper shadow-[0_0_0_3px_rgba(0,107,212,0.12)]'
                  : 'border-foam bg-white text-tide hover:border-brand/40',
              )}
              aria-pressed={category === c}
            >
              <span className="text-2xl">{CATEGORIES[c].emoji}</span>
              {CATEGORIES[c].label}
            </button>
          ))}
        </div>
        <input type="hidden" name="category" value={category} />
      </Panel>

      {/* ----------------------- The basics ----------------------- */}
      <Panel title="The basics" subtitle="What people see first.">
        <TextField
          label="Activity name"
          name="title"
          required
          placeholder="TIBID Morning Run — Indoor Mallathon"
          defaultValue={activity?.title}
          error={state.errors?.title}
        />

        <TextField
          label="Tagline"
          name="tagline"
          placeholder="Join TIBID for an energising indoor run — you choose your pace!"
          defaultValue={activity?.tagline ?? ''}
          error={state.errors?.tagline}
          hint="One line, shown on the activity card and under the title."
        />

        <TextArea
          label="Description"
          name="description"
          rows={6}
          placeholder={
            'Come for the movement, stay for the connection…\n\nWe start together at the meeting point and finish with coffee.'
          }
          defaultValue={activity?.description ?? ''}
          error={state.errors?.description}
          hint="Blank lines become paragraphs."
        />

        <TextField
          label="Cover image URL"
          name="coverImage"
          type="url"
          placeholder="https://…"
          defaultValue={activity?.coverImage ?? ''}
          error={state.errors?.coverImage}
          hint="Optional. Leave blank for an auto-generated wave gradient in the category colour."
        />
      </Panel>

      {/* ----------------------- Where ----------------------- */}
      <Panel title="Location & meeting point" subtitle="Where everyone gathers.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Location"
            name="location"
            required
            placeholder="Dubai Hills Mall — Ground Floor"
            defaultValue={activity?.location}
            error={state.errors?.location}
          />
          <TextField
            label="Meeting point"
            name="meetingPoint"
            placeholder="Near Center Point"
            defaultValue={activity?.meetingPoint ?? ''}
            error={state.errors?.meetingPoint}
          />
        </div>

        <Field
          label="Google Maps pin link"
          name="mapLink"
          error={state.errors?.mapLink}
          hint="Open Google Maps, drop or tap the pin, hit Share and paste the link. Works with maps.app.goo.gl short links too."
        >
          <input
            id="mapLink"
            name="mapLink"
            type="url"
            value={mapLink}
            onChange={(e) => setMapLink(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
            className={cn('field', state.errors?.mapLink && 'field-error')}
          />
        </Field>

        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden rounded-2xl border border-foam"
          >
            <div className="bg-mist px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand">
              Map preview
            </div>
            <iframe
              key={preview}
              src={preview}
              title="Map preview"
              loading="lazy"
              className="aspect-[16/9] w-full border-0"
            />
          </motion.div>
        )}
      </Panel>

      {/* ----------------------- When ----------------------- */}
      <Panel title="Timing" subtitle="All times are Dubai time (GMT+4).">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Starts at"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={activity ? dateToDubaiLocal(activity.startsAt) : ''}
            error={state.errors?.startsAt}
          />
          <TextField
            label="Ends at"
            name="endsAt"
            type="datetime-local"
            defaultValue={activity?.endsAt ? dateToDubaiLocal(activity.endsAt) : ''}
            error={state.errors?.endsAt}
            hint="Optional."
          />
        </div>
      </Panel>

      {/* ----------------------- Price, difficulty, capacity ----------------------- */}
      <Panel title="Price, difficulty & capacity">
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Price"
            name="price"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            defaultValue={activity ? Number(activity.price) : 0}
            error={state.errors?.price}
            hint="0 shows as “Free”."
          />
          <TextField
            label="Currency"
            name="currency"
            maxLength={6}
            defaultValue={activity?.currency ?? 'AED'}
            error={state.errors?.currency}
          />
          <TextField
            label="Capacity"
            name="capacity"
            type="number"
            min={0}
            placeholder="Unlimited"
            defaultValue={activity?.capacity ?? ''}
            error={state.errors?.capacity}
            hint="Blank or 0 = unlimited. Extra sign-ups go to a waitlist."
          />
        </div>

        <SelectField
          label="Difficulty level"
          name="difficulty"
          required
          placeholder="Choose a level…"
          defaultValue={activity?.difficulty ?? 'all_levels'}
          options={DIFFICULTY_ORDER.map((d) => ({ value: d, label: DIFFICULTIES[d].label }))}
          error={state.errors?.difficulty}
        />
      </Panel>

      {/* ----------------------- Sign-up question ----------------------- */}
      <Panel
        title="Sign-up question"
        subtitle="Asked on the registration form — e.g. “Will you be running or walking?”"
      >
        <Field label="Question" name="participationLabel" error={state.errors?.participationLabel}>
          <input
            id="participationLabel"
            name="participationLabel"
            value={participationLabel}
            onChange={(e) => setParticipationLabel(e.target.value)}
            className="field"
            placeholder="Will you be running or walking?"
          />
        </Field>

        <Field
          label="Answer options"
          name="participationOptions"
          error={state.errors?.participationOptions}
          hint="One option per line. Leave blank to skip this question entirely."
        >
          <textarea
            id="participationOptions"
            name="participationOptions"
            rows={4}
            value={participationOptions}
            onChange={(e) => setParticipationOptions(e.target.value)}
            className="field resize-y"
          />
        </Field>

        <TextArea
          label="What to bring"
          name="whatToBring"
          rows={3}
          placeholder="Water, closed running shoes, a mat…"
          defaultValue={activity?.whatToBring ?? ''}
          error={state.errors?.whatToBring}
        />
      </Panel>

      {/* ----------------------- Visibility ----------------------- */}
      <Panel title="Visibility">
        <CheckboxField
          name="published"
          label="Publish this activity"
          description="Unpublished activities are visible to admins only and cannot be signed up for."
          defaultChecked={activity?.published ?? false}
        />
        <CheckboxField
          name="attendeesPublic"
          label="Show the attendee list publicly"
          description="Everyone sees first names and last initials. Contact details and health notes stay admin-only either way."
          defaultChecked={activity?.attendeesPublic ?? true}
        />
      </Panel>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-foam bg-white/90 p-3 shadow-float backdrop-blur">
        <SubmitButton className="flex-1 !py-3 sm:flex-none sm:!px-10" pendingLabel="Saving…">
          {submitLabel}
        </SubmitButton>
        <Link href="/admin/activities" className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="font-display text-base font-bold text-deep">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-tide">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}
