import { desc, eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'

import { db, activities, registrations, users } from '@/db'
import { getCurrentUser } from '@/lib/auth'
import { GENDERS } from '@/lib/constants'
import { SHEET_HEADERS, registrationToRow } from '@/lib/google-sheets'
import { formatDateTime, normalizeInstagram, slugify } from '@/lib/utils'

/** Quotes a CSV cell and neutralises spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function csv(rows: (string | number)[][]): string {
  // BOM so Excel opens UTF-8 (Arabic names, emoji) correctly.
  return `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`
}

function download(body: string, filename: string) {
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
  }

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type')
  const activityId = searchParams.get('activityId')

  /* --------------------------- Members export --------------------------- */
  if (type === 'members') {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt))

    return download(
      csv([
        [
          'Joined',
          'First name',
          'Last name',
          'Email',
          'Phone',
          'Gender',
          'Instagram',
          'Emergency contact',
          'Emergency phone',
          'Health notes',
          'Existing TIBID member',
          'Photo consent',
          'Role',
        ],
        ...rows.map((u) => [
          formatDateTime(u.createdAt),
          u.firstName,
          u.lastName,
          u.email,
          u.phone ?? '',
          u.gender ? GENDERS[u.gender] : '',
          normalizeInstagram(u.instagram) ?? '',
          u.emergencyContactName ?? '',
          u.emergencyContactPhone ?? '',
          u.healthNotes ?? '',
          u.isTibidMember ? 'Yes' : 'No',
          u.photoConsent ? 'Yes' : 'No',
          u.role,
        ]),
      ]),
      `tibid-members-${new Date().toISOString().slice(0, 10)}.csv`,
    )
  }

  /* ------------------------ Registrations export ------------------------ */
  const base = db
    .select({ registration: registrations, activity: activities })
    .from(registrations)
    .innerJoin(activities, eq(registrations.activityId, activities.id))

  const rows = activityId
    ? await base.where(eq(registrations.activityId, activityId)).orderBy(registrations.createdAt)
    : await base.orderBy(desc(registrations.createdAt))

  const name = activityId
    ? `tibid-${slugify(rows[0]?.activity.title ?? 'activity')}-registrations.csv`
    : `tibid-registrations-${new Date().toISOString().slice(0, 10)}.csv`

  return download(
    csv([
      [...SHEET_HEADERS, 'Checked in'],
      ...rows.map(({ registration, activity }) => [
        ...registrationToRow(registration, activity),
        registration.checkedIn ? 'Yes' : 'No',
      ]),
    ]),
    name,
  )
}
