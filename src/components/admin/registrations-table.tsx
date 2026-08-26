'use client'

import { motion } from 'motion/react'
import { useMemo, useState, useTransition } from 'react'

import type { Registration } from '@/db/schema'
import {
  deleteRegistrationAction,
  setRegistrationStatusAction,
  toggleCheckInAction,
} from '@/lib/actions/activities'
import { GENDERS } from '@/lib/constants'
import { cn, instagramUrl, normalizeInstagram } from '@/lib/utils'

/**
 * `submittedAt` is formatted on the server and passed down as a plain string.
 * Formatting dates inside a client component risks a hydration mismatch when
 * Node's and the browser's ICU builds disagree, so we never do it here.
 */
export type Row = Registration & { activityTitle?: string; submittedAt: string }

export function RegistrationsTable({
  registrations,
  showActivity = false,
  exportHref,
}: {
  registrations: Row[]
  showActivity?: boolean
  exportHref?: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'going' | 'waitlist' | 'cancelled'>('all')
  const [pending, startTransition] = useTransition()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return registrations.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!q) return true
      return [r.firstName, r.lastName, r.email, r.phone, r.instagram, r.activityTitle]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [registrations, query, filter])

  const counts = useMemo(
    () => ({
      all: registrations.length,
      going: registrations.filter((r) => r.status === 'going').length,
      waitlist: registrations.filter((r) => r.status === 'waitlist').length,
      cancelled: registrations.filter((r) => r.status === 'cancelled').length,
      checkedIn: registrations.filter((r) => r.checkedIn).length,
    }),
    [registrations],
  )

  if (registrations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-foam p-10 text-center">
        <p className="text-sm text-tide">Nobody has signed up yet.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone…"
          className="field max-w-xs"
          aria-label="Search registrations"
        />

        <div className="flex gap-1">
          {(['all', 'going', 'waitlist', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition',
                filter === f ? 'bg-brand text-white' : 'bg-mist text-tide hover:text-brand',
              )}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        <span className="chip bg-kelp/12 text-kelp">{counts.checkedIn} checked in</span>

        {exportHref && (
          <a href={exportHref} className="btn btn-outline ml-auto !py-2 !text-xs" download>
            ⬇ Export CSV
          </a>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-foam">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-sm">
            <thead>
              <tr className="bg-mist/70 text-left text-xs font-bold uppercase tracking-wide text-tide">
                <th className="px-3 py-3">✓</th>
                <th className="px-3 py-3">Name</th>
                {showActivity && <th className="px-3 py-3">Activity</th>}
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Instagram</th>
                <th className="px-3 py-3">Taking part as</th>
                <th className="px-3 py-3">Emergency</th>
                <th className="px-3 py-3">Health notes</th>
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Signed up</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className={cn(
                    'border-t border-foam/70 align-top',
                    r.status === 'cancelled' ? 'bg-coral/5 opacity-60' : 'bg-white hover:bg-mist/40',
                  )}
                >
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => startTransition(() => void toggleCheckInAction(r.id))}
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-md border-[1.5px] transition',
                        r.checkedIn
                          ? 'border-kelp bg-kelp text-white'
                          : 'border-tide/25 text-transparent hover:border-kelp',
                      )}
                      aria-label={r.checkedIn ? 'Undo check-in' : 'Check in'}
                      title={r.checkedIn ? 'Checked in' : 'Mark as checked in'}
                    >
                      <svg width="12" height="10" viewBox="0 0 11 9" fill="none">
                        <path
                          d="M1 4.5 4 7.5 10 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </td>

                  <td className="px-3 py-3">
                    <div className="font-semibold text-deep">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="mt-0.5 text-xs text-tide">
                      {r.gender ? GENDERS[r.gender] : '—'}
                    </div>
                  </td>

                  {showActivity && (
                    <td className="max-w-44 px-3 py-3 text-xs text-tide">{r.activityTitle}</td>
                  )}

                  <td className="px-3 py-3">
                    <a href={`tel:${r.phone}`} className="block text-xs text-brand hover:underline">
                      {r.phone}
                    </a>
                    <a
                      href={`mailto:${r.email}`}
                      className="block max-w-48 truncate text-xs text-tide hover:text-brand"
                    >
                      {r.email}
                    </a>
                  </td>

                  <td className="px-3 py-3 text-xs">
                    {r.instagram ? (
                      <a
                        href={instagramUrl(r.instagram) ?? '#'}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-brand hover:underline"
                      >
                        {normalizeInstagram(r.instagram)}
                      </a>
                    ) : (
                      <span className="text-tide/50">—</span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs text-tide">
                    {r.participationChoice ?? <span className="text-tide/50">—</span>}
                  </td>

                  <td className="px-3 py-3 text-xs text-tide">
                    {r.emergencyContactName ? (
                      <>
                        <div>{r.emergencyContactName}</div>
                        <div className="text-tide/70">{r.emergencyContactPhone}</div>
                      </>
                    ) : (
                      <span className="text-tide/50">—</span>
                    )}
                  </td>

                  <td className="max-w-52 px-3 py-3 text-xs">
                    {r.healthNotes ? (
                      <span className="inline-block rounded-lg bg-sand/25 px-2 py-1 text-deep">
                        {r.healthNotes}
                      </span>
                    ) : (
                      <span className="text-tide/50">—</span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs">
                    {r.isTibidMember ? (
                      <span className="chip bg-brand/10 text-brand">Returning</span>
                    ) : (
                      <span className="chip bg-kelp/12 text-kelp">First time</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 text-xs text-tide">
                    {r.submittedAt}
                    {!r.sheetSynced && (
                      <span className="mt-1 block text-[10px] font-semibold text-coral">
                        not in sheet
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <select
                      value={r.status}
                      onChange={(e) =>
                        startTransition(() =>
                          void setRegistrationStatusAction(
                            r.id,
                            e.target.value as 'going' | 'waitlist' | 'cancelled',
                          ),
                        )
                      }
                      className="rounded-lg border border-foam bg-white px-2 py-1 text-xs font-semibold text-deep"
                      aria-label={`Status for ${r.firstName}`}
                    >
                      <option value="going">Going</option>
                      <option value="waitlist">Waitlist</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Permanently delete ${r.firstName}'s registration?`)) {
                          startTransition(() => void deleteRegistrationAction(r.id))
                        }
                      }}
                      className="text-xs font-semibold text-coral hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="py-6 text-center text-sm text-tide">Nothing matches that search.</p>
      )}
    </div>
  )
}
