'use server'

import { and, count, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { db, activities, registrations, users } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { appendRegistration, sheetsConfigured } from '@/lib/google-sheets'
import { flattenErrors, registrationSchema, type FieldErrors } from '@/lib/validation'

export type RegistrationState = {
  ok?: boolean
  message?: string
  errors?: FieldErrors
}

export async function registerForActivityAction(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const parsed = registrationSchema.safeParse({
    activityId: formData.get('activityId'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    gender: formData.get('gender') || undefined,
    phone: formData.get('phone'),
    email: formData.get('email'),
    instagram: formData.get('instagram') || undefined,
    participationChoice: formData.get('participationChoice') || undefined,
    emergencyContactName: formData.get('emergencyContactName') || undefined,
    emergencyContactPhone: formData.get('emergencyContactPhone') || undefined,
    healthNotes: formData.get('healthNotes') || undefined,
    isTibidMember: formData.get('isTibidMember') === 'yes',
    photoConsent: formData.get('photoConsent') === 'on',
    agreedToTerms: formData.get('agreedToTerms') === 'on',
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }
  const d = parsed.data

  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, d.activityId))
    .limit(1)

  if (!activity || !activity.published) {
    return { errors: { _form: 'That activity is no longer open for sign-ups.' } }
  }

  if (activity.startsAt.getTime() < Date.now()) {
    return { errors: { _form: 'This activity has already taken place.' } }
  }

  // Duplicate check (also enforced by a unique index, but this gives a nicer message)
  const [dupe] = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(
        eq(registrations.activityId, activity.id),
        sql`lower(${registrations.email}) = ${d.email}`,
      ),
    )
    .limit(1)

  if (dupe) {
    return {
      errors: {
        email: 'That email is already on the list for this activity. See you there!',
      },
    }
  }

  // Capacity → waitlist rather than a hard rejection
  let status: 'going' | 'waitlist' = 'going'
  if (activity.capacity && activity.capacity > 0) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(registrations)
      .where(
        and(eq(registrations.activityId, activity.id), eq(registrations.status, 'going')),
      )
    if (n >= activity.capacity) status = 'waitlist'
  }

  const user = await getCurrentUser().catch(() => null)

  let created
  try {
    ;[created] = await db
      .insert(registrations)
      .values({
        activityId: activity.id,
        userId: user?.id ?? null,
        firstName: d.firstName,
        lastName: d.lastName,
        gender: d.gender,
        phone: d.phone,
        email: d.email,
        instagram: d.instagram || null,
        participationChoice: d.participationChoice || null,
        emergencyContactName: d.emergencyContactName || null,
        emergencyContactPhone: d.emergencyContactPhone || null,
        healthNotes: d.healthNotes || null,
        isTibidMember: d.isTibidMember,
        photoConsent: d.photoConsent,
        agreedToTerms: d.agreedToTerms,
        status,
      })
      .returning()
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('registrations_activity_email_unique')) {
      return { errors: { email: 'That email is already on the list for this activity.' } }
    }
    throw error
  }

  // Keep the member's profile in sync so next time is even faster.
  if (user) {
    await db
      .update(users)
      .set({
        phone: d.phone,
        gender: d.gender,
        instagram: d.instagram || user.instagram,
        emergencyContactName: d.emergencyContactName || user.emergencyContactName,
        emergencyContactPhone: d.emergencyContactPhone || user.emergencyContactPhone,
        healthNotes: d.healthNotes || user.healthNotes,
        isTibidMember: d.isTibidMember || user.isTibidMember,
        photoConsent: d.photoConsent,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .catch(() => undefined)
  }

  // Mirror into Google Sheets. Never block or fail the sign-up on this.
  if (sheetsConfigured()) {
    try {
      await appendRegistration(created, activity)
      await db
        .update(registrations)
        .set({ sheetSynced: true, sheetSyncError: null })
        .where(eq(registrations.id, created.id))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('[sheets] append failed:', message)
      await db
        .update(registrations)
        .set({ sheetSynced: false, sheetSyncError: message.slice(0, 500) })
        .where(eq(registrations.id, created.id))
        .catch(() => undefined)
    }
  }

  revalidatePath(`/activities/${activity.slug}`)
  revalidatePath('/activities')
  revalidatePath('/')

  // Redirect rather than returning a client-side success state. Revalidation
  // re-renders this route, which would otherwise swap a client success card for
  // the server's "already registered" branch a moment later — a visible flash.
  // Confirming server-side means one render, no flash, and a shareable URL.
  redirect(`/activities/${activity.slug}?joined=${status}`)
}

export async function cancelRegistrationAction(registrationId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const [row] = await db
    .select({ registration: registrations, slug: activities.slug })
    .from(registrations)
    .innerJoin(activities, eq(registrations.activityId, activities.id))
    .where(eq(registrations.id, registrationId))
    .limit(1)

  if (!row) return
  if (row.registration.userId !== user.id && user.role !== 'admin') return

  await db
    .update(registrations)
    .set({ status: 'cancelled' })
    .where(eq(registrations.id, registrationId))

  revalidatePath(`/activities/${row.slug}`)
  revalidatePath('/profile')
}
