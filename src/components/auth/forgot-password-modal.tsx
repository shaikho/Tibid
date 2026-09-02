'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'

import { SITE } from '@/lib/constants'

/**
 * What happens when a member forgets their password.
 *
 * There is no self-serve email route, so this modal has one job: make the next
 * step obvious enough that nobody is left staring at a login screen wondering
 * whether the site is broken. It names who to ask, gives a one-tap way to reach
 * them, and says what will come back — a one-time link that expires in an hour
 * — so the message that arrives later is expected rather than suspicious.
 *
 * A modal rather than a page because there is nothing to submit. A page implies
 * a form; this is an instruction, and it belongs over the login screen the
 * member is already looking at.
 *
 * Where the button points comes from Admin → Settings, not from a constant.
 * Whoever is covering resets changes — someone travels, someone hands the role
 * over — and a number baked into the source is one that stays wrong until the
 * next deploy.
 */
export function ForgotPasswordModal({
  open,
  onClose,
  helpHref,
  helpLabel,
}: {
  open: boolean
  onClose: () => void
  /** wa.me link when an organiser has set a number, Instagram otherwise. */
  helpHref: string
  helpLabel: string
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      // Keep Tab inside the dialog. Without this, tabbing walks into the login
      // form behind the backdrop — focus lands on fields the reader cannot see.
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

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
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            aria-describedby="forgot-password-body"
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
              className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper text-2xl shadow-tide"
            >
              <span aria-hidden>🔑</span>
            </motion.span>

            <h2
              id="forgot-password-title"
              className="relative mt-5 font-display text-2xl font-extrabold leading-tight text-deep"
            >
              Message an organiser
            </h2>

            <p
              id="forgot-password-body"
              className="relative mt-3 text-sm leading-relaxed text-tide"
            >
              Password resets are handled by the {SITE.shortName} team. Send us a message and
              we&rsquo;ll reply with a link that lets you set a new one — no old password needed.
            </p>

            <div className="relative mt-7 flex flex-col gap-2.5">
              <a
                href={helpHref}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary w-full !py-3"
              >
                {helpLabel}
              </a>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="btn btn-outline w-full !py-3"
              >
                Back to sign in
              </button>
            </div>

            <p className="relative mt-5 text-xs leading-relaxed text-tide/70">
              Tell us the email on your profile — the message is already written for you. The link
              we send back works once and expires after an hour, so open it when you have a minute
              to choose a new password.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
