'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useActionState, useEffect, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/form'
import { createResetLinkAction, type ResetLinkState } from '@/lib/actions/password-reset'

const initial: ResetLinkState = {}

/**
 * Generates a password reset link for one member and shows it for copying.
 *
 * The link is deliberately shown rather than sent: the organiser is the
 * delivery mechanism, and they will paste it into whichever chat they are
 * already talking to the member in.
 *
 * It appears exactly once. Closing the panel does not invalidate it — the link
 * lives for an hour regardless — but there is no way to see it a second time,
 * which keeps live links off the screen of a shared laptop. Generating another
 * retires the first.
 */
export function ResetLinkButton({
  email,
  name,
  isSelf,
}: {
  email: string
  name: string
  /** Generating a link for yourself would sign your other sessions out. */
  isSelf: boolean
}) {
  const [state, formAction, pending] = useActionState(createResetLinkAction, initial)
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLInputElement>(null)

  // Reset the confirmation whenever a new link replaces the old one.
  useEffect(() => setCopied(false), [state.url])

  async function copy() {
    const url = state.url
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      /*
       * The Clipboard API needs a secure context and permission, and refuses in
       * a few browsers regardless. Selecting the text is the fallback that has
       * always worked: the organiser presses Ctrl/Cmd-C themselves.
       */
      linkRef.current?.select()
    }
  }

  return (
    <div className="min-w-[11rem]">
      <form action={formAction}>
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-outline !py-1.5 !text-[0.7rem] disabled:opacity-60"
          title={
            isSelf
              ? 'Generates a link for your own account — using it signs out your other devices'
              : `Generate a password reset link for ${name}`
          }
        >
          {pending ? (
            <span className="flex items-center gap-1.5">
              <Spinner className="h-3 w-3" /> Generating…
            </span>
          ) : state.url ? (
            'New link'
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <AnimatePresence>
        {state.error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-2 text-[0.7rem] font-medium leading-relaxed text-coral"
          >
            {state.error}
          </motion.p>
        )}

        {state.ok && state.url && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 rounded-xl border border-brand/25 bg-mist p-2.5"
          >
            <p className="text-[0.7rem] font-semibold leading-snug text-brand-deeper">
              Send this to {state.memberName}. It works once and expires in{' '}
              {state.expiresInMinutes} minutes.
            </p>

            <div className="mt-2 flex items-center gap-1.5">
              {/*
                Read-only rather than plain text so it can be selected and copied
                on a phone, where selecting a wrapped block of text is fiddly.
              */}
              <input
                ref={linkRef}
                readOnly
                value={state.url}
                aria-label={`Reset link for ${state.memberName}`}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-foam bg-white px-2 py-1 font-mono text-[0.65rem] text-tide"
              />
              <button
                type="button"
                onClick={copy}
                className="shrink-0 rounded-lg bg-brand px-2.5 py-1.5 text-[0.7rem] font-bold text-white hover:bg-brand-dark"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
