import type { Metadata } from 'next'
import Link from 'next/link'

import { AdminTabs } from '@/components/admin/admin-tabs'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-shell pb-24 pt-28">
      <div className="container-tibid">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-foam pb-6">
          <div>
            <span className="chip bg-deep text-crest">Organiser tools</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-none text-deep sm:text-4xl">
              TIBID admin
            </h1>
            <p className="mt-2 text-sm text-tide">
              Signed in as {admin.firstName} {admin.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="btn btn-outline !py-2 !text-sm">
              View site
            </Link>
            <Link href="/admin/activities/new" className="btn btn-primary !py-2 !text-sm">
              + New activity
            </Link>
          </div>
        </header>

        <AdminTabs />

        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
