import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

export function Logo({
  className,
  invert = false,
  href = '/',
  priority = false,
}: {
  className?: string
  invert?: boolean
  href?: string | null
  priority?: boolean
}) {
  const img = (
    <Image
      src="/tibid-logo.png"
      alt="TIBID Community"
      width={1472}
      height={704}
      priority={priority}
      className={cn(
        'h-10 w-auto transition-transform duration-500 will-change-transform group-hover:scale-[1.04] sm:h-12',
        invert && 'brightness-0 invert',
        className,
      )}
    />
  )

  if (!href) return img

  return (
    <Link href={href} className="group inline-flex items-center" aria-label="TIBID Community — home">
      {img}
    </Link>
  )
}
