/**
 * Turns whatever Google Maps link an admin pastes into an embeddable map URL.
 *
 * Works without an API key by using the classic `maps.google.com/maps?...&output=embed`
 * endpoint. If NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY is set, the official Embed API
 * is used instead, which renders a nicer map with a proper pin.
 */

const COORD_PATTERNS: RegExp[] = [
  /@(-?\d+\.\d+),(-?\d+\.\d+)/, // .../@25.1234,55.1234,17z
  /[?&]q=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ...?q=25.1234,55.1234
  /[?&]ll=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // ...?ll=25.1234,55.1234
  /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // ...!3d25.1234!4d55.1234
  /\/(-?\d+\.\d+),(-?\d+\.\d+)/, // .../25.1234,55.1234
]

export function extractCoords(link: string | null | undefined): { lat: number; lng: number } | null {
  if (!link) return null
  for (const re of COORD_PATTERNS) {
    const m = link.match(re)
    if (m) {
      const lat = Number.parseFloat(m[1])
      const lng = Number.parseFloat(m[2])
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
    }
  }
  return null
}

/** Pulls the place name out of a /maps/place/Some+Place/ style URL. */
function extractPlaceName(link: string | null | undefined): string | null {
  if (!link) return null
  const m = link.match(/\/maps\/place\/([^/@?]+)/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1].replace(/\+/g, ' '))
  } catch {
    return m[1].replace(/\+/g, ' ')
  }
}

export function buildEmbedUrl(
  mapLink: string | null | undefined,
  fallbackQuery: string,
): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
  const coords = extractCoords(mapLink)
  const place = extractPlaceName(mapLink)
  const query = coords ? `${coords.lat},${coords.lng}` : (place ?? fallbackQuery)

  if (!query) return null

  if (key) {
    const mode = coords ? 'view' : 'place'
    const params = new URLSearchParams({ key })
    if (coords) {
      params.set('center', query)
      params.set('zoom', '16')
    } else {
      params.set('q', query)
    }
    return `https://www.google.com/maps/embed/v1/${mode}?${params.toString()}`
  }

  const params = new URLSearchParams({ q: query, output: 'embed', z: '16' })
  if (coords) params.set('t', 'm')
  return `https://maps.google.com/maps?${params.toString()}`
}

/** The link the "Open in Google Maps" button uses. */
export function buildDirectionsUrl(
  mapLink: string | null | undefined,
  fallbackQuery: string,
): string {
  if (mapLink && /^https?:\/\//i.test(mapLink)) return mapLink
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
}

export function isValidMapLink(link: string): boolean {
  if (!link.trim()) return true // optional field
  try {
    const u = new URL(link)
    return /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl)$/i.test(u.hostname)
  } catch {
    return false
  }
}
