'use server'

import { and, eq, ne, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db, activities, registrations } from '@/db'
import { requireAdmin } from '@/lib/auth'
import { appendRegistrations, sheetsConfigured } from '@/lib/google-sheets'
import { activitySchema, flattenErrors, type FieldErrors } from '@/lib/validation'
import { dubaiLocalToDate, slugify } from '@/lib/utils'

export type ActivityFormState = {
  ok?: boolean
  message?: string
  errors?: FieldErrors
}

function parseForm(formData: FormData) {
  return activitySchema.safeParse({
    category: formData.get('category'),
    title: formData.get('title'),
    tagline: formData.get('tagline') || undefined,
    description: formData.get('description') || undefined,
    location: formData.get('location'),
    meetingPoint: formData.get('meetingPoint') || undefined,
    mapLink: formData.get('mapLink') || undefined,
    startsAt: formData.get('startsAt'),
    endsAt: formData.get('endsAt') || undefined,
    price: formData.get('price') || 0,
    currency: formData.get('currency') || 'AED',
    difficulty: formData.get('difficulty') || 'all_levels',
    capacity: formData.get('capacity') || undefined,
    coverImage: formData.get('coverImage') || undefined,
    participationLabel: formData.get('participationLabel') || undefined,
    participationOptions: String(formData.get('participationOptions') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    whatToBring: formData.get('whatToBring') || undefined,
    published: formData.get('published') === 'on',
    attendeesPublic: formData.get('attendeesPublic') === 'on',
  })
}

/** Finds a slug that isn't taken, appending -2, -3, … if needed. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'activity'
  for (let i = 0; i < 60; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const where = excludeId
      ? and(eq(activities.slug, candidate), ne(activities.id, excludeId))
      : eq(activities.slug, candidate)
    const [hit] = await db.select({ id: activities.id }).from(activities).where(where).limit(1)
    if (!hit) return candidate
  }
  return `${root}-${Date.now().toString(36)}`
}

/* -------------------------------------------------------------------------- */

export async function createActivityAction(
  _prev: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const admin = await requireAdmin()
  const parsed = parseForm(formData)
  if (!parsed.success) return { errors: flattenErrors(parsed.error) }
  const d = parsed.data

  const startsAt = dubaiLocalToDate(d.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return { errors: { startsAt: 'That date and time could not be read.' } }
  }
  const endsAt = d.endsAt ? dubaiLocalToDate(d.endsAt) : null
  if (endsAt && endsAt <= startsAt) {
    return { errors: { endsAt: 'The end time has to be after the start time.' } }
  }

  const [created] = await db
    .insert(activities)
    .values({
      slug: await uniqueSlug(`${d.title}-${d.startsAt.slice(0, 10)}`),
      category: d.category,
      title: d.title,
      tagline: d.tagline || null,
      description: d.description || null,
      location: d.location,
      meetingPoint: d.meetingPoint || null,
      mapLink: d.mapLink || null,
      startsAt,
      endsAt,
      price: String(d.price ?? 0),
      currency: d.currency || 'AED',
      difficulty: d.difficulty,
      capacity: d.capacity && d.capacity > 0 ? d.capacity : null,
      coverImage: d.coverImage || null,
      participationLabel: d.participationLabel || null,
      participationOptions: d.participationOptions,
      whatToBring: d.whatToBring || null,
      published: d.published,
      attendeesPublic: d.attendeesPublic,
      createdBy: admin.id,
    })
    .returning()

  revalidatePath('/')
  revalidatePath('/activities')
  revalidatePath('/admin')
  redirect(`/admin/activities/${created.id}?created=1`)
}

export async function updateActivityAction(
  activityId: string,
  _prev: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  await requireAdmin()
  const parsed = parseForm(formData)
  if (!parsed.success) return { errors: flattenErrors(parsed.error) }
  const d = parsed.data

  const startsAt = dubaiLocalToDate(d.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return { errors: { startsAt: 'That date and time could not be read.' } }
  }
  const endsAt = d.endsAt ? dubaiLocalToDate(d.endsAt) : null
  if (endsAt && endsAt <= startsAt) {
    return { errors: { endsAt: 'The end time has to be after the start time.' } }
  }

  const [existing] = await db
    .select({ slug: activities.slug, title: activities.title })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)

  if (!existing) return { errors: { _form: 'That activity no longer exists.' } }

  const slug =
    existing.title === d.title
      ? existing.slug
      : await uniqueSlug(`${d.title}-${d.startsAt.slice(0, 10)}`, activityId)

  await db
    .update(activities)
    .set({
      slug,
      category: d.category,
      title: d.title,
      tagline: d.tagline || null,
      description: d.description || null,
      location: d.location,
      meetingPoint: d.meetingPoint || null,
      mapLink: d.mapLink || null,
      startsAt,
      endsAt,
      price: String(d.price ?? 0),
      currency: d.currency || 'AED',
      difficulty: d.difficulty,
      capacity: d.capacity && d.capacity > 0 ? d.capacity : null,
      coverImage: d.coverImage || null,
      participationLabel: d.participationLabel || null,
      participationOptions: d.participationOptions,
      whatToBring: d.whatToBring || null,
      published: d.published,
      attendeesPublic: d.attendeesPublic,
      updatedAt: new Date(),
    })
    .where(eq(activities.id, activityId))

  revalidatePath('/')
  revalidatePath('/activities')
  revalidatePath(`/activities/${slug}`)
  revalidatePath('/admin')
  revalidatePath(`/admin/activities/${activityId}`)

  return { ok: true, message: 'Saved.' }
}

