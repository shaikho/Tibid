import { SheetsPanel } from '@/components/admin/sheets-panel'
import { SITE } from '@/lib/constants'
import { sheetsConfigured, testSheetsConnection } from '@/lib/google-sheets'
import { getAdminOverview } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const configured = sheetsConfigured()
  const [status, overview] = await Promise.all([
    configured
      ? testSheetsConnection().catch((e) => ({ ok: false, message: String(e) }))
      : Promise.resolve(null),
    getAdminOverview().catch(() => null),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <SheetsPanel
        configured={configured}
        status={status}
        pending={overview?.pendingSheetSync ?? 0}
      />

      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-deep">Environment</h2>
        <dl className="mt-4 divide-y divide-foam/70 text-sm">
          <EnvRow label="Site URL" value={SITE.url} />
          <EnvRow label="Timezone" value={`${SITE.timezone} (all times shown in Dubai time)`} />
          <EnvRow label="Instagram" value={SITE.instagram} />
          <EnvRow label="TikTok" value={SITE.tiktok || 'Not set — add NEXT_PUBLIC_TIKTOK_URL'} />
          <EnvRow
            label="Database"
            value={process.env.DATABASE_URL ? 'Connected' : 'DATABASE_URL not set'}
            ok={Boolean(process.env.DATABASE_URL)}
          />
          <EnvRow
            label="Maps Embed API key"
            value={
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
                ? 'Set — using the official Embed API'
                : 'Not set — using the free keyless embed (works fine)'
            }
          />
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg font-bold text-deep">How the sync works</h2>
        <ol className="mt-4 space-y-3 text-sm leading-relaxed text-tide">
          <Step n={1}>
            Someone registers → the row is written to Postgres <em>and</em> appended to your Google
            Sheet in the same request.
          </Step>
          <Step n={2}>
            If Google is slow or misconfigured, the registration still succeeds — the row is flagged{' '}
            <em>not synced</em> and the error is stored.
          </Step>
          <Step n={3}>
            Hit <strong>Sync pending rows</strong> above to push everything that hasn&rsquo;t made it
            across yet. It is safe to run repeatedly.
          </Step>
        </ol>
      </section>
    </div>
  )
}

function EnvRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-3">
      <dt className="font-semibold text-deep">{label}</dt>
      <dd className={`text-right text-xs ${ok === false ? 'text-coral' : 'text-tide'}`}>{value}</dd>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-mist text-xs font-bold text-brand">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}
