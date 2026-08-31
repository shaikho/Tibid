'use client'

import { useActionState } from 'react'

import { Alert, SubmitButton, TextField } from '@/components/ui/form'
import type { FormState } from '@/lib/actions/auth'
import { resetPasswordAction } from '@/lib/actions/password-reset'

const initial: FormState = {}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetPasswordAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?._form && <Alert>{state.errors._form}</Alert>}

      {/*
        The token travels in the form body rather than being read from the URL
        on submit, so it is not re-exposed in a query string the browser might
        keep, and the action never has to trust the address bar.
      */}
      <input type="hidden" name="token" value={token} />

      {/*
        Hidden, and there only so password managers offer to update the saved
        entry for the right account instead of creating a second one.
      */}
      <input type="text" name="username" autoComplete="username" hidden readOnly value="" />

      <TextField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
        error={state.errors?.newPassword}
      />

      <TextField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Type it again"
        required
        error={state.errors?.confirmPassword}
      />

      <SubmitButton className="w-full !py-3" pendingLabel="Saving your new password…">
        Save and sign in
      </SubmitButton>

      <p className="pt-1 text-center text-xs leading-relaxed text-tide/70">
        Setting a new password signs you out anywhere else you were signed in.
      </p>
    </form>
  )
}
