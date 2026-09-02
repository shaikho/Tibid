import type { Metadata } from 'next'
import Link from 'next/link'

import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '@/app/reset-password/reset-password-form'
import { Alert } from '@/components/ui/form'
import { checkResetToken } from '@/lib/password-reset'
import { getSupportContact } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/**
 * The token is checked here, before anything is rendered, so a dead link says
 * so straight away instead of after someone has typed a new password twice.
 * Checking does not consume the token — that only happens on submit, so a link
 * previewed by a mail scanner still works when the member gets to it.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const check = await checkResetToken(token).catch(() => ({ status: 'unknown' as const }))
  const support = await getSupportContact()

  if (check.status !== 'valid') {
    const reason =
      check.status === 'used'
        ? 'That link has already been used, or a newer one was issued after it.'
        : check.status === 'expired'
          ? 'That link has expired — they only last an hour.'
          : 'That link is not valid. It may have been cut in half on the way to you.'

    return (
      <AuthShell
        title="This link no longer works"
        subtitle="Reset links are single-use and short-lived, on purpose."
        footer={
          <>
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="space-y-5">
          <Alert tone="info">{reason}</Alert>
          <p className="text-sm leading-relaxed text-tide">
            Message the organisers and they will send you another one. Your current password still
            works in the meantime, if you remember it.
          </p>
          <a
            href={support.href}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-primary w-full !py-3"
          >
            {support.label}
          </a>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={check.firstName ? `Welcome back, ${check.firstName}` : 'Choose a new password'}
      subtitle="Pick something you will remember. You will be signed in as soon as you save it."
      footer={
        <>
          Changed your mind?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in instead
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token as string} />
    </AuthShell>
  )
}
