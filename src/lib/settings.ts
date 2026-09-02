import 'server-only'

import { inArray } from 'drizzle-orm'
import { cache } from 'react'

import { appSettings, db } from '@/db'
import { SITE } from '@/lib/constants'

/**
 * Settings organisers can change from the admin dashboard.
 *
 * The one that exists today is who a locked-out member should message. That
 * changes when someone hands over the role, or goes on holiday, or leaves — and
 * an organiser should be able to fix it in thirty seconds rather than wait for
 * a deploy.
 */

export const SETTING_KEYS = {
  /** Digits only, country code first — the shape wa.me needs. */
  supportWhatsapp: 'support_whatsapp',
  /** Who the number belongs to, so the button can say who is on the other end. */
  supportName: 'support_name',
} as const

export type SupportContact = {
  /** Normalised digits, or null when nobody has set one yet. */
  whatsapp: string | null
  name: string | null
  /** Where the "get help" button should point. Never null — Instagram is the floor. */
  href: string
  /** 'whatsapp' when a number is configured, otherwise 'instagram'. */
  channel: 'whatsapp' | 'instagram'
  label: string
}

/* -------------------------------------------------------------------------- */
/*  Phone numbers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * wa.me takes digits and nothing else: no `+`, no spaces, no dashes. Organisers
 * will paste numbers in every format a phone offers, so strip first and judge
 * afterwards.
 *
 * A leading zero is rejected rather than guessed at. `050 123 4567` is a
 * perfectly good UAE number and a perfectly good number in a dozen other
 * countries; silently prepending 971 would send some members to a stranger.
 */
export function normalizeWhatsapp(input: string): { digits: string } | { error: string } {
  const digits = input.replace(/[^\d]/g, '')

  if (!digits) return { error: 'Enter a WhatsApp number.' }
  if (digits.startsWith('0')) {
    return {
      error:
        'Start with the country code, not a zero — for the UAE that is 971, so 050 123 4567 becomes +971 50 123 4567.',
    }
  }
  if (digits.length < 8 || digits.length > 15) {
    return { error: 'That does not look like a full international number.' }
  }

  return { digits }
}

/**
 * For display. Deliberately does not try to split off a country code and group
 * the rest: country codes are one to three digits with no way to tell which
 * from the number alone, so any grouping would be a guess, and a guess rendered
 * as `+12 12 555 1234` reads as a real country code that does not exist. The
 * digits back verbatim are unambiguous, and the "Test this link" button is the
 * check that actually proves the number is right.
 */
export function formatWhatsapp(digits: string): string {
  return `+${digits}`
}

/**
 * A wa.me link with the first message already written.
 *
 * The prefill is doing real work: it tells the member to include the email on
 * their profile, which is the one thing the organiser needs to find them and
 * the thing they most often leave out.
 */
export function whatsappLink(digits: string): string {
  const text = `Hi ${SITE.shortName}, I can't get into my account and need a password reset. The email on my profile is: `
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/* -------------------------------------------------------------------------- */
/*  Reading                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Cached per request: the login page and its modal both want this, and it is
 * one row that cannot change mid-render.
 *
 * Never throws. This decorates a page that must render even when the database
 * is having a bad day — a member who cannot sign in should still see how to
 * ask for help, and Instagram is always there as the fallback.
 */
export const getSupportContact = cache(async (): Promise<SupportContact> => {
  const fallback: SupportContact = {
    whatsapp: null,
    name: null,
    href: SITE.instagram,
    channel: 'instagram',
    label: 'Message us on Instagram',
  }

  try {
    const rows = await db
      .select()
      .from(appSettings)
      .where(inArray(appSettings.key, [SETTING_KEYS.supportWhatsapp, SETTING_KEYS.supportName]))

    const map = new Map(rows.map((r) => [r.key, r.value.trim()]))
    const whatsapp = map.get(SETTING_KEYS.supportWhatsapp) || null
    const name = map.get(SETTING_KEYS.supportName) || null

    if (!whatsapp) return { ...fallback, name }

    return {
      whatsapp,
      name,
      href: whatsappLink(whatsapp),
      channel: 'whatsapp',
      label: name ? `Message ${name} on WhatsApp` : 'Message us on WhatsApp',
    }
  } catch {
    return fallback
  }
})

/* -------------------------------------------------------------------------- */
/*  Writing                                                                    */
/* -------------------------------------------------------------------------- */

/** Upserts one setting. Callers are responsible for checking the caller is an admin. */
export async function putSetting(
  key: string,
  value: string,
  updatedBy: string | null,
): Promise<void> {
  await db
    .insert(appSettings)
    .values({ key, value, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedBy, updatedAt: new Date() },
    })
}

export async function deleteSetting(key: string): Promise<void> {
  await db.delete(appSettings).where(inArray(appSettings.key, [key]))
}
