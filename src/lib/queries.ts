import 'server-only'

import { and, asc, count, desc, eq, gte, lt, sql } from 'drizzle-orm'

import { db, activities, galleryItems, registrations, users } from '@/db'
import type { Activity, Category } from '@/db/schema'

export type ActivityWithCount = Activity & { attendeeCount: number }

/*
 * Attendee counts come from a LEFT JOIN + GROUP BY rather than a correlated
 * subquery built with the `sql` template.
 *
 * The subquery version was silently wrong: drizzle interpolates a column
 * reference inside a raw `sql` fragment without its table prefix, so
 * `${registrations.activityId} = ${activities.id}` compiled to
 * `where "activity_id" = "id"`. Inside the subquery both names resolve against
 * `registrations`, making it compare a row's activity_id to its own id — never
 * true, so every count came back 0. A join keeps the reference qualified and
 * type-checked, and it cannot drift if a column is ever renamed.
 *
 * Grouping by the primary key alone is valid in Postgres: every other selected
 * column is functionally dependent on it.
 */
const goingJoin = and(
  eq(registrations.activityId, activities.id),
  eq(registrations.status, 'going'),
)

const attendeeCount = sql<number>`count(${registrations.id})::int`

export async function getUpcomingActivities(options?: {
  limit?: number
  category?: Category
  includeUnpublished?: boolean
}): Promise<ActivityWithCount[]> {
  const conditions = [gte(activities.startsAt, new Date())]
  if (!options?.includeUnpublished) conditions.push(eq(activities.published, true))
  if (options?.category) conditions.push(eq(activities.category, options.category))

  const query = db
    .select({ activity: activities, attendeeCount })
    .from(activities)
    .leftJoin(registrations, goingJoin)
    .where(and(...conditions))
    .groupBy(activities.id)
    .orderBy(asc(activities.startsAt))

  const rows = options?.limit ? await query.limit(options.limit) : await query
  return rows.map((r) => ({ ...r.activity, attendeeCount: r.attendeeCount }))
}

export async function getPastActivities(options?: {
  limit?: number
  category?: Category
}): Promise<ActivityWithCount[]> {
  const conditions = [lt(activities.startsAt, new Date()), eq(activities.published, true)]
  if (options?.category) conditions.push(eq(activities.category, options.category))

  const query = db
    .select({ activity: activities, attendeeCount })
    .from(activities)
    .leftJoin(registrations, goingJoin)
    .where(and(...conditions))
    .groupBy(activities.id)
    .orderBy(desc(activities.startsAt))

  const rows = options?.limit ? await query.limit(options.limit) : await query
  return rows.map((r) => ({ ...r.activity, attendeeCount: r.attendeeCount }))
}

export async function getActivityBySlug(slug: string): Promise<Activity | null> {
  const [row] = await db.select().from(activities).where(eq(activities.slug, slug)).limit(1)
  return row ?? null
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1)
  return row ?? null
}

export async function getAllActivitiesForAdmin(): Promise<ActivityWithCount[]> {
  const rows = await db
    .select({ activity: activities, attendeeCount })
    .from(activities)
    .leftJoin(registrations, goingJoin)
    .groupBy(activities.id)
    .orderBy(desc(activities.startsAt))
  return rows.map((r) => ({ ...r.activity, attendeeCount: r.attendeeCount }))
}

export async function getRegistrationsForActivity(activityId: string) {
  return db
    .select()
    .from(registrations)
    .where(eq(registrations.activityId, activityId))
    .orderBy(asc(registrations.createdAt))
}

/** Trimmed-down list safe to render publicly. */
export async function getPublicAttendees(activityId: string) {
  return db
    .select({
      id: registrations.id,
      firstName: registrations.firstName,
      lastName: registrations.lastName,
      // Instagram handles are deliberately not selected — the public attendee
      // list must not expose them. Admins read the full row elsewhere.
      participationChoice: registrations.participationChoice,
      isTibidMember: registrations.isTibidMember,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(and(eq(registrations.activityId, activityId), eq(registrations.status, 'going')))
    .orderBy(asc(registrations.createdAt))
}

export async function getUserRegistration(activityId: string, userId: string) {
  const [row] = await db
    .select()
    .from(registrations)
    .where(and(eq(registrations.activityId, activityId), eq(registrations.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function getMyRegistrations(userId: string) {
  return db
    .select({ registration: registrations, activity: activities })
    .from(registrations)
    .innerJoin(activities, eq(registrations.activityId, activities.id))
    .where(eq(registrations.userId, userId))
    .orderBy(desc(activities.startsAt))
}

export async function getGallery(limit = 12) {
  return db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt))
    .limit(limit)
}

export type CommunityStats = {
  members: number
  activities: number
  signups: number
  categories: number
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const [[m], [a], [r], cats] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(activities).where(eq(activities.published, true)),
    db.select({ n: count() }).from(registrations),
    db
      .selectDistinct({ category: activities.category })
      .from(activities)
      .where(eq(activities.published, true)),
  ])

  return {
    members: m?.n ?? 0,
    activities: a?.n ?? 0,
    signups: r?.n ?? 0,
    categories: cats.length,
  }
}

export async function getAdminOverview() {
  const now = new Date()
  const [[upcoming], [totalRegs], [pendingSync], [members], [admins]] = await Promise.all([
    db.select({ n: count() }).from(activities).where(gte(activities.startsAt, now)),
    db.select({ n: count() }).from(registrations),
    db.select({ n: count() }).from(registrations).where(eq(registrations.sheetSynced, false)),
    db.select({ n: count() }).from(users).where(eq(users.role, 'member')),
    db.select({ n: count() }).from(users).where(eq(users.role, 'admin')),
  ])

  return {
    upcoming: upcoming?.n ?? 0,
    totalRegistrations: totalRegs?.n ?? 0,
    pendingSheetSync: pendingSync?.n ?? 0,
    members: members?.n ?? 0,
    admins: admins?.n ?? 0,
  }
}

export async function getAllMembers() {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      instagram: users.instagram,
      gender: users.gender,
      role: users.role,
      isTibidMember: users.isTibidMember,
      createdAt: users.createdAt,
      // Same qualification trap as the attendee count above — see the note there.
      signupCount: sql<number>`count(${registrations.id})::int`,
    })
    .from(users)
    .leftJoin(registrations, eq(registrations.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
}

export async function getRecentRegistrations(limit = 20) {
  return db
    .select({ registration: registrations, activity: activities })
    .from(registrations)
    .innerJoin(activities, eq(registrations.activityId, activities.id))
    .orderBy(desc(registrations.createdAt))
    .limit(limit)
}
