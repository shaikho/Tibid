'use client'

import { useActionState } from 'react'

import { Alert, RadioCards, SubmitButton, TextField } from '@/components/ui/form'
import { signUpAction, type FormState } from '@/lib/actions/auth'
import { GENDERS, GENDER_ORDER } from '@/lib/constants'

const initial: FormState = {}

export function SignUpForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(signUpAction, initial)

  return (
    <form action={formAction} className="space-y-5">
      {state.errors?._form && <Alert>{state.errors._form}</Alert>}

      <input type="hidden" name="next" value={next ?? '/profile'} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Sarah"
          required
          error={state.errors?.firstName}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Al Marzouqi"
          required
          error={state.errors?.lastName}
        />
      </div>

      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        error={state.errors?.email}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        required
        error={state.errors?.password}
        hint="Long and memorable beats short and clever."
      />

      <TextField
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+971 50 123 4567"
        error={state.errors?.phone}
        hint="Optional now — but it saves you typing it on every sign-up."
      />

      <RadioCards
        label="Gender (for our participation statistics)"
        name="gender"
        columns={4}
        options={GENDER_ORDER.map((g) => ({ value: g, label: GENDERS[g] }))}
        error={state.errors?.gender}
      />

      <TextField
        label="Instagram handle"
        name="instagram"
        placeholder="@yourhandle"
        error={state.errors?.instagram}
        hint="So we can tag you in event photos and community moments."
      />

      <SubmitButton className="w-full !py-3" pendingLabel="Creating your profile…">
        Create my profile
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-tide/70">
        By creating a profile you agree that we&rsquo;ll store these details to manage activity
        sign-ups. You can edit or clear them at any time from your profile page.
      </p>
    </form>
  )
}
