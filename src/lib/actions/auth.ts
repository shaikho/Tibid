'use server'

import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { db, users } from '@/db'
import { createSessionCookie, destroySessionCookie, getCurrentUser } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/password'
import {
  flattenErrors,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  signUpSchema,
  type FieldErrors,
} from '@/lib/validation'

export type FormState = {
  ok?: boolean
  message?: string
  errors?: FieldErrors
}

/** Emails listed in ADMIN_EMAILS become admins automatically when they sign up. */
function isBootstrapAdmin(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === 'string' ? value : ''
  // Only allow same-site relative paths — never an absolute URL.
  return raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
}

/* -------------------------------------------------------------------------- */

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone') || undefined,
    gender: formData.get('gender') || undefined,
    instagram: formData.get('instagram') || undefined,
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }
  const data = parsed.data

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${data.email}`)
    .limit(1)

  if (existing) {
    return {
      errors: { email: 'That email already has a profile. Try signing in instead.' },
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      gender: data.gender ?? null,
      instagram: data.instagram || null,
      role: isBootstrapAdmin(data.email) ? 'admin' : 'member',
    })
    .returning()

  await createSessionCookie(created)
  redirect(safeNext(formData.get('next')))
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${parsed.data.email}`)
    .limit(1)

  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false

  if (!user || !valid) {
    return { errors: { _form: 'That email and password combination did not work.' } }
  }

  await createSessionCookie(user)
  redirect(safeNext(formData.get('next')))
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie()
  redirect('/')
}

/* -------------------------------------------------------------------------- */

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { errors: { _form: 'Please sign in again.' } }

  const parsed = profileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone') || undefined,
    gender: formData.get('gender') || undefined,
    instagram: formData.get('instagram') || undefined,
    emergencyContactName: formData.get('emergencyContactName') || undefined,
    emergencyContactPhone: formData.get('emergencyContactPhone') || undefined,
    healthNotes: formData.get('healthNotes') || undefined,
    isTibidMember: formData.get('isTibidMember') === 'on',
    photoConsent: formData.get('photoConsent') === 'on',
    bio: formData.get('bio') || undefined,
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }
  const d = parsed.data

  await db
    .update(users)
    .set({
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone || null,
      gender: d.gender ?? null,
      instagram: d.instagram || null,
      emergencyContactName: d.emergencyContactName || null,
      emergencyContactPhone: d.emergencyContactPhone || null,
      healthNotes: d.healthNotes || null,
      isTibidMember: d.isTibidMember ?? false,
      photoConsent: d.photoConsent ?? false,
      bio: d.bio || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  // Refresh the cookie so the nav shows the new name.
  const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1)
  if (fresh) await createSessionCookie(fresh)

  return { ok: true, message: 'Profile saved. Your next sign-up will fill itself in.' }
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { errors: { _form: 'Please sign in again.' } }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return { errors: { currentPassword: 'That is not your current password.' } }

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.newPassword),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  return { ok: true, message: 'Password updated.' }
}
