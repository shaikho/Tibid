'use server'

import { redirect } from 'next/navigation'

import { createSessionCookie } from '@/lib/auth'
import { activeProvider, emailConfigured, sendMail } from '@/lib/email'
import { passwordResetEmail } from '@/lib/emails/password-reset'
import { hashPassword } from '@/lib/password'
import { TOKEN_TTL_MINUTES, consumeResetToken, issueResetToken } from '@/lib/password-reset'
import { flattenErrors, forgotPasswordSchema, passwordResetSchema } from '@/lib/validation'

import type { FormState } from './auth'

/**
 * The same answer for every address, whether or not it has a profile. Anything
 * else turns the forgot-password form into a way of asking "is this person in
 * TIBID?", which is a membership list nobody agreed to publish.
 */
const SAME_ANSWER_EITHER_WAY =
  'If that address has a TIBID profile, a reset link is on its way. It expires in an hour — check your spam folder if it has not arrived in a few minutes.'

/**
 * Requesting and not-requesting take very different amounts of work: one sends
 * an email, the other returns immediately. A stopwatch would give away which
 * happened, so every response takes at least this long.
 */
const MIN_RESPONSE_MS = 450

async function notFasterThan<T>(started: number, value: T): Promise<T> {
  const remaining = MIN_RESPONSE_MS - (Date.now() - started)
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
  return value
}

/* -------------------------------------------------------------------------- */

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const started = Date.now()

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { errors: flattenErrors(parsed.error) }

  /*
   * With no provider configured nothing can be delivered, and that is true
   * regardless of which address was typed — so saying so reveals nothing about
   * who has a profile, and saves a member waiting for an email that will never
   * arrive.
   */
  if (!emailConfigured()) {
    return notFasterThan(started, {
      errors: {
        _form:
          'Password reset emails are not switched on yet. Ask an organiser to reset it for you, or set BREVO_API_KEY in the site settings.',
      },
    })
  }

  const result = await issueResetToken(parsed.data.email)

  if (result.outcome === 'rate-limited') {
    // Deliberately not the generic answer: a member clicking twice deserves to
    // know why nothing new arrived, and this reveals nothing an attacker who
    // just triggered it does not already know.
    return notFasterThan(started, {
      errors: {
        _form: 'That is a few reset links in a short time. Give it an hour, then try again.',
      },
    })
  }

  if (result.outcome === 'issued') {
    const { subject, html, text } = passwordResetEmail({
      firstName: result.user.firstName,
      resetUrl: result.resetUrl,
      expiresInMinutes: TOKEN_TTL_MINUTES,
    })

    const sent = await sendMail({
      to: result.user.email,
      toName: `${result.user.firstName} ${result.user.lastName}`.trim(),
      subject,
      html,
      text,
    })

    if (!sent.ok) {
      /*
       * Logged, not shown. Surfacing "we could not send it" only for addresses
       * that exist would leak exactly what the generic answer is protecting —
       * so the member sees the same sentence, and the admin sees this line.
       */
      console.error(`[password-reset] ${activeProvider()} refused the message: ${sent.error}`)
    }
  }

  return notFasterThan(started, { ok: true, message: SAME_ANSWER_EITHER_WAY })
}

/* -------------------------------------------------------------------------- */

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
          'That reset link has expired or has already been used. Ask for a new one and it will work.',
      },
    }
  }

  // Signing in here is safe: they proved control of the mailbox, and every
  // session that existed before this moment has just been invalidated.
  await createSessionCookie(user)
  redirect('/profile?password=updated')
}
