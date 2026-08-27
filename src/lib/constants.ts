import type { Category, Difficulty, Gender } from '@/db/schema'

export const SITE = {
  name: 'TIBID Community',
  shortName: 'TIBID',
  tagline: 'Inspired by waves',
  description:
    'TIBID is a UAE movement community meeting across Dubai and Sharjah. Powered by and embracing movement — building an active, healthy community. All levels welcome to join the journey.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tibid.vercel.app',
  instagram: 'https://www.instagram.com/tibidcommunity/',
  instagramHandle: '@tibidcommunity',
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? '',
  /** IANA zone for the whole UAE — Dubai and Sharjah share it, with no DST. */
  timezone: 'Asia/Dubai',
  /** Where the community meets, for copy and map lookups. */
  region: 'Dubai & Sharjah',
  country: 'United Arab Emirates',
} as const

export const CATEGORIES: Record<
  Category,
  { label: string; emoji: string; blurb: string; accent: string }
> = {
  running: {
    label: 'Running',
    emoji: '🏃',
    blurb: 'Run, walk, or a bit of both — there is no race here.',
    accent: '#006BD4',
  },
  volleyball: {
    label: 'Volleyball',
    emoji: '🏐',
    blurb: 'Sand between your toes and a net in front of you.',
    accent: '#2E93F0',
  },
  yoga: {
    label: 'Yoga',
    emoji: '🧘',
    blurb: 'Breathe, stretch, reset. Mats down, phones away.',
    accent: '#12B28F',
  },
  hiking: {
    label: 'Hiking',
    emoji: '🥾',
    blurb: 'Trails, wadis and summits — at whatever pace suits you.',
    accent: '#01458B',
  },
  horse_riding: {
    label: 'Horse Riding',
    emoji: '🐎',
    blurb: 'Desert rides for first-timers and confident riders alike.',
    accent: '#FFC978',
  },
}

export const CATEGORY_ORDER: Category[] = [
  'running',
  'volleyball',
  'yoga',
  'hiking',
  'horse_riding',
]

export const DIFFICULTIES: Record<Difficulty, { label: string; dots: number }> = {
  all_levels: { label: 'All levels', dots: 0 },
  beginner: { label: 'Beginner', dots: 1 },
  easy: { label: 'Easy', dots: 1 },
  moderate: { label: 'Moderate', dots: 2 },
  challenging: { label: 'Challenging', dots: 3 },
  advanced: { label: 'Advanced', dots: 4 },
}

export const DIFFICULTY_ORDER: Difficulty[] = [
  'all_levels',
  'beginner',
  'easy',
  'moderate',
  'challenging',
  'advanced',
]

export const GENDERS: Record<Gender, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
}

/*
 * Only these two are offered in the UI. The database enum still holds
 * 'other' and 'prefer_not_to_say' on purpose — dropping them would need a
 * migration and would break any record already saved with one, so the GENDERS
 * map above keeps their labels for display.
 */
export const GENDER_ORDER: Gender[] = ['female', 'male']

/** Sensible default participation options per category, offered in the admin form. */
export const DEFAULT_PARTICIPATION: Record<Category, { label: string; options: string[] }> = {
  running: {
    label: 'Will you be running or walking?',
    options: ['Running', 'Walking', 'A bit of both'],
  },
  volleyball: {
    label: 'What is your playing level?',
    options: ['First time playing', 'Casual', 'Competitive'],
  },
  yoga: {
    label: 'Have you practised before?',
    options: ['Complete beginner', 'Some experience', 'Regular practitioner'],
  },
  hiking: {
    label: 'Which pace group suits you?',
    options: ['Steady pace', 'Moderate pace', 'Fast pace'],
  },
  horse_riding: {
    label: 'What is your riding experience?',
    options: ['Never ridden', 'Beginner', 'Confident rider'],
  },
}

export const VALUES = [
  {
    title: 'Inspired by waves',
    body: 'Movement comes in rhythms. Some weeks you charge, some weeks you float — both count.',
    emoji: '🌊',
  },
  {
    title: 'Powered by movement',
    body: 'Running, playing, stretching, climbing, riding. Whatever gets you out of the chair.',
    emoji: '⚡',
  },
  {
    title: 'An active, healthy community',
    body: 'We are here for the people as much as the workout. Stay for the coffee afterwards.',
    emoji: '💙',
  },
  {
    title: 'All levels welcome',
    body: 'No qualifying times, no gatekeeping. Come exactly as you are and start the journey.',
    emoji: '🤝',
  },
] as const
