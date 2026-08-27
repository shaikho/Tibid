import Link from 'next/link'

import { ActivityCard } from '@/components/activities/activity-card'
import { ActivityCalendar, type CalendarActivity } from '@/components/home/activity-calendar'
import { Hero } from '@/components/home/hero'
import {
  CategoriesSection,
  GallerySection,
  JoinSection,
  SectionLabel,
  StatsBand,
  StorySection,
} from '@/components/home/sections'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal'
import { ScrollProgress } from '@/components/ui/scroll-motion'
import { WaveDivider } from '@/components/ui/waves'
import { getCurrentUser } from '@/lib/auth'
import {
  getCalendarActivities,
  getCommunityStats,
  getGallery,
  getUpcomingActivities,
  type ActivityWithCount,
  type CommunityStats,
} from '@/lib/queries'
import { dateKey, formatPrice, formatTime, isPast } from '@/lib/utils'
import type { Activity } from '@/db/schema'

export const dynamic = 'force-dynamic'

type GalleryRow = { id: string; imageUrl: string; caption: string | null }

const EMPTY_STATS: CommunityStats = { members: 0, activities: 0, signups: 0, categories: 5 }

/** The calendar window: from the start of last month to six months ahead. */
function calendarWindow() {
  const now = new Date()
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 6, 1))
  return { from, to }
}

function toCalendarActivity(a: Activity): CalendarActivity {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category,
    dateKey: dateKey(a.startsAt),
    timeLabel: formatTime(a.startsAt),
    priceLabel: formatPrice(a.price, a.currency),
    location: a.location,
    isPast: isPast(a.startsAt),
  }
}

export default async function HomePage() {
  const { from, to } = calendarWindow()

  const [upcoming, stats, gallery, calendar, user] = await Promise.all([
    getUpcomingActivities({ limit: 6 }).catch((): ActivityWithCount[] => []),
    getCommunityStats().catch((): CommunityStats => EMPTY_STATS),
    getGallery(10).catch((): GalleryRow[] => []),
    getCalendarActivities(from, to).catch((): Activity[] => []),
    getCurrentUser().catch(() => null),
  ])

  const next = upcoming[0] ? { title: upcoming[0].title, slug: upcoming[0].slug } : null
  const isSignedIn = Boolean(user)

  return (
    <>
      <ScrollProgress />

      <Hero nextActivity={next} />

      <UpcomingSection activities={upcoming} isSignedIn={isSignedIn} />

      <ActivityCalendar
        activities={calendar.map(toCalendarActivity)}
        todayKey={dateKey(new Date())}
      />

      <StorySection isSignedIn={isSignedIn} />

      <CategoriesSection />

      <StatsBand stats={stats} />

      <GallerySection items={gallery} />

      <JoinSection isSignedIn={isSignedIn} />
    </>
  )
}

function UpcomingSection({
  activities,
  isSignedIn,
}: {
  activities: ActivityWithCount[]
  isSignedIn: boolean
}) {
  return (
    <section className="relative -mt-1 bg-shell pb-0 pt-16">
      <div className="container-tibid">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <SectionLabel>This week and beyond</SectionLabel>
            <h2 className="mt-5 font-display text-[clamp(2.1rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] text-deep">
              Upcoming activities
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-tide">
              Pick a session, sign up in a few taps, and turn up. That&rsquo;s the whole process.
            </p>
          </div>
          <Link href="/activities" className="btn btn-outline">
            View all activities →
          </Link>
        </Reveal>

        {activities.length === 0 ? (
          <Reveal className="mt-12">
            <div className="rounded-wave border border-dashed border-brand/25 bg-mist/50 px-8 py-16 text-center">
              <div className="text-5xl">🌊</div>
              <h3 className="mt-5 font-display text-xl font-bold text-deep">
                The next wave is being planned
              </h3>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-tide">
                {isSignedIn
                  ? 'Nothing is on the calendar right this second. Follow us on Instagram — you’ll be first to know when the next session goes live.'
                  : 'Nothing is on the calendar right this second. Follow us on Instagram or create a profile — you’ll be first to know when the next session goes live.'}
              </p>
              <Link href={isSignedIn ? '/#calendar' : '/signup'} className="btn btn-primary mt-7">
                {isSignedIn ? 'See the calendar' : 'Create your profile'}
              </Link>
            </div>
          </Reveal>
        ) : (
          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <RevealItem key={activity.id}>
                <ActivityCard activity={activity} className="h-full" />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>

      <WaveDivider
        className="mt-16"
        height={150}
        to="#F6FBFF"
        tints={['#E8F4FE', '#B9E5FB', '#6CC5F8']}
      />
    </section>
  )
}
