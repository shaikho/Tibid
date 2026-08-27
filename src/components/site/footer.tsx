import Link from 'next/link'

import { Logo } from '@/components/site/logo'
import { CATEGORIES, CATEGORY_ORDER, SITE } from '@/lib/constants'

const year = new Date().getFullYear()

export function Footer({ isSignedIn = false }: { isSignedIn?: boolean }) {
  return (
    <footer className="relative overflow-hidden bg-abyss text-mist">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(60rem 30rem at 12% -10%, rgba(0,107,212,0.45), transparent 60%), radial-gradient(50rem 28rem at 88% 110%, rgba(18,178,143,0.28), transparent 60%)',
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="relative block h-16 w-full text-shell"
      >
        <path
          fill="currentColor"
          d="M0,50 C240,10 480,90 720,50 C960,10 1200,90 1440,50 L1440,0 L0,0 Z"
        />
      </svg>

      <div className="container-tibid relative pb-10 pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Logo invert className="h-11" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-foam/80">
              Inspired by waves. Powered by movement. Building an active, healthy community
              across Dubai and Sharjah — all levels welcome to join the journey.
            </p>
            <div className="mt-6 flex gap-2">
              <Social href={SITE.instagram} label="Instagram">
                <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.55.21.95.47 1.36.88.41.41.67.81.88 1.36.17.4.37 1 .42 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.2-.21.55-.47.95-.88 1.36-.41.41-.81.67-1.36.88-.4.17-1 .37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42a3.7 3.7 0 0 1-1.36-.88 3.7 3.7 0 0 1-.88-1.36c-.17-.4-.37-1-.42-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.2.21-.55.47-.95.88-1.36.41-.41.81-.67 1.36-.88.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 5.05a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5Zm0 7.84a3.09 3.09 0 1 1 0-6.18 3.09 3.09 0 0 1 0 6.18Zm6.05-8.03a1.11 1.11 0 1 1-2.22 0 1.11 1.11 0 0 1 2.22 0Z" />
              </Social>
              {SITE.tiktok && (
                <Social href={SITE.tiktok} label="TikTok">
                  <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.83-2.48V9.75a5.85 5.85 0 1 0 4.92 5.77V9.01a7.35 7.35 0 0 0 4.29 1.38V7.3a4.29 4.29 0 0 1-3.23-1.48Z" />
                </Social>
              )}
              <Social href="mailto:hello@tibid.community" label="Email">
                <path d="M2.5 6.5A2 2 0 0 1 4.5 4.5h15a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-11Zm2.2-.2 7.3 5.3 7.3-5.3H4.7Z" />
              </Social>
            </div>
          </div>

          <FooterCol title="Activities">
            {CATEGORY_ORDER.map((c) => (
              <FooterLink key={c} href={`/activities?category=${c}`}>
                {CATEGORIES[c].label}
              </FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Community">
            <FooterLink href="/activities">Upcoming events</FooterLink>
            <FooterLink href="/#calendar">Calendar</FooterLink>
            <FooterLink href="/#story">Our story</FooterLink>
            <FooterLink href="/#gallery">Moments</FooterLink>
            {isSignedIn ? (
              <>
                <FooterLink href="/profile">My profile</FooterLink>
                <FooterLink href="/profile#my-activities">My activities</FooterLink>
              </>
            ) : (
              <>
                <FooterLink href="/signup">Create a profile</FooterLink>
                <FooterLink href="/login">Sign in</FooterLink>
              </>
            )}
          </FooterCol>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-crest">
              Move with us
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-foam/80">
              {isSignedIn
                ? 'New activities go up every week. Your details are saved, so signing up takes about ten seconds.'
                : 'New activities go up every week. Create a profile once and signing up afterwards takes about ten seconds.'}
            </p>
            <Link
              href={isSignedIn ? '/activities' : '/signup'}
              className="btn btn-primary mt-5 !bg-white !bg-none !text-brand-deeper hover:!shadow-none"
            >
              {isSignedIn ? 'See what’s on' : 'Create your profile'}
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-foam/60 sm:flex-row">
          <p>
            © {year} {SITE.name}. Made in the UAE 🌊
          </p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-kelp" />
            All levels welcome — always.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-crest">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-foam/80 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

function Social({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-foam transition hover:-translate-y-0.5 hover:border-crest/60 hover:bg-white/10 hover:text-white"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {children}
      </svg>
    </a>
  )
}
