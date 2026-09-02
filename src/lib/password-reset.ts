import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

import { db, passwordResetTokens, users, type User } from '@/db'
import { SITE } from '@/lib/constants'

/**
 * The mechanics behind a password reset.
 *
 * Links are issued by an organiser from the admin Members page and handed to
 * the member over WhatsApp or Instagram. There is no self-serve email route —
 * see `src/lib/actions/password-reset.ts` for why.
 *
 * Two rules shape everything here:
 *
 * 1. The database never sees the token. Only its SHA-256 is stored, so a
 *    leaked backup cannot be turned into a set of working reset links — the
 *    same reasoning that makes us store password hashes rather than passwords.
 *    SHA-256 without a salt is right here, unlike for passwords: the token is
 *    256 bits of `randomBytes`, so there is nothing to guess or precompute.
 *
 * 2. A link works once, and not for long. A link pasted into a group chat and
 *    still working next month is a spare key under the mat.
 */

/** Long enough to pass on and act on, short enough to be useless once stale. */
export const TOKEN_TTL_MINUTES = 60

/**
 * A ceiling even on organiser-issued links. Nobody legitimately needs six links
 * for one member in an hour; hitting this means a stuck loop or a mistake, and
 * stopping is the friendlier failure.
 */
const MAX_REQUESTS_PER_USER_PER_HOUR = 5

export type TokenCheck =
  | { status: 'valid'; userId: string; firstName: string }
  | { status: 'used' }
  | { status: 'expired' }
  | { status: 'unknown' }

/* -------------------------------------------------------------------------- */
/*  Tokens                                                                     */
/* -------------------------------------------------------------------------- */

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function newToken(): { token: string; tokenHash: string } {
  // base64url so it survives being pasted out of an email client unchanged.
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

/**
 * Reset links are the one place where the URL has to be right — a link to the
 * wrong host is a link that does not work. The incoming request knows the host
 * it was served on, which is correct on production, on preview deployments and
 * on localhost alike; `NEXT_PUBLIC_SITE_URL` is only the fallback.
 */
async function siteOrigin(): Promise<string> {
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
      return `${proto}://${host}`
    }
  } catch {
    // No request context (a script, a test) — fall through.
  }
  return SITE.url.replace(/\/$/, '')
}

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers()
    const forwarded = h.get('x-forwarded-for')
    // The left-most entry is the client; the rest are proxies.
    return forwarded?.split(',')[0]?.trim() || h.get('x-real-ip') || null
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*  Issuing                                                                    */
/* -------------------------------------------------------------------------- */

export type IssueResult =
  | { outcome: 'issued'; user: User; resetUrl: string }
  | { outcome: 'no-account' }
  | { outcome: 'rate-limited' }

/**
 * Creates a reset link for an email address, if it belongs to somebody.
 *
 * `issuedByAdminId` is recorded rather than checked: this is only reachable
 * from an admin-guarded action, so the value is an audit trail — "who handed
 * out a link for this member, and when" — not an authorisation decision.
 */
export async function issueResetToken(
  email: string,
  { issuedByAdminId }: { issuedByAdminId?: string } = {},
): Promise<IssueResult> {
  const ip = await clientIp()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1)

  if (!user) return { outcome: 'no-account' }

  const [{ count: recent }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(passwordResetTokens)
    .where(
      and(eq(passwordResetTokens.userId, user.id), gt(passwordResetTokens.createdAt, oneHourAgo)),
    )
  if (recent >= MAX_REQUESTS_PER_USER_PER_HOUR) return { outcome: 'rate-limited' }

  // Asking again replaces the previous link rather than adding to it, so at
  // most one live link exists per person at a time.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)))

  const { token, tokenHash } = newToken()
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
    requestedIp: ip,
    issuedByAdminId: issuedByAdminId ?? null,
  })

  const origin = await siteOrigin()
  return {
    outcome: 'issued',
    user,
    resetUrl: `${origin}/reset-password?token=${encodeURIComponent(token)}`,
  }
}

/* -------------------------------------------------------------------------- */
/*  Checking                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Read-only check, used to decide what the reset page should render. It never
 * consumes the token — that only happens once a new password is actually set,
 * so a mail scanner that follows the link does not burn it.
 */
export async function checkResetToken(token: string | undefined): Promise<TokenCheck> {
  if (!token || token.length < 20 || token.length > 200) return { status: 'unknown' }

  const [row] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      firstName: users.firstName,
      tokenHash: passwordResetTokens.tokenHash,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(eq(passwordResetTokens.tokenHash, hashToken(token)))
    .limit(1)

  if (!row) return { status: 'unknown' }

  // The lookup above matched on the hash, so this can only fail if the database
  // returned a different row than asked for. Compared in constant time anyway,
  // because this is the one comparison that decides whether a stranger gets in.
  if (!constantTimeEquals(row.tokenHash, hashToken(token))) return { status: 'unknown' }

  if (row.usedAt) return { status: 'used' }
  if (row.expiresAt.getTime() <= Date.now()) return { status: 'expired' }

  return { status: 'valid', userId: row.userId, firstName: row.firstName }
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/* -------------------------------------------------------------------------- */
/*  Consuming                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sets the new password and burns every outstanding link for that member.
 *
 * `passwordChangedAt` is truncated to the second on purpose. Sessions are JWTs
 * whose `iat` is in whole seconds, and the session issued moments later must
 * not be invalidated by its own reset — truncating makes the new session's
 * `iat` land on or after the stamp, while every earlier session falls before it.
 */
export async function consumeResetToken(
  token: string,
  newPasswordHash: string,
): Promise<User | null> {
  const check = await checkResetToken(token)
  if (check.status !== 'valid') return null

  const now = new Date()
  const stamp = new Date(Math.floor(now.getTime() / 1000) * 1000)

  const [updated] = await db
    .update(users)
    .set({ passwordHash: newPasswordHash, passwordChangedAt: stamp, updatedAt: now })
    .where(eq(users.id, check.userId))
    .returning()

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(and(eq(passwordResetTokens.userId, check.userId), isNull(passwordResetTokens.usedAt)))

  return updated ?? null
}
