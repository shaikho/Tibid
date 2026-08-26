/**
 * Seeds the database with an admin account, a handful of realistic activities
 * across all five categories, and a few gallery placeholders.
 *
 *   npm run db:push     # create the tables first
 *   npm run db:seed
 *
 * Reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD, falling back to the values below.
 * Running it twice is safe — it skips anything that already exists.
 */

import { config } from 'dotenv'
import { eq, sql } from 'drizzle-orm'

config({ path: '.env.local' })
config({ path: '.env' })

async function main() {
  const { db, activities, galleryItems, users } = await import('../src/db')
  const { hashPassword } = await import('../src/lib/password')
  const { slugify } = await import('../src/lib/utils')

  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@tibid.community').toLowerCase()
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026'

  /* ------------------------------- Admin ------------------------------- */
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${adminEmail}`)
    .limit(1)

  let adminId: string

  if (existingAdmin) {
    adminId = existingAdmin.id
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, adminId))
    console.log(`✓ Admin already existed — promoted ${adminEmail} to admin`)
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        firstName: 'TIBID',
        lastName: 'Organiser',
        role: 'admin',
        isTibidMember: true,
        photoConsent: true,
      })
      .returning()
    adminId = created.id
    console.log(`✓ Created admin  ${adminEmail}  /  ${adminPassword}`)
    console.log('  ↳ change this password from /profile as soon as you sign in')
  }

  /* ----------------------------- Activities ----------------------------- */
  const now = new Date()
  const inDays = (d: number, hour: number, minute = 0) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() + d)
    // Stored as UTC; hour/minute are Dubai time (UTC+4)
    date.setUTCHours(hour - 4, minute, 0, 0)
    return date
  }

  const seeds = [
    {
      category: 'running' as const,
      title: 'TIBID Morning Run — Indoor Mallathon',
      tagline: 'Join TIBID for an energising indoor run — you choose your pace!',
      description:
        'Come for the movement, stay for the connection…\n\nWe meet on the ground floor, warm up together and set off as one group. Run the full loop, walk it, or mix the two — everyone finishes together and we grab coffee afterwards.',
      location: 'Dubai Hills Mall — Ground Floor',
      meetingPoint: 'Near Center Point',
      mapLink: 'https://www.google.com/maps/place/Dubai+Hills+Mall/@25.1030,55.2478,17z',
      startsAt: inDays(3, 7, 30),
      endsAt: inDays(3, 9, 0),
      price: '0',
      difficulty: 'all_levels' as const,
      capacity: 80,
      participationLabel: 'Will you be running or walking?',
      participationOptions: ['Running', 'Walking', 'A bit of both'],
      whatToBring: 'Water bottle, comfortable running shoes, and a smile.',
    },
    {
      category: 'volleyball' as const,
      title: 'Sunset Beach Volleyball',
      tagline: 'Sand, nets and golden hour at Kite Beach.',
      description:
        'Casual rotating games — we mix teams every set so you play with everyone.\n\nNever played? Perfect. We spend the first fifteen minutes on the basics before games start.',
      location: 'Kite Beach, Umm Suqeim',
      meetingPoint: 'Volleyball courts by the running track',
      mapLink: 'https://www.google.com/maps/place/Kite+Beach/@25.1413,55.1925,16z',
      startsAt: inDays(5, 17, 0),
      endsAt: inDays(5, 19, 30),
      price: '0',
      difficulty: 'beginner' as const,
      capacity: 24,
      participationLabel: 'What is your playing level?',
      participationOptions: ['First time playing', 'Casual', 'Competitive'],
      whatToBring: 'Water, sunscreen, and a light layer for after sunset.',
    },
    {
      category: 'yoga' as const,
      title: 'Sunrise Flow by the Water',
      tagline: 'Breathe, stretch, reset — before the city wakes up.',
      description:
        'A gentle 60-minute vinyasa flow led by a certified instructor, facing the water.\n\nMats down, phones away. We finish with a short guided breathing session.',
      location: 'Dubai Creek Harbour Promenade',
      meetingPoint: 'By the viewing deck steps',
      mapLink: 'https://www.google.com/maps/place/Dubai+Creek+Harbour/@25.1972,55.3465,15z',
      startsAt: inDays(7, 6, 15),
      endsAt: inDays(7, 7, 15),
      price: '40',
      difficulty: 'all_levels' as const,
      capacity: 30,
      participationLabel: 'Have you practised before?',
      participationOptions: ['Complete beginner', 'Some experience', 'Regular practitioner'],
      whatToBring: 'Your own mat, water, and a light towel.',
    },
    {
      category: 'hiking' as const,
      title: 'Hatta Wadi Trail — Sunrise Hike',
      tagline: 'Out of the city and up into the Hajar mountains.',
      description:
        'A 7km loop with roughly 300m of climbing. Steady pace, plenty of stops for photos and water.\n\nWe carpool from Dubai at 5:00 AM — reply on Instagram if you can offer or need a seat.',
      location: 'Hatta Wadi Hub, Hatta',
      meetingPoint: 'Main car park, trailhead marker',
      mapLink: 'https://www.google.com/maps/place/Hatta+Wadi+Hub/@24.7981,56.1197,14z',
      startsAt: inDays(10, 6, 0),
      endsAt: inDays(10, 10, 0),
      price: '0',
      difficulty: 'moderate' as const,
      capacity: 25,
      participationLabel: 'Which pace group suits you?',
      participationOptions: ['Steady pace', 'Moderate pace', 'Fast pace'],
      whatToBring: 'At least 2L of water, hiking shoes with grip, hat, sunscreen, snacks.',
    },
    {
      category: 'horse_riding' as const,
      title: 'Desert Trail Ride at Golden Hour',
      tagline: 'For absolute first-timers and confident riders alike.',
      description:
        'A guided 90-minute ride through the dunes with certified instructors.\n\nNever sat on a horse? You will be matched with a calm, experienced horse and walked through everything beforehand.',
      location: 'Al Marmoom Desert Conservation Reserve',
      meetingPoint: 'Stables reception',
      mapLink: 'https://www.google.com/maps/place/Al+Marmoom+Desert+Conservation+Reserve/@24.8215,55.3856,12z',
      startsAt: inDays(12, 16, 30),
      endsAt: inDays(12, 18, 0),
      price: '250',
      difficulty: 'beginner' as const,
      capacity: 12,
      participationLabel: 'What is your riding experience?',
      participationOptions: ['Never ridden', 'Beginner', 'Confident rider'],
      whatToBring: 'Long trousers and closed shoes are required. Helmets are provided.',
    },
  ]

  let inserted = 0
  for (const seed of seeds) {
    const slug = slugify(`${seed.title}-${seed.startsAt.toISOString().slice(0, 10)}`)
    const [exists] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.slug, slug))
      .limit(1)

    if (exists) continue

    await db.insert(activities).values({
      ...seed,
      slug,
      currency: 'AED',
      published: true,
      attendeesPublic: true,
      createdBy: adminId,
    })
    inserted++
  }
  console.log(`✓ Activities: ${inserted} inserted, ${seeds.length - inserted} already present`)

  /* ------------------------------ Gallery ------------------------------ */
  const [galleryCount] = await db.select({ n: sql<number>`count(*)::int` }).from(galleryItems)

  if ((galleryCount?.n ?? 0) === 0) {
    await db.insert(galleryItems).values(
      [
        ['photo-1571008887538-b36bb32f4571', 'Friday morning run crew'],
        ['photo-1544551763-46a013bb70d5', 'Golden hour on the sand'],
        ['photo-1506126613408-eca07ce68773', 'Sunrise flow by the water'],
        ['photo-1551632811-561732d1e306', 'Up in the Hajar mountains'],
        ['photo-1553284965-83fd3e82fa5a', 'Desert trails at dusk'],
        ['photo-1517649763962-0c623066013b', 'Everyone finishes together'],
      ].map(([id, caption], i) => ({
        imageUrl: `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`,
        caption,
        sortOrder: i,
      })),
    )
    console.log('✓ Gallery: 6 placeholder images added (replace with your own photos)')
  } else {
    console.log('✓ Gallery already has items — left untouched')
  }

  console.log('\n🌊 Seed complete.')
}

main().catch((error) => {
  console.error('\n✗ Seed failed:\n', error)
  process.exit(1)
})
