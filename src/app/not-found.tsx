import Link from 'next/link'

import { OceanBackdrop } from '@/components/ui/waves'

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-32 text-center">
      <OceanBackdrop />
      <div className="relative">
        <div className="text-7xl">🌊</div>
        <h1 className="mt-6 font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-none text-deep">
          This wave has passed
        </h1>
        <p className="mx-auto mt-4 max-w-md text-balance leading-relaxed text-tide">
          We couldn&rsquo;t find that page. It may have been an activity that has since finished, or
          a link that changed.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/activities" className="btn btn-primary">
            See what&rsquo;s on
          </Link>
          <Link href="/" className="btn btn-outline">
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
