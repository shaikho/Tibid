import 'server-only'

import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { db, users, type User } from '@/db'
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from './session'

/** The signed-in user's session claims, or null. Cheap — no DB hit. */
export const getSession = cache(async () => {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
})

/** The full user row for the signed-in user, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession()
  if (!session) return null

  const [user] = await db.select().from(users).where(eq(users.id, session.sub)).limit(1)
  if (!user) return null

  /*
   * Changing the password signs out everywhere else. There is no server-side
   * session table to delete from — the session is a self-contained JWT — so
   * instead any session signed before the password changed is treated as gone.
   * `iat` is in seconds and the stamp is truncated to the second, so the
   * session created by the reset itself is never caught by its own rule.
   */
  if (user.passwordChangedAt && session.issuedAt * 1000 < user.passwordChangedAt.getTime()) {
    return null
  }

  return user
})

export async function requireUser(redirectTo = '/login'): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(redirectTo)
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  if (user.role !== 'admin') redirect('/?error=admin-only')
  return user
}

export async function createSessionCookie(user: User): Promise<void> {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: `${user.firstName} ${user.lastName}`.trim(),
  })
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions)
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
}
