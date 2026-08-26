import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/app/login/login-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession().catch(() => null)
  const { next } = await searchParams

  if (session) redirect(next?.startsWith('/') ? next : '/profile')

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
      <LoginForm next={next} />
    </AuthShell>
  )
}
