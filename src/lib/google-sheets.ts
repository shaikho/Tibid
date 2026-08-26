import { SignJWT, importPKCS8 } from 'jose'

import type { Activity, Registration } from '@/db/schema'
import { GENDERS } from './constants'
import { formatDateTime, formatPrice, normalizeInstagram } from './utils'

/**
 * Appends every registration to a Google Sheet using a service account.
 *
 * Deliberately dependency-free: we sign a service-account JWT with `jose`,
 * exchange it for an access token, and call the Sheets REST API. No `googleapis`
 * bundle (which is ~40MB and slow to cold-start on serverless).
 *
 * Required env vars — see README for the 5-minute setup:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   e.g. tibid-sheets@my-project.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY             the private_key from the service account JSON
 *   GOOGLE_SHEET_ID                the long id in the sheet URL
 *   GOOGLE_SHEET_TAB               optional, defaults to "Registrations"
 *
 * If the env vars are absent the integration silently no-ops, so the site works
 * perfectly well before you set Sheets up.
 */

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const SHEET_HEADERS = [
  'Submitted at',
  'Activity',
  'Category',
  'Activity date',
  'Location',
  'Full name',
  'Gender',
  'Mobile',
  'Email',
  'Instagram',
  'Participation',
  'Emergency contact',
  'Emergency phone',
  'Health notes',
  'Existing TIBID member',
  'Photo consent',
  'Price',
  'Status',
] as const

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID,
  )
}

function normalizePrivateKey(raw: string): string {
  // Vercel env vars store newlines as literal "\n"; also tolerate quoted values.
  return raw
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .trim()
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  const privateKey = await importPKCS8(normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY!), 'RS256')

  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`)
  }

  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  }
  return json.access_token
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken()
  const sheetId = process.env.GOOGLE_SHEET_ID!
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`Sheets API ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

function tabName(): string {
  return process.env.GOOGLE_SHEET_TAB?.trim() || 'Registrations'
}

/** Quotes the tab name for A1 notation ("My Tab" -> 'My Tab'). */
function a1(range: string): string {
  const tab = tabName()
  const quoted = /^[A-Za-z0-9_]+$/.test(tab) ? tab : `'${tab.replace(/'/g, "''")}'`
  return encodeURIComponent(`${quoted}!${range}`)
}

/** Writes the header row if the sheet is empty. Safe to call repeatedly. */
export async function ensureHeaderRow(): Promise<void> {
  const existing = (await sheetsFetch(`/values/${a1('A1:R1')}`)) as { values?: string[][] }
  if (existing.values?.[0]?.length) return

  await sheetsFetch(`/values/${a1('A1')}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: [SHEET_HEADERS] }),
  })
}

export function registrationToRow(
  registration: Registration,
  activity: Pick<
    Activity,
    'title' | 'category' | 'startsAt' | 'location' | 'meetingPoint' | 'price' | 'currency'
  >,
): (string | number)[] {
  return [
    formatDateTime(registration.createdAt),
    activity.title,
    activity.category.replace('_', ' '),
    formatDateTime(activity.startsAt),
    [activity.location, activity.meetingPoint].filter(Boolean).join(' — '),
    `${registration.firstName} ${registration.lastName}`,
    registration.gender ? GENDERS[registration.gender] : '',
    registration.phone,
    registration.email,
    normalizeInstagram(registration.instagram) ?? '',
    registration.participationChoice ?? '',
    registration.emergencyContactName ?? '',
    registration.emergencyContactPhone ?? '',
    registration.healthNotes ?? '',
    registration.isTibidMember ? 'Yes' : 'No',
    registration.photoConsent ? 'Yes' : 'No',
    formatPrice(activity.price, activity.currency),
    registration.status,
  ]
}

/** Appends one registration. Throws on failure so the caller can record the error. */
export async function appendRegistration(
  registration: Registration,
  activity: Parameters<typeof registrationToRow>[1],
): Promise<void> {
  if (!sheetsConfigured()) {
    throw new Error('Google Sheets is not configured (missing env vars).')
  }

  await ensureHeaderRow()

  await sheetsFetch(
    `/values/${a1('A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values: [registrationToRow(registration, activity)] }),
    },
  )
}

/** Bulk append — used by the admin "re-sync" action for rows that previously failed. */
export async function appendRegistrations(
  rows: Array<{
    registration: Registration
    activity: Parameters<typeof registrationToRow>[1]
  }>,
): Promise<void> {
  if (!rows.length) return
  if (!sheetsConfigured()) {
    throw new Error('Google Sheets is not configured (missing env vars).')
  }

  await ensureHeaderRow()

  await sheetsFetch(
    `/values/${a1('A1')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({
        values: rows.map((r) => registrationToRow(r.registration, r.activity)),
      }),
    },
  )
}

/** Used by the admin settings page to show a green/red status light. */
export async function testSheetsConnection(): Promise<{ ok: boolean; message: string }> {
  if (!sheetsConfigured()) {
    return { ok: false, message: 'Not configured — add the Google env vars in Vercel.' }
  }
  try {
    const meta = (await sheetsFetch('?fields=properties.title,sheets.properties.title')) as {
      properties?: { title?: string }
      sheets?: Array<{ properties?: { title?: string } }>
    }
    const tabs = meta.sheets?.map((s) => s.properties?.title).filter(Boolean) ?? []
    if (!tabs.includes(tabName())) {
      return {
        ok: false,
        message: `Connected to "${meta.properties?.title}" but no tab named "${tabName()}". Tabs found: ${tabs.join(', ')}`,
      }
    }
    await ensureHeaderRow()
    return { ok: true, message: `Connected to "${meta.properties?.title}" → tab "${tabName()}".` }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}
