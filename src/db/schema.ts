import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/*  Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const categoryEnum = pgEnum('category', [
  'running',
  'volleyball',
  'yoga',
  'hiking',
  'horse_riding',
])

export const difficultyEnum = pgEnum('difficulty', [
  'all_levels',
  'beginner',
  'easy',
  'moderate',
  'challenging',
  'advanced',
])

export const roleEnum = pgEnum('role', ['member', 'admin'])

export const genderEnum = pgEnum('gender', ['female', 'male', 'other', 'prefer_not_to_say'])

export const registrationStatusEnum = pgEnum('registration_status', [
  'going',
  'waitlist',
  'cancelled',
])

/* -------------------------------------------------------------------------- */
/*  Users — members and admins live in one table, separated by `role`          */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull().default('member'),

    // Profile — pre-fills the registration form on every future signup
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    gender: genderEnum('gender'),
    phone: text('phone'),
    instagram: text('instagram'),

    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    healthNotes: text('health_notes'),

    isTibidMember: boolean('is_tibid_member').notNull().default(false),
    photoConsent: boolean('photo_consent').notNull().default(true),

    avatarUrl: text('avatar_url'),
    bio: text('bio'),

    /*
     * Stamped every time the password changes. Sessions are stateless JWTs, so
     * there is no server-side list of them to delete — instead any session
     * issued before this moment is treated as signed out (see getCurrentUser).
     * That is what makes "reset my password" actually kick out whoever else was
     * signed in, which is the whole point of resetting it.
     */
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_unique').on(sql`lower(${t.email})`)],
)

/* -------------------------------------------------------------------------- */
/*  Activities                                                                 */
/* -------------------------------------------------------------------------- */

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),

    category: categoryEnum('category').notNull(),
    title: text('title').notNull(),
    tagline: text('tagline'),
    description: text('description'),

    /** Human-readable venue, e.g. "Dubai Hills Mall – Ground Floor" */
    location: text('location').notNull(),
    /** Specific meeting spot, e.g. "Near Center Point" */
    meetingPoint: text('meeting_point'),
    /** Google Maps pin link — rendered as an embedded map */
    mapLink: text('map_link'),

    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),

    /** 0 = free */
    price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
    currency: text('currency').notNull().default('AED'),

    difficulty: difficultyEnum('difficulty').notNull().default('all_levels'),

    /** null = unlimited */
    capacity: integer('capacity'),

    coverImage: text('cover_image'),

    /** Question asked on the signup form, e.g. "Will you be running or walking?" */
    participationLabel: text('participation_label'),
    /** Answer options for the question above */
    participationOptions: text('participation_options')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),

    /** Extra notes rendered on the detail page ("bring a mat", "closed shoes") */
    whatToBring: text('what_to_bring'),

    published: boolean('published').notNull().default(false),
    /** Public attendee list visible to everyone, or admins only */
    attendeesPublic: boolean('attendees_public').notNull().default(true),

    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('activities_slug_unique').on(t.slug),
    index('activities_starts_at_idx').on(t.startsAt),
    index('activities_category_idx').on(t.category),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Registrations                                                              */
/* -------------------------------------------------------------------------- */

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    activityId: uuid('activity_id')
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    /** null when someone signs up as a guest without an account */
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Snapshot of the attendee at the time they signed up
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    gender: genderEnum('gender'),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    instagram: text('instagram'),

    participationChoice: text('participation_choice'),

    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    healthNotes: text('health_notes'),

    isTibidMember: boolean('is_tibid_member').notNull().default(false),
    photoConsent: boolean('photo_consent').notNull().default(false),
    agreedToTerms: boolean('agreed_to_terms').notNull().default(false),

    status: registrationStatusEnum('status').notNull().default('going'),
    checkedIn: boolean('checked_in').notNull().default(false),

    /** Whether this row made it into the Google Sheet */
    sheetSynced: boolean('sheet_synced').notNull().default(false),
    sheetSyncError: text('sheet_sync_error'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('registrations_activity_email_unique').on(t.activityId, sql`lower(${t.email})`),
    index('registrations_activity_idx').on(t.activityId),
    index('registrations_user_idx').on(t.userId),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Gallery — the portfolio side of the site                                   */
/* -------------------------------------------------------------------------- */

export const galleryItems = pgTable('gallery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  category: categoryEnum('category'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* -------------------------------------------------------------------------- */
/*  Password reset tokens                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Only the SHA-256 of the token is stored, never the token itself. The raw
 * value exists in exactly two places: the link in the email, and the URL the
 * member clicks. So a leaked database backup cannot be used to reset anyone's
 * password — the same reason password hashes are stored rather than passwords.
 *
 * `usedAt` makes a token single-use. It is kept rather than deleted so a second
 * click on the same link can say "this link has already been used" instead of
 * the vaguer "invalid link".
 */
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    requestedIp: text('requested_ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('password_reset_tokens_hash_unique').on(t.tokenHash),
    index('password_reset_tokens_user_idx').on(t.userId),
    index('password_reset_tokens_created_idx').on(t.createdAt),
  ],
)

/* -------------------------------------------------------------------------- */
/*  Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  registrations: many(registrations),
  createdActivities: many(activities),
  passwordResetTokens: many(passwordResetTokens),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  registrations: many(registrations),
  creator: one(users, { fields: [activities.createdBy], references: [users.id] }),
}))

export const registrationsRelations = relations(registrations, ({ one }) => ({
  activity: one(activities, { fields: [registrations.activityId], references: [activities.id] }),
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
}))

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type Registration = typeof registrations.$inferSelect
export type NewRegistration = typeof registrations.$inferInsert
export type GalleryItem = typeof galleryItems.$inferSelect
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect

export type Category = (typeof categoryEnum.enumValues)[number]
export type Difficulty = (typeof difficultyEnum.enumValues)[number]
export type Gender = (typeof genderEnum.enumValues)[number]
