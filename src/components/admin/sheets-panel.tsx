'use client'

import { useState, useTransition } from 'react'

import { Alert, Spinner } from '@/components/ui/form'
import { resyncSheetsAction } from '@/lib/actions/activities'

export function SheetsPanel({
  configured,
  status,
  pending: pendingCount,
}: {
  configured: boolean
  status: { ok: boolean; message: string } | null
  pending: number
}) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Google Sheets sync</h2>
          <p className="mt-1 text-sm text-tide">
            Every registration is appended to your sheet as it happens.
          </p>
        </div>
        <span
          className={`chip ${
            !configured
              ? 'bg-mist text-tide'
              : status?.ok
                ? 'bg-kelp/12 text-kelp'
                : 'bg-coral/10 text-coral'
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              !configured ? 'bg-tide/40' : status?.ok ? 'bg-kelp' : 'bg-coral'
            }`}
          />
          {!configured ? 'Not configured' : status?.ok ? 'Connected' : 'Error'}
        </span>
      </div>

      {status && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-xs leading-relaxed ${
            status.ok ? 'bg-kelp/8 text-kelp' : 'bg-coral/8 text-coral'
          }`}
        >
          {status.message}
        </p>
      )}

      {!configured && (
        <div className="mt-4 space-y-3 rounded-2xl bg-mist/60 p-5 text-sm leading-relaxed text-tide">
          <p className="font-semibold text-deep">Five-minute setup</p>
          <ol className="ml-4 list-decimal space-y-2">
            <li>
              In{' '}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-brand hover:underline"
              >
                Google Cloud Console
              </a>
              , create a project and enable the <strong>Google Sheets API</strong>.
            </li>
            <li>
              Create a <strong>service account</strong>, then create a <strong>JSON key</strong> for
              it and download the file.
            </li>
            <li>
              Open your registrations spreadsheet, click <strong>Share</strong>, and give the
              service account&rsquo;s email <strong>Editor</strong> access.
            </li>
            <li>
              Add these to Vercel → Settings → Environment Variables:
              <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-3 text-[11px] text-deep">
                {`GOOGLE_SERVICE_ACCOUNT_EMAIL=…@….iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n…\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SHEET_ID=<the long id in the sheet URL>
GOOGLE_SHEET_TAB=Registrations`}
              </pre>
            </li>
            <li>Redeploy. The header row is written automatically on the first sign-up.</li>
          </ol>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-foam pt-5">
        <button
          type="button"
          disabled={!configured || isPending}
          onClick={() =>
            startTransition(async () => {
              setResult(await resyncSheetsAction())
            })
          }
          className="btn btn-primary !py-2 !text-sm"
        >
          {isPending && <Spinner />}
          Sync pending rows
        </button>

        <span className="text-sm text-tide">
          {pendingCount === 0
            ? 'Nothing waiting.'
            : `${pendingCount} registration${pendingCount === 1 ? '' : 's'} not yet in the sheet.`}
        </span>
      </div>

      {result && (
        <div className="mt-4">
          <Alert tone={result.ok ? 'success' : 'error'}>{result.message}</Alert>
        </div>
      )}
    </section>
  )
}
