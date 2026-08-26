'use client'

import { motion } from 'motion/react'

import { initials, instagramUrl, publicName } from '@/lib/utils'

export type PublicAttendee = {
  id: string
  firstName: string
  lastName: string
  instagram: string | null
  participationChoice: string | null
  isTibidMember: boolean
}

export function AttendeeList({
  attendees,
  isPublic,
  capacity,
}: {
  attendees: PublicAttendee[]
  isPublic: boolean
  capacity: number | null
}) {
  if (!isPublic) {
    return (
      <div className="card p-6">
        <h3 className="font-display text-base font-bold text-deep">Who&rsquo;s coming</h3>
        <p className="mt-2 text-sm leading-relaxed text-tide">
          The organisers have kept the attendee list for this activity private.{' '}
          <strong className="text-deep">{attendees.length}</strong>{' '}
          {attendees.length === 1 ? 'person is' : 'people are'} signed up so far.
        </p>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-base font-bold text-deep">Who&rsquo;s coming</h3>
        <span className="chip bg-kelp/12 text-kelp">
          {attendees.length}
          {capacity ? ` / ${capacity}` : ''} going
        </span>
      </div>

      {attendees.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-tide">
          Nobody yet — be the first to sign up and set the wave in motion. 🌊
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-2.5">
            {attendees.map((a, i) => {
              const ig = instagramUrl(a.instagram)
              return (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.035, 0.5) }}
                  className="flex items-center gap-3"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(i * 47) % 360} 72% 52%), #01458B)`,
                    }}
                    aria-hidden
                  >
                    {initials(a.firstName, a.lastName)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-deep">
                      {publicName(a.firstName, a.lastName)}
                      {!a.isTibidMember && (
                        <span className="ml-1.5 text-[11px] font-medium text-kelp">· first time</span>
                      )}
                    </span>
                    {a.participationChoice && (
                      <span className="block truncate text-xs text-tide/75">
                        {a.participationChoice}
                      </span>
                    )}
                  </span>
                  {ig && (
                    <a
                      href={ig}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="shrink-0 text-xs font-medium text-brand/80 transition hover:text-brand"
                    >
                      {a.instagram?.startsWith('@') ? a.instagram : `@${a.instagram}`}
                    </a>
                  )}
                </motion.li>
              )
            })}
          </ul>

          <p className="mt-5 border-t border-foam/70 pt-4 text-xs leading-relaxed text-tide/70">
            Surnames are shortened to an initial. Phone numbers, emails and health notes are only
            ever visible to the organisers.
          </p>
        </>
      )}
    </div>
  )
}
