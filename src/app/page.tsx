import Link from 'next/link'

import { ActivityCard } from '@/components/activities/activity-card'
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
import { WaveDivider } from '@/components/ui/waves'
import {
  getCommunityStats,
  getGallery,
  getUpcomingActivities,
  type ActivityWithCount,
  type CommunityStats,
} from '@/lib/queries'

export const dynamic = 'force-dynamic'

type GalleryRow = { id: string; imageUrl: string; caption: string | null }

const EMPTY_STATS: CommunityStats = { members: 0, activities: 0, signups: 0, categories: 5 }

export default async function HomePage() {
  const [upcoming, stats, gallery] = await Promise.all([
    getUpcomingActivities({ limit: 6 }).catch((): ActivityWithCount[] => []),
    getCommunityStats().catch((): CommunityStats => EMPTY_STATS),
    getGallery(10).catch((): GalleryRow[] => []),
  ])

  const next = upcoming[0] ? { title: upcoming[0].title, slug: upcoming[0].slug } : null

  return (
    <>
      <Hero nextActivity={next} />

      <UpcomingSection activities={upcoming} />

      <StorySection />

      <CategoriesSection />

      <StatsBand stats={stats} />

      <GallerySection items={gallery} />

      <JoinSection />
    </>
  )
}

function UpcomingSection({ activities }: { activities: ActivityWithCount[] }) {
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
                Nothing is on the calendar right this second. Follow us on Instagram or create a
                profile — you&rsquo;ll be first to know when the next session goes live.
              </p>
              <Link href="/signup" className="btn btn-primary mt-7">
                Create your profile
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

      <WaveDivider className="mt-16" height={90} to="#F6FBFF" tints={['#E8F4FE', '#B9E5FB']} />
    </section>
  )
}
