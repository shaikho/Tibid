'use client'

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'motion/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Logo } from '@/components/site/logo'
import { cn, initials } from '@/lib/utils'

type NavUser = { firstName: string; lastName: string; role: 'member' | 'admin' } | null

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/activities', label: 'Activities' },
  { href: '/#categories', label: 'What we do' },
  { href: '/#story', label: 'Our story' },
  { href: '/#gallery', label: 'Moments' },
]

export function Nav({ user }: { user: NavUser }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 24))

  useEffect(() => {
    setOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled ? 'py-2' : 'py-4',
        )}
      >
        <div className="container-tibid">
          {/*
            The pill keeps its light surface at every scroll position. Activity
            pages open on a dark full-bleed cover, and a transparent bar puts
            dark navigation text on a near-black photo — unreadable. Only the
            border and shadow change on scroll.
          */}
          <div
            className={cn(
              'glass flex items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500 sm:px-5',
              scrolled
                ? 'border border-foam/70 shadow-[0_10px_40px_-18px_rgba(4,30,58,0.35)]'
                : 'border border-white/40 shadow-[0_6px_28px_-20px_rgba(4,30,58,0.4)]',
            )}
          >
            <Logo priority />

            <nav className="hidden items-center gap-1 lg:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative rounded-full px-4 py-2 text-sm font-medium text-tide transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-foam bg-white/70 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-deep transition hover:border-brand/40 hover:shadow-tide"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-deeper text-[11px] font-bold text-white">
                      {initials(user.firstName, user.lastName)}
                    </span>
                    {user.firstName}
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-0"
                          onClick={() => setMenuOpen(false)}
                          aria-hidden
                        />
                        <motion.div
                          role="menu"
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 z-10 mt-2 w-52 overflow-hidden rounded-2xl border border-foam bg-white p-1.5 shadow-float"
                        >
                          <MenuLink href="/profile">My profile</MenuLink>
                          <MenuLink href="/profile#my-activities">My activities</MenuLink>
                          {user.role === 'admin' && (
                            <MenuLink href="/admin" accent>
                              Admin dashboard
                            </MenuLink>
                          )}
                          <button
                            type="button"
                            onClick={logout}
                            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-coral transition hover:bg-coral/10"
                          >
                            Sign out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="hidden text-sm font-semibold text-tide hover:text-brand lg:block lg:px-3">
                  Sign in
                </Link>
              )}

              <Link href="/activities" className="btn btn-primary hidden !py-2.5 !text-sm lg:inline-flex">
                Join an activity
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full border border-foam bg-white/70 lg:hidden"
                aria-label="Open menu"
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
                  <path
                    d="M1 1h16M1 7h16M1 13h10"
                    stroke="#073A68"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <div className="absolute inset-0 bg-abyss/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white p-6 shadow-float"
            >
              <div className="flex items-center justify-between">
                <Logo href={null} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-mist"
                  aria-label="Close menu"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                    <path d="M1 1l12 12M13 1L1 13" stroke="#073A68" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-1">
                {LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.1 }}
                  >
                    <Link
                      href={link.href}
                      className="block rounded-2xl px-4 py-3 font-display text-2xl font-semibold text-deep transition hover:bg-mist hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto space-y-2 border-t border-foam pt-6">
                {user ? (
                  <>
                    <Link href="/profile" className="btn btn-ghost w-full">
                      My profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="btn btn-outline w-full">
                        Admin dashboard
                      </Link>
                    )}
                    <button type="button" onClick={logout} className="btn w-full text-coral">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn btn-ghost w-full">
                      Sign in
                    </Link>
                    <Link href="/signup" className="btn btn-primary w-full">
                      Create a profile
                    </Link>
                  </>
                )}
                <Link href="/activities" className="btn btn-primary w-full">
                  Join an activity
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function MenuLink({
  href,
  children,
  accent,
}: {
  href: string
  children: React.ReactNode
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cn(
        'block rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-mist',
        accent ? 'text-brand' : 'text-deep',
      )}
    >
      {children}
    </Link>
  )
}
