import type { Metadata } from 'next'
import Link from 'next/link'

import { ActivityCard } from '@/components/activities/activity-card'
import { SectionLabel } from '@/components/home/sections'
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal'
import { OceanBackdrop } from '@/components/ui/waves'
import { categoryEnum, type Category } from '@/db/schema'
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/constants'
import { getPastActivities, getUpcomingActivities, type ActivityWithCount } from '@/lib/queries'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Activities',
  description:
    'Running, volleyball, yoga, hiking and horse riding with TIBID Community in Dubai. All levels welcome.',
}

export const dynamic = 'force-dynamic'

function parseCategory(value?: string): Category | undefined {
  return categoryEnum.enumValues.includes(value as Category) ? (value as Category) : undefined
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: raw } = await searchParams
  const category = parseCategory(raw)

  const [upcoming, past] = await Promise.all([
    getUpcomingActivities({ category }).catch((): ActivityWithCount[] => []),
    getPastActivities({ category, limit: 6 }).catch((): ActivityWithCount[] => []),
  ])

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-mist to-shell pb-14 pt-36">
        <OceanBackdrop />
        <div className="container-tibid relative">
          <Reveal>
            <SectionLabel>The calendar</SectionLabel>
            <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4.2rem)] font-extrabold leading-[1.02] text-deep">
              Find your <span className="text-gradient-wave">next session</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-tide">
              Every activity below is open to everyone. Pick one, sign up, show up — that&rsquo;s
              genuinely the whole thing.
            </p>
          </Reveal>

          {/* Category filter */}
          <Reveal delay={0.1} className="mt-10">
            <div className="flex flex-wrap gap-2">
              <FilterPill href="/activities" active={!category}>
                All activities
              </FilterPill>
              {CATEGORY_ORDER.map((c) => (
                <FilterPill
                  key={c}
                  href={`/activities?category=${c}`}
                  active={category === c}
                >
                  <span aria-hidden>{CATEGORIES[c].emoji}</span> {CATEGORIES[c].label}
                </FilterPill>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-8">
        <div className="container-tibid">
          {upcoming.length === 0 ? (
            <div className="rounded-wave border border-dashed border-brand/25 bg-mist/50 px-8 py-16 text-center">
              <div className="text-5xl">🌊</div>
              <h2 className="mt-5 font-display text-xl font-bold text-deep">
                {category
                  ? `No ${CATEGORIES[category].label.toLowerCase()} sessions scheduled yet`
                  : 'Nothing on the calendar right now'}
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-tide">
                New sessions go up every week. Create a profile so you&rsquo;re ready to sign up the
                moment one appears.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {category && (
                  <Link href="/activities" className="btn btn-outline">
                    See all activities
                  </Link>
                )}
                <Link href="/signup" className="btn btn-primary">
                  Create your profile
                </Link>
              </div>
            </div>
          ) : (
            <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((activity) => (
                <RevealItem key={activity.id}>
                  <ActivityCard activity={activity} className="h-full" />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="section pt-16">
          <div className="container-tibid">
            <Reveal>
              <SectionLabel>Been there</SectionLabel>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-deep">
                Recently completed
              </h2>
              <p className="mt-3 max-w-lg leading-relaxed text-tide">
                A look at where the community has already been.
              </p>
            </Reveal>

            <RevealGroup className="mt-10 grid gap-6 opacity-90 md:grid-cols-2 lg:grid-cols-3">
              {past.map((activity) => (
                <RevealItem key={activity.id}>
                  <ActivityCard activity={activity} className="h-full" />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}
    </>
  )
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300',
        active
          ? 'border-brand bg-brand text-white shadow-tide'
          : 'border-foam bg-white/70 text-tide hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand',
      )}
    >
      {children}
    </Link>
  )
}
