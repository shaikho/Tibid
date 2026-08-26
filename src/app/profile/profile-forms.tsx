'use client'

import { useActionState } from 'react'

import {
  Alert,
  CheckboxField,
  RadioCards,
  SubmitButton,
  TextArea,
  TextField,
} from '@/components/ui/form'
import type { User } from '@/db/schema'
import {
  changePasswordAction,
  updateProfileAction,
  type FormState,
} from '@/lib/actions/auth'
import { GENDERS, GENDER_ORDER } from '@/lib/constants'
import { normalizeInstagram } from '@/lib/utils'

const initial: FormState = {}

export function ProfileForms({ user }: { user: User }) {
  const [profileState, profileAction] = useActionState(updateProfileAction, initial)
  const [pwState, pwAction] = useActionState(changePasswordAction, initial)

  return (
    <div className="space-y-6">
      <form action={profileAction} className="card space-y-5 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Your details</h2>
          <p className="mt-1 text-sm leading-relaxed text-tide">
            These pre-fill every activity sign-up. Keep them current and joining takes seconds.
          </p>
        </div>

        {profileState.errors?._form && <Alert>{profileState.errors._form}</Alert>}
        {profileState.ok && <Alert tone="success">{profileState.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            name="firstName"
            defaultValue={user.firstName}
            required
            error={profileState.errors?.firstName}
          />
          <TextField
            label="Last name"
            name="lastName"
            defaultValue={user.lastName}
            required
            error={profileState.errors?.lastName}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+971 50 123 4567"
            defaultValue={user.phone ?? ''}
            error={profileState.errors?.phone}
          />
          <TextField
            label="Instagram handle"
            name="instagram"
            placeholder="@yourhandle"
            defaultValue={normalizeInstagram(user.instagram) ?? ''}
            error={profileState.errors?.instagram}
          />
        </div>

        <RadioCards
          label="Gender (for statistics)"
          name="gender"
          columns={4}
          defaultValue={user.gender ?? undefined}
          options={GENDER_ORDER.map((g) => ({ value: g, label: GENDERS[g] }))}
          error={profileState.errors?.gender}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Emergency contact name"
            name="emergencyContactName"
            defaultValue={user.emergencyContactName ?? ''}
            error={profileState.errors?.emergencyContactName}
          />
          <TextField
            label="Emergency contact phone"
            name="emergencyContactPhone"
            type="tel"
            inputMode="tel"
            defaultValue={user.emergencyContactPhone ?? ''}
            error={profileState.errors?.emergencyContactPhone}
          />
        </div>

        <TextArea
          label="Injury or health condition organisers should know about"
          name="healthNotes"
          rows={3}
          defaultValue={user.healthNotes ?? ''}
          error={profileState.errors?.healthNotes}
          hint="Only visible to TIBID organisers — never shown publicly."
        />

        <div className="space-y-3">
          <CheckboxField
            name="isTibidMember"
            label="I'm already part of the TIBID community"
            defaultChecked={user.isTibidMember}
          />
          <CheckboxField
            name="photoConsent"
            label="Photo and video consent"
            description="TIBID may use photos and video of me from activities on the website and social channels."
            defaultChecked={user.photoConsent}
          />
        </div>

        <SubmitButton pendingLabel="Saving…">Save my details</SubmitButton>
      </form>

      <form action={pwAction} className="card space-y-4 p-6 sm:p-8">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Change password</h2>
          <p className="mt-1 text-sm text-tide">Signed in as {user.email}.</p>
        </div>

        {pwState.errors?._form && <Alert>{pwState.errors._form}</Alert>}
        {pwState.ok && <Alert tone="success">{pwState.message}</Alert>}

        <TextField
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={pwState.errors?.currentPassword}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            error={pwState.errors?.newPassword}
          />
          <TextField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            error={pwState.errors?.confirmPassword}
          />
        </div>

        <SubmitButton className="btn-outline !bg-transparent !shadow-none" pendingLabel="Updating…">
          Update password
        </SubmitButton>
      </form>
    </div>
  )
}
