import { z } from 'zod'

import { categoryEnum, difficultyEnum, genderEnum } from '@/db/schema'

const trimmed = (max: number) => z.string().trim().max(max)

/** Accepts UAE and international formats: +971 50 123 4567, 050 123 4567, etc. */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Please enter a valid phone number')
  .max(24, 'That phone number looks too long')
  .regex(/^[+]?[\d\s()-]{7,24}$/, 'Please enter a valid phone number')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(180)

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(200, 'That password is too long')

/* -------------------------------------------------------------------------- */
/*  Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const signUpSchema = z.object({
  firstName: trimmed(60).min(1, 'First name is required'),
  lastName: trimmed(60).min(1, 'Last name is required'),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  gender: z.enum(genderEnum.enumValues).optional(),
  instagram: trimmed(60).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
  firstName: trimmed(60).min(1, 'First name is required'),
  lastName: trimmed(60).min(1, 'Last name is required'),
  phone: phoneSchema.optional().or(z.literal('')),
  gender: z.enum(genderEnum.enumValues).optional(),
  instagram: trimmed(60).optional(),
  emergencyContactName: trimmed(120).optional(),
  emergencyContactPhone: phoneSchema.optional().or(z.literal('')),
  healthNotes: trimmed(600).optional(),
  isTibidMember: z.boolean().optional(),
  photoConsent: z.boolean().optional(),
  bio: trimmed(300).optional(),
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'The two passwords do not match',
    path: ['confirmPassword'],
  })

/* -------------------------------------------------------------------------- */
/*  Activities                                                                 */
/* -------------------------------------------------------------------------- */

const mapLinkSchema = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (v) => {
      if (!v) return true
      try {
        const u = new URL(v)
        return /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)$/i.test(u.hostname)
      } catch {
        return false
      }
    },
    { message: 'Paste a Google Maps link (google.com/maps/... or maps.app.goo.gl/...)' },
  )
  .optional()
  .or(z.literal(''))

export const activitySchema = z.object({
  category: z.enum(categoryEnum.enumValues),
  title: trimmed(140).min(3, 'Give the activity a name'),
  tagline: trimmed(200).optional(),
  description: trimmed(4000).optional(),
  location: trimmed(200).min(2, 'Where is it happening?'),
  meetingPoint: trimmed(200).optional(),
  mapLink: mapLinkSchema,
  startsAt: z.string().min(1, 'Pick a start date and time'),
  endsAt: z.string().optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(100000).default(0),
  currency: trimmed(6).default('AED'),
  difficulty: z.enum(difficultyEnum.enumValues).default('all_levels'),
  capacity: z.coerce.number().int().min(0).max(100000).optional(),
  coverImage: z.string().trim().url('Use a full image URL').max(2000).optional().or(z.literal('')),
  participationLabel: trimmed(200).optional(),
  participationOptions: z.array(trimmed(80)).max(12).default([]),
  whatToBring: trimmed(1000).optional(),
  published: z.boolean().default(false),
  attendeesPublic: z.boolean().default(true),
})

export type ActivityInput = z.input<typeof activitySchema>

/* -------------------------------------------------------------------------- */
/*  Registration — mirrors the TIBID JotForm                                   */
/* -------------------------------------------------------------------------- */

export const registrationSchema = z.object({
  activityId: z.string().uuid(),
  firstName: trimmed(60).min(1, 'First name is required'),
  lastName: trimmed(60).min(1, 'Last name is required'),
  gender: z.enum(genderEnum.enumValues, {
    required_error: 'Please choose an option',
    invalid_type_error: 'Please choose an option',
  }),
  phone: phoneSchema,
  email: emailSchema,
  instagram: trimmed(60).optional(),
  participationChoice: trimmed(80).optional(),
  emergencyContactName: trimmed(120).optional(),
  emergencyContactPhone: phoneSchema.optional().or(z.literal('')),
  healthNotes: trimmed(600).optional(),
  isTibidMember: z.boolean().default(false),
  photoConsent: z.boolean().refine((v) => v === true, {
    message: 'We need your photo and video consent to register you',
  }),
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: 'Please confirm the details above are correct',
  }),
})

export type RegistrationInput = z.input<typeof registrationSchema>

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export type FieldErrors = Record<string, string>

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
