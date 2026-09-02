'use server'

import { redirect } from 'next/navigation'

import { createSessionCookie, requireAdmin } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { TOKEN_TTL_MINUTES, consumeResetToken, issueResetToken } from '@/lib/password-reset'
import { flattenErrors, passwordResetSchema } from '@/lib/validation'

import type { FormState } from './auth'

/**
 * Password resets, organiser-issued.
 *
 * There is no "email me a link" route: TIBID has no domain, so mail sent from a
 * free webmail address cannot be authenticated and a meaningful share of resets
 * would land in spam — which reads to a member as "the site is broken". Instead
 * an organiser generates the link and hands it over in the channel the community
 * already uses.
 *
 * That trades an automated flow for a human one, and gets something back: the
 * organiser recognises the person asking, which is a stronger identity check
 * than possession of a mailbox.
 */

export type ResetLinkState = {
  ok?: boolean
  /** The generated link. Shown once, to the admin, for copying. */
  url?: string
  memberName?: string
  expiresInMinutes?: number
  error?: string
}

/**
 * Generates a reset link for one member. Admins only.
 *
 * The rate limit that protects the public flow is skipped here on purpose: it
 * exists to stop strangers spamming an inbox and probing for accounts, and
 * neither applies to a signed-in organiser clicking a button. Who issued it is
 * recorded instead, so the action is attributable rather than merely limited.
 */
export async function createResetLinkAction(
  _prev: ResetLinkState,
  formData: FormData,
): Promise<ResetLinkState> {
  const admin = await requireAdmin()

  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'No member selected.' }

  const result = await issueResetToken(email, { issuedByAdminId: admin.id })

  if (result.outcome !== 'issued') {
    return {
      error:
        result.outcome === 'no-account'
          ? 'No profile with that email address any more — the list may be out of date. Reload the page.'
          : 'Too many links generated for that member in the last hour. Try again shortly.',
    }
  }

  return {
    ok: true,
    url: result.resetUrl,
    memberName: `${result.user.firstName} ${result.user.lastName}`.trim(),
    expiresInMinutes: TOKEN_TTL_MINUTES,
  }
}

/* -------------------------------------------------------------------------- */

/**
 * Sets a new password from a link. No current password required — the link is
 * the proof, which is the whole point of a reset.
 */
export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) return { errors: flattenErrors(parsed.error) }

  // Hashing first, so a token that turns out to be stale costs the same as one
  // that works — and so the plain password is never held while awaiting a query.
  const passwordHash = await hashPassword(parsed.data.newPassword)
  const user = await consumeResetToken(parsed.data.token, passwordHash)

  if (!user) {
    return {
      errors: {
        _form:
          'That link has expired or has already been used. Ask an organiser for a new one and it will work.',
      },
    }
  }

  // Signing in here is safe: the link was the proof, and every session that
  // existed before this moment has just been invalidated.
  await createSessionCookie(user)
  redirect('/profile?password=updated')
}
