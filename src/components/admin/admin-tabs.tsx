'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/activities', label: 'Activities' },
  { href: '/admin/registrations', label: 'Registrations' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/gallery', label: 'Moments' },
  { href: '/admin/settings', label: 'Settings' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <nav className="mt-6 flex gap-1 overflow-x-auto no-scrollbar" aria-label="Admin sections">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active ? 'text-white' : 'text-tide hover:text-brand'
            }`}
          >
            {active && (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-0 rounded-full bg-brand shadow-tide"
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
