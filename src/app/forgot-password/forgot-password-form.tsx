'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Alert, SubmitButton, TextField } from '@/components/ui/form'
import type { FormState } from '@/lib/actions/auth'
import { requestPasswordResetAction } from '@/lib/actions/password-reset'

const initial: FormState = {}

export function ForgotPasswordForm({ email }: { email?: string }) {
  const [state, formAction] = useActionState(requestPasswordResetAction, initial)

  /*
   * On success the form is replaced rather than left sitting under a green
   * banner. Leaving it there invites a second and third submit, which only
   * burns the three-per-hour allowance and replaces the link already sent.
   */
  if (state.ok) {
    return (
      <div className="space-y-5">
        <Alert tone="success">{state.message}</Alert>
        <p className="text-sm leading-relaxed text-tide">
          The link opens a page where you choose a new password. It works once, and only for the
          next hour.
        </p>
        <Link href="/login" className="btn-primary w-full !py-3">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?._form && <Alert>{state.errors._form}</Alert>}

      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={email}
        required
        error={state.errors?.email}
      />

      <SubmitButton className="w-full !py-3" pendingLabel="Sending the link…">
        Email me a reset link
      </SubmitButton>

      <p className="pt-1 text-center text-xs leading-relaxed text-tide/70">
        Use the address you signed up with. The link expires in an hour.
      </p>
    </form>
  )
}
