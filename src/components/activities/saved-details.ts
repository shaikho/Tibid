'use client'

import type { Prefill } from './registration-form'

/**
 * A returning attendee's details, remembered so they don't retype them.
 *
 * Two sources, in priority order:
 *
 *  1. **The signed-in member's profile** — sent from the server. Authoritative,
 *     and available on any device they log in from.
 *  2. **A local snapshot** — for guests who register without an account. Kept
 *     in this browser only; it never reaches the server or another device.
 *
 * The snapshot exists purely to save typing, so it is treated as disposable:
 * anything malformed is discarded rather than repaired, and `forgetSavedDetails`
 * removes it completely. It is only ever written for guests — a signed-in
 * member's details already live on their profile, and duplicating health notes
 * onto the device would be storing sensitive data for no benefit.
 */

const STORAGE_KEY = 'tibid.savedDetails.v1'

export const EMPTY_PREFILL: Prefill = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: '',
  instagram: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  healthNotes: '',
  isTibidMember: false,
  photoConsent: false,
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function readSavedDetails(): Prefill | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>

    const details: Prefill = {
      firstName: str(o.firstName),
      lastName: str(o.lastName),
      email: str(o.email),
      phone: str(o.phone),
      gender: str(o.gender),
      instagram: str(o.instagram),
      emergencyContactName: str(o.emergencyContactName),
      emergencyContactPhone: str(o.emergencyContactPhone),
      healthNotes: str(o.healthNotes),
      isTibidMember: o.isTibidMember === true,
      photoConsent: o.photoConsent === true,
    }

    // Worth offering only if there's actually something to fill in.
    if (!details.firstName && !details.email) return null
    return details
  } catch {
    // Private mode, disabled storage, corrupted JSON — all just mean "no saved details".
    return null
  }
}

export function writeSavedDetails(details: Prefill): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(details))
  } catch {
    // Never let a storage failure interfere with an actual registration.
  }
}

export function forgetSavedDetails(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to do */
  }
}

/** Pulls a snapshot out of the submitted form, for the guest path. */
export function snapshotFromForm(form: HTMLFormElement): Prefill {
  const data = new FormData(form)
  const get = (name: string) => str(data.get(name)).trim()

  return {
    firstName: get('firstName'),
    lastName: get('lastName'),
    email: get('email'),
    phone: get('phone'),
    gender: get('gender'),
    instagram: get('instagram'),
    emergencyContactName: get('emergencyContactName'),
    emergencyContactPhone: get('emergencyContactPhone'),
    healthNotes: get('healthNotes'),
    isTibidMember: get('isTibidMember') === 'yes',
    photoConsent: data.get('photoConsent') === 'on',
  }
}
