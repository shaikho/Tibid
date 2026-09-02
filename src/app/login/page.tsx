import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/app/login/login-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { getCurrentUser } from '@/lib/auth'
import { getSupportContact } from '@/lib/settings'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  /*
   * getCurrentUser, not getSession. getSession only checks that the cookie is a
   * well-formed JWT, which a session invalidated by a password reset still is —
   * so this page would bounce the visitor straight back to the page that sent
   * them here, and the two would redirect at each other forever. "Signed in"
   * has to mean the same thing here as it does everywhere else.
   */
  const [session, { next }, support] = await Promise.all([
    getCurrentUser().catch(() => null),
    searchParams,
    getSupportContact(),
  ])

  if (session) redirect(next?.startsWith('/') ? next : '/')

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in and every activity sign-up from here takes about ten seconds."
      footer={
        <>
          New to TIBID?{' '}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            Create a profile
          </Link>
        </>
      }
    >
      <LoginForm next={next} helpHref={support.href} helpLabel={support.label} />
    </AuthShell>
  )
}
