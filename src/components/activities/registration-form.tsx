'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'

import {
  Alert,
  CheckboxField,
  RadioCards,
  SubmitButton,
  TextArea,
  TextField,
} from '@/components/ui/form'
import { registerForActivityAction, type RegistrationState } from '@/lib/actions/registrations'
import { GENDERS, GENDER_ORDER } from '@/lib/constants'

const initial: RegistrationState = {}

export type Prefill = {
  firstName: string
  lastName: string
  email: string
  phone: string
  gender: string
  instagram: string
  emergencyContactName: string
  emergencyContactPhone: string
  healthNotes: string
  isTibidMember: boolean
  photoConsent: boolean
}

export function RegistrationForm({
  activityId,
  participationLabel,
  participationOptions,
  prefill,
  isSignedIn,
  loginHref,
}: {
  activityId: string
  participationLabel: string | null
  participationOptions: string[]
  prefill: Prefill | null
  isSignedIn: boolean
  loginHref: string
}) {
  const [state, formAction] = useActionState(registerForActivityAction, initial)
  const topRef = useRef<HTMLDivElement>(null)

  // A successful submit redirects to ?joined=… and the confirmation is rendered
  // server-side, so the only state we surface here is validation errors.
  useEffect(() => {
    if (state.errors?._form) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [state])

  return (
    <div ref={topRef} id="register" className="card scroll-mt-28 p-6 sm:p-8">
      <header className="mb-6">
        <span className="chip bg-mist text-brand-deeper">Registration</span>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-deep">
          Save your spot
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-tide">
          Run, walk or do a little bit of both — there&rsquo;s no race here. What matters is moving
          your body, having fun and enjoying every step. 🏃‍♀️ 🚶‍♂️ ✨
        </p>
      </header>

      {!isSignedIn && (
        <div className="mb-6 rounded-2xl border border-brand/20 bg-mist/70 p-4 text-sm">
          <p className="font-semibold text-deep">Signing up as a guest</p>
          <p className="mt-1 leading-relaxed text-tide">
            You can register right here without an account.{' '}
            <Link href={loginHref} className="font-semibold text-brand hover:underline">
              Sign in
            </Link>{' '}
            and every future sign-up fills itself in automatically.
          </p>
        </div>
      )}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="activityId" value={activityId} />

        {state.errors?._form && <Alert>{state.errors._form}</Alert>}

        {/* ---------------- Attendee information ---------------- */}
        <FormSection title="Attendee information" step={1}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="First name"
              name="firstName"
              autoComplete="given-name"
              defaultValue={prefill?.firstName}
              required
              error={state.errors?.firstName}
            />
            <TextField
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              defaultValue={prefill?.lastName}
              required
              error={state.errors?.lastName}
            />
          </div>

          <RadioCards
            label="Gender (for statistics)"
            name="gender"
            columns={4}
            required
            defaultValue={prefill?.gender}
            options={GENDER_ORDER.map((g) => ({ value: g, label: GENDERS[g] }))}
            error={state.errors?.gender}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Mobile phone number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+971 50 123 4567"
              defaultValue={prefill?.phone}
              required
              error={state.errors?.phone}
            />
            <TextField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="example@example.com"
              defaultValue={prefill?.email}
              required
              error={state.errors?.email}
            />
          </div>

          <TextField
            label="Instagram handle"
            name="instagram"
            placeholder="@yourhandle"
            defaultValue={prefill?.instagram}
            error={state.errors?.instagram}
            hint="Share your @username if you'd like us to connect with you or tag you in event photos and community moments."
          />
        </FormSection>

        {/* ---------------- Event participation ---------------- */}
        {participationOptions.length > 0 && (
          <FormSection title="Event participation" step={2}>
            <RadioCards
              label={participationLabel ?? 'How will you take part?'}
              name="participationChoice"
              columns={participationOptions.length > 2 ? 3 : 2}
              required
              options={participationOptions.map((o) => ({ value: o, label: o }))}
              error={state.errors?.participationChoice}
            />
          </FormSection>
        )}

        {/* ---------------- Safety ---------------- */}
        <FormSection title="Just in case" step={participationOptions.length > 0 ? 3 : 2}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Emergency contact name"
              name="emergencyContactName"
              placeholder="Full name"
              defaultValue={prefill?.emergencyContactName}
              error={state.errors?.emergencyContactName}
            />
            <TextField
              label="Emergency contact phone"
              name="emergencyContactPhone"
              type="tel"
              inputMode="tel"
              placeholder="+971 50 123 4567"
              defaultValue={prefill?.emergencyContactPhone}
              error={state.errors?.emergencyContactPhone}
            />
          </div>

          <TextArea
            label="Relevant injury or health condition organisers should know about"
            name="healthNotes"
            rows={3}
            placeholder="Anything you'd want us to know if something happened — otherwise leave blank."
            defaultValue={prefill?.healthNotes}
            error={state.errors?.healthNotes}
            hint="Only the TIBID organisers see this. It is never shown publicly."
          />
        </FormSection>

        {/* ---------------- Community status + consent ---------------- */}
        <FormSection
          title="Community status & consent"
          step={participationOptions.length > 0 ? 4 : 3}
        >
          <RadioCards
            label="Are you already part of the TIBID community?"
            name="isTibidMember"
            columns={2}
            required
            defaultValue={prefill ? (prefill.isTibidMember ? 'yes' : 'no') : undefined}
            options={[
              { value: 'yes', label: 'Yes, I am', emoji: '💙' },
              { value: 'no', label: 'This is my first time', emoji: '👋' },
            ]}
            error={state.errors?.isTibidMember}
          />

          <CheckboxField
            name="photoConsent"
            label="Photo and video consent"
            description="I agree that TIBID may take photos and video at this activity and use them on the TIBID website and social channels."
            defaultChecked={prefill?.photoConsent ?? false}
            error={state.errors?.photoConsent}
          />

          <CheckboxField
            name="agreedToTerms"
            label="Confirmation"
            description="I confirm the details above are correct, I'm taking part at my own risk, and I'll follow the organisers' instructions on the day."
            error={state.errors?.agreedToTerms}
          />
        </FormSection>

        <SubmitButton className="w-full !py-3.5 !text-base" pendingLabel="Saving your spot…">
          Complete my registration
        </SubmitButton>

        <p className="text-center text-xs leading-relaxed text-tide/70">
          Your details are stored securely and shared only with the TIBID organisers.
        </p>
      </form>
    </div>
  )
}

/**
 * Sections animate in once on mount with a small stagger — deliberately NOT on
 * scroll. A `whileInView` fieldset that never crosses its threshold stays at
 * opacity 0 while still occupying layout, which silently swallows clicks on the
 * submit button underneath it. Forms get mount animations, not scroll ones.
 */
function FormSection({
  title,
  step,
  children,
}: {
  title: string
  step: number
  children: React.ReactNode
}) {
  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.06 * step, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4"
    >
      <legend className="mb-4 flex w-full items-center gap-3 border-b border-foam/80 pb-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper text-xs font-bold text-white">
          {step}
        </span>
        <span className="font-display text-base font-bold text-deep">{title}</span>
      </legend>
      {children}
    </motion.fieldset>
  )
}
