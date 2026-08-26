import { buildDirectionsUrl, buildEmbedUrl } from '@/lib/maps'

export function MapPanel({
  mapLink,
  location,
  meetingPoint,
}: {
  mapLink: string | null
  location: string
  meetingPoint: string | null
}) {
  const query = [meetingPoint, location, 'Dubai'].filter(Boolean).join(', ')
  const embed = buildEmbedUrl(mapLink, query)
  const directions = buildDirectionsUrl(mapLink, query)

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 p-5 pb-4">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-brand">
          <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M8 14.5s5-4.2 5-8a5 5 0 1 0-10 0c0 3.8 5 8 5 8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="6.4" r="1.8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-deep">Meeting point</h3>
          <p className="mt-1 text-sm leading-relaxed text-tide">{location}</p>
          {meetingPoint && (
            <p className="mt-0.5 text-sm font-semibold leading-relaxed text-brand-deeper">
              {meetingPoint}
            </p>
          )}
        </div>
      </div>

      {embed ? (
        <div className="relative aspect-[16/10] w-full bg-mist">
          <iframe
            src={embed}
            title={`Map showing ${query}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      ) : (
        <div className="grid aspect-[16/10] place-items-center bg-mist text-sm text-tide">
          No map pin added yet
        </div>
      )}

      <div className="p-4">
        <a
          href={directions}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-ghost w-full"
        >
          Open in Google Maps
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M5 2h7v7M12 2 2 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
