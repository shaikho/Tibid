import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SignUpForm } from '@/app/signup/signup-form'
import { AuthShell } from '@/components/auth/auth-shell'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Create your profile' }
export const dynamic = 'force-dynamic'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getSession().catch(() => null)
  const { next } = await searchParams

  if (session) redirect(next?.startsWith('/') ? next : '/profile')

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
