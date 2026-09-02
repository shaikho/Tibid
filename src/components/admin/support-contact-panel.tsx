'use client'

import { useActionState } from 'react'

import { Alert, SubmitButton, TextField } from '@/components/ui/form'
import {
  saveSupportContactAction,
  type SupportContactState,
} from '@/lib/actions/settings'

const initial: SupportContactState = {}

/**
 * Who a locked-out member is told to message.
 *
 * The panel always shows the link that is live right now, and after a save it
 * shows the new one as a real, clickable wa.me link. Phone numbers are easy to
 * mistype and the mistake is invisible — a wrong digit gives you a valid link
 * to a stranger — so the fix is to make the organiser able to press it and see
 * their own chat open.
 */
export function SupportContactPanel({
  whatsapp,
  name,
  currentHref,
  channel,
  currentLabel,
  prettyNumber,
}: {
  whatsapp: string | null
  name: string | null
  currentHref: string
  channel: 'whatsapp' | 'instagram'
  currentLabel: string
  prettyNumber: string | null
}) {
  const [state, formAction] = useActionState(saveSupportContactAction, initial)

  const liveHref = state.preview ? state.preview.href : currentHref
  const liveIsWhatsapp = state.preview ? true : channel === 'whatsapp'
  const livePretty = state.preview ? state.preview.pretty : prettyNumber

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Password reset contact</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-tide">
            When a member presses <strong>Forgot your password</strong>, this is who they are told
            to message. Put the number of whoever is covering it — change it whenever that changes.
          </p>
        </div>
        <span
          className={`chip ${liveIsWhatsapp ? 'bg-kelp/12 text-kelp' : 'bg-mist text-tide'}`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              liveIsWhatsapp ? 'bg-kelp' : 'bg-tide/40'
            }`}
          />
          {liveIsWhatsapp ? 'WhatsApp' : 'Instagram (fallback)'}
        </span>
      </div>

      <form action={formAction} className="mt-5 space-y-4">
        {state.error && <Alert>{state.error}</Alert>}
        {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="WhatsApp number"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+971 50 123 4567"
            defaultValue={whatsapp ? `+${whatsapp}` : ''}
            hint="Include the country code. Leave blank to fall back to Instagram."
          />
          <TextField
            label="Whose number is it?"
            name="name"
            autoComplete="off"
            placeholder="Amana"
            defaultValue={name ?? ''}
            hint="Optional — the button reads “Message Amana on WhatsApp”."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel="Saving…">Save contact</SubmitButton>

          <a
            href={liveHref}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-outline !py-2 !text-xs"
          >
            Test this link ↗
          </a>
        </div>
      </form>

      <div className="mt-5 rounded-xl border border-foam bg-mist/50 p-4 text-xs leading-relaxed text-tide">
        <p>
          <strong className="text-deep">Members currently see:</strong>{' '}
          <span className="font-semibold text-brand-deeper">
            {state.preview
              ? `Message ${name || 'us'} on WhatsApp`
              : currentLabel}
          </span>
          {liveIsWhatsapp && livePretty && <> → {livePretty}</>}
        </p>
        <p className="mt-2">
          The message is pre-written and asks them for the email on their profile, so you have what
          you need to find them. Then open <strong className="text-deep">Members</strong>, press{' '}
          <strong className="text-deep">Reset password</strong> on their row, and send back the
          link.
        </p>
      </div>
    </section>
  )
}
