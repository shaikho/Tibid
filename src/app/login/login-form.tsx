'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { Alert, SubmitButton, TextField } from '@/components/ui/form'
import { loginAction, type FormState } from '@/lib/actions/auth'

const initial: FormState = {}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?._form && <Alert>{state.errors._form}</Alert>}

      <input type="hidden" name="next" value={next ?? '/'} />

      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.errors?.email}
      />

      <div>
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          error={state.errors?.password}
        />
        <p className="mt-2 text-right text-xs">
          <Link href="/forgot-password" className="font-medium text-tide hover:text-brand">
            Forgot your password?
          </Link>
        </p>
      </div>

      <SubmitButton className="w-full !py-3" pendingLabel="Signing you in…">
        Sign in
      </SubmitButton>

      <p className="pt-1 text-center text-xs leading-relaxed text-tide/70">
        We keep you signed in for 30 days on this device so you never have to retype your details.
      </p>
    </form>
  )
}
