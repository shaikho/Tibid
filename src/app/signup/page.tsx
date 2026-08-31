import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignUpForm } from '@/app/signup/signup-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Create your profile' }
export const dynamic = 'force-dynamic'

export default async function SignUpPage({
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
  const session = await getCurrentUser().catch(() => null)
  const { next } = await searchParams

  if (session) redirect(next?.startsWith('/') ? next : '/')

  return (
    <AuthShell
      title="Join the journey"
      subtitle="One profile, every activity. Fill this in once and future sign-ups pre-fill themselves."
      footer={
        <>
          Already have a profile?{' '}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  )
}
