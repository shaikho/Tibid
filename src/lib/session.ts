import { SignJWT, jwtVerify } from 'jose'

/**
 * Edge-safe session helpers. Only `jose` is used here so this module can be
 * imported from middleware as well as from Node route handlers.
 */

export const SESSION_COOKIE = 'tibid_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export type SessionPayload = {
  sub: string
  email: string
  role: 'member' | 'admin'
  name: string
}

/**
 * A verified session, plus when it was issued. `issuedAt` is the standard JWT
 * `iat` claim in whole seconds; it is what lets a password reset invalidate
 * sessions that were signed before it, without keeping a server-side list of
 * every session ever issued.
 */
export type VerifiedSession = SessionPayload & { issuedAt: number }

function secretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Generate one with: openssl rand -base64 32',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('tibid')
    .setAudience('tibid-web')
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey())
}

export async function verifySession(token: string | undefined): Promise<VerifiedSession | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'tibid',
      audience: 'tibid-web',
    })
    if (typeof payload.sub !== 'string') return null
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      role: payload.role === 'admin' ? 'admin' : 'member',
      name: String(payload.name ?? ''),
      issuedAt: typeof payload.iat === 'number' ? payload.iat : 0,
    }
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
}
