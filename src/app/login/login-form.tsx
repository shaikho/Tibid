'use client'

import { useActionState, useState } from 'react'

import { ForgotPasswordModal } from '@/components/auth/forgot-password-modal'
import { Alert, SubmitButton, TextField } from '@/components/ui/form'
import { loginAction, type FormState } from '@/lib/actions/auth'

const initial: FormState = {}

export function LoginForm({
  next,
  helpHref,
  helpLabel,
}: {
  next?: string
  /** Where "forgot your password" sends people — set in Admin → Settings. */
  helpHref: string
  helpLabel: string
}) {
  const [state, formAction] = useActionState(loginAction, initial)
  const [askingForHelp, setAskingForHelp] = useState(false)

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
          {/*
            A button, not a link: there is no page to go to, and sending someone
            to a dead-end route only to tell them to message us would lose the
            email address they have already typed.
          */}
          <button
            type="button"
            onClick={() => setAskingForHelp(true)}
            className="font-medium text-tide underline-offset-2 hover:text-brand hover:underline"
          >
            Forgot your password?
          </button>
        </p>
      </div>

      <SubmitButton className="w-full !py-3" pendingLabel="Signing you in…">
        Sign in
      </SubmitButton>

      <p className="pt-1 text-center text-xs leading-relaxed text-tide/70">
        We keep you signed in for 30 days on this device so you never have to retype your details.
      </p>

      <ForgotPasswordModal
        open={askingForHelp}
        onClose={() => setAskingForHelp(false)}
        helpHref={helpHref}
        helpLabel={helpLabel}
      />
    </form>
  )
}