export async function togglePublishAction(activityId: string): Promise<void> {
  await requireAdmin()

  const [row] = await db
    .select({ published: activities.published, slug: activities.slug })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)

  if (!row) return

  await db
    .update(activities)
    .set({ published: !row.published, updatedAt: new Date() })
    .where(eq(activities.id, activityId))

  revalidatePath('/')
  revalidatePath('/activities')
  revalidatePath(`/activities/${row.slug}`)
  revalidatePath('/admin')
  revalidatePath('/admin/activities')
}

export async function deleteActivityAction(activityId: string): Promise<void> {
  await requireAdmin()
  await db.delete(activities).where(eq(activities.id, activityId))

  revalidatePath('/')
  revalidatePath('/activities')
  revalidatePath('/admin')
  redirect('/admin/activities?deleted=1')
}

export async function duplicateActivityAction(activityId: string): Promise<void> {
  const admin = await requireAdmin()

  const [source] = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1)
  if (!source) return

  // Same session, one week later — the usual weekly-repeat case.
  const nextWeek = new Date(source.startsAt.getTime() + 7 * 86_400_000)

  const [copy] = await db
    .insert(activities)
    .values({
      ...source,
      id: undefined,
      slug: await uniqueSlug(`${source.title}-${nextWeek.toISOString().slice(0, 10)}`),
      startsAt: nextWeek,
      endsAt: source.endsAt ? new Date(source.endsAt.getTime() + 7 * 86_400_000) : null,
      published: false,
      createdBy: admin.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  revalidatePath('/admin/activities')
  redirect(`/admin/activities/${copy.id}?duplicated=1`)
}

/* -------------------------------------------------------------------------- */
/*  Registration management                                                    */
/* -------------------------------------------------------------------------- */

export async function setRegistrationStatusAction(
  registrationId: string,
  status: 'going' | 'waitlist' | 'cancelled',
): Promise<void> {
  await requireAdmin()
  await db.update(registrations).set({ status }).where(eq(registrations.id, registrationId))
  revalidatePath('/admin')
}

export async function toggleCheckInAction(registrationId: string): Promise<void> {
  await requireAdmin()
  await db
    .update(registrations)
    .set({ checkedIn: sql`NOT ${registrations.checkedIn}` })
    .where(eq(registrations.id, registrationId))
  revalidatePath('/admin')
}

export async function deleteRegistrationAction(registrationId: string): Promise<void> {
  await requireAdmin()
  await db.delete(registrations).where(eq(registrations.id, registrationId))
  revalidatePath('/admin')
}

/** Pushes every not-yet-synced registration into the Google Sheet. */
export async function resyncSheetsAction(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin()

  if (!sheetsConfigured()) {
    return { ok: false, message: 'Google Sheets is not configured yet.' }
  }

  const pending = await db
    .select({ registration: registrations, activity: activities })
    .from(registrations)
    .innerJoin(activities, eq(registrations.activityId, activities.id))
    .where(eq(registrations.sheetSynced, false))
    .limit(500)

  if (pending.length === 0) {
    return { ok: true, message: 'Everything is already in the sheet.' }
  }

  try {
    await appendRegistrations(pending)
    await db
      .update(registrations)
      .set({ sheetSynced: true, sheetSyncError: null })
      .where(eq(registrations.sheetSynced, false))

    revalidatePath('/admin')
    return { ok: true, message: `Pushed ${pending.length} registration(s) to the sheet.` }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Sync failed for an unknown reason.',
    }
  }
}
