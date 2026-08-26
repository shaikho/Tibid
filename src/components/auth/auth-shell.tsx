import Link from 'next/link'

import { Logo } from '@/components/site/logo'
import { OceanBackdrop } from '@/components/ui/waves'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-mist via-shell to-mist px-5 py-32">
      <OceanBackdrop />

      <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
          <Logo href="/" className="mx-auto h-12" priority />
          <h1 className="mt-8 font-display text-[clamp(1.9rem,4.5vw,2.6rem)] font-extrabold leading-tight text-deep">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-balance leading-relaxed text-tide">{subtitle}</p>
        </div>

        <div className="card p-6 shadow-float sm:p-8">{children}</div>

        <div className="mt-6 text-center text-sm text-tide">{footer}</div>

        <p className="mt-8 text-center text-xs text-tide/60">
          <Link href="/" className="hover:text-brand">
            ← Back to tibid.community
          </Link>
        </p>
      </div>
    </div>
  )
}
