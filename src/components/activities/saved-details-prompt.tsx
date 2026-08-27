'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { initials } from '@/lib/utils'

/**
 * Asks a returning attendee whether to reuse the details we already hold,
 * instead of silently filling the form for them. Silent pre-fill is faster but
 * it hides what is about to be submitted — including their phone number and any
 * health note — behind fields nobody re-reads.
 */
export function SavedDetailsPrompt({
  open,
  firstName,
  lastName,
  email,
  fromProfile,
  onUse,
  onFresh,
  onForget,
}: {
  open: boolean
  firstName: string
  lastName: string
  email: string
  /** True when the details come from a signed-in profile rather than this device. */
  fromProfile: boolean
  onUse: () => void
  onFresh: () => void
  onForget: () => void
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    primaryRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onFresh()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onFresh])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-5"
        >
          <div
            className="absolute inset-0 bg-abyss/55 backdrop-blur-sm"
            onClick={onFresh}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-details-title"
            initial={{ opacity: 0, y: 22, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-wave bg-white p-7 text-center shadow-float sm:p-9"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32"
              style={{
                background:
                  'radial-gradient(24rem 10rem at 50% -20%, rgba(0,107,212,0.18), transparent 70%)',
              }}
            />

            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 14, stiffness: 220 }}
              className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper font-display text-xl font-bold text-white shadow-tide"
            >
              {initials(firstName || 'T', lastName || 'B')}
            </motion.span>

            <h2
              id="saved-details-title"
              className="relative mt-5 font-display text-2xl font-extrabold leading-tight text-deep"
            >
              Welcome back{firstName ? `, ${firstName}` : ''}!
            </h2>

            <p className="relative mt-3 text-sm leading-relaxed text-tide">
              Want to use the details you signed up with last time?
              {email && (
                <span className="mt-2 block truncate font-semibold text-brand-deeper">{email}</span>
              )}
            </p>

            <div className="relative mt-7 flex flex-col gap-2.5">
              <button
                ref={primaryRef}
                type="button"
                onClick={onUse}
                className="btn btn-primary w-full !py-3"
              >
                Yes, fill it in for me
              </button>
              <button type="button" onClick={onFresh} className="btn btn-outline w-full !py-3">
                No, I&rsquo;ll enter them fresh
              </button>
            </div>

            <p className="relative mt-5 text-xs leading-relaxed text-tide/70">
              {fromProfile ? (
                <>
                  These come from your TIBID profile. You can change them any time from{' '}
                  <span className="font-semibold text-tide">My profile</span>.
                </>
              ) : (
                <>
                  Saved on this device only — never shared.{' '}
                  <button
                    type="button"
                    onClick={onForget}
                    className="font-semibold text-coral underline underline-offset-2 hover:no-underline"
                  >
                    Forget my details
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
