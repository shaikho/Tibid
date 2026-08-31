import type { Metadata } from 'next'
import Link from 'next/link'

import { ForgotPasswordForm } from '@/app/forgot-password/forgot-password-form'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata: Metadata = {
  title: 'Forgot your password',
  // No reason for a reset page to appear in search results.
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <AuthShell
      title="Forgot your password"
      subtitle="Tell us the email on your profile and we will send you a link to set a new one."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm email={email} />
    </AuthShell>
  )
}
