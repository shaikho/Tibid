import type { Metadata, Viewport } from 'next'

import { Footer } from '@/components/site/footer'
import { Nav } from '@/components/site/nav'
import { getCurrentUser } from '@/lib/auth'
import { SITE } from '@/lib/constants'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'TIBID',
    'Dubai running club',
    'Sharjah running club',
    'UAE community',
    'running',
    'volleyball',
    'yoga',
    'hiking',
    'horse riding',
    'UAE fitness community',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    images: [{ url: '/tibid-logo.png', width: 1472, height: 704, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ['/tibid-logo.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/tibid-logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#006BD4',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null)

  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-5 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Nav
          user={
            user
              ? {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  role: user.role,
                }
              : null
          }
        />
        <main id="main">{children}</main>
        <Footer isSignedIn={Boolean(user)} />
      </body>
    </html>
  )
}
