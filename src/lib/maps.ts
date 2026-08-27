/**
 * Turns whatever Google Maps link an admin pastes into (a) an embeddable map
 * and (b) links that open the exact same spot in Google Maps.
 *
 * The guiding rule: the embedded map and the buttons underneath it must always
 * point at the same coordinates. Previously the embed used coordinates parsed
 * out of the link while the button re-opened the raw pasted URL, so for a big
 * venue the map showed the pin near the meeting point while the button opened
 * the venue's place page — visibly "not the pin".
 */

/**
 * Coordinate patterns, most trustworthy first. Order matters more than it looks.
 *
 * A place URL carries two different pairs:
 *   /maps/place/Name/@25.1000,55.2000,17z/data=…!8m2!3d25.1031!4d55.2479
 *                    ^^^^^^^^^^^^^^^^^^^ viewport centre
 *                                              ^^^^^^^^^^^^^^^^^^^^^^^^ the pin
 * `@` is wherever the map happened to be framed and can sit a street away from
 * the marker. `!8m2!3d…!4d…` is the place itself, so it wins.
 */
const COORD_PATTERNS: RegExp[] = [
  /!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // the place marker itself
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // marker, older link shapes
  /[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
  /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?ll=lat,lng
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // viewport centre — last resort
]

export type Coords = { lat: number; lng: number }

export function extractCoords(link: string | null | undefined): Coords | null {
  if (!link) return null

  for (const re of COORD_PATTERNS) {
    const m = link.match(re)
    if (!m) continue

    const lat = Number.parseFloat(m[1])
    const lng = Number.parseFloat(m[2])

    // 0,0 is in the Atlantic — it only ever shows up when a pattern matched
    // something that wasn't a coordinate at all.
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat === 0 && lng === 0) continue
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }
  }

  return null
}

/** Pulls the place name out of a /maps/place/Some+Place/ style URL. */
export function extractPlaceName(link: string | null | undefined): string | null {
  if (!link) return null
  const m = link.match(/\/maps\/place\/([^/@?]+)/)
  if (!m) return null

  const raw = m[1].replace(/\+/g, ' ')
  let name: string
  try {
    name = decodeURIComponent(raw)
  } catch {
    name = raw
  }

  // A dropped pin with no business attached encodes its own coordinates as the
  // "name" (25°06'10.8"N 55°14'52.1"E). That is not a searchable place.
  if (/^\d+°/.test(name) || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) return null
  return name.trim() || null
}

/**
 * Short links (maps.app.goo.gl / goo.gl/maps) hide their coordinates behind a
 * redirect we cannot follow at render time, so they have to be passed through
 * untouched — which is fine, because they resolve to the exact place.
 */
function isShortLink(link: string): boolean {
  try {
    return /(^|\.)(maps\.app\.goo\.gl|goo\.gl)$/i.test(new URL(link).hostname)
  } catch {
    return false
  }
}

function coordString({ lat, lng }: Coords): string {
  return `${lat},${lng}`
}

/* -------------------------------------------------------------------------- */
/*  Embedded map                                                               */
/* -------------------------------------------------------------------------- */

export function buildEmbedUrl(
  mapLink: string | null | undefined,
  fallbackQuery: string,
): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY
  const coords = extractCoords(mapLink)
  const place = extractPlaceName(mapLink)
  const query = coords ? coordString(coords) : (place ?? fallbackQuery)

  if (!query) return null

  if (key) {
    const params = new URLSearchParams({ key, q: query })
    if (coords) params.set('zoom', '16')
    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`
  }

  const params = new URLSearchParams({ q: query, output: 'embed', z: '16' })
  return `https://maps.google.com/maps?${params.toString()}`
}

/* -------------------------------------------------------------------------- */
/*  Links out to Google Maps                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Opens the pin. Uses Google's documented Maps URLs scheme, which hands off to
 * the native app on iOS and Android instead of opening a browser tab.
 *
 * Coordinates beat the pasted URL deliberately: a link to "Dubai Hills Mall"
 * opens the mall, whereas the coordinates open the spot the organiser actually
 * pinned — the thing someone standing outside at 7am needs.
 */
export function buildPinUrl(mapLink: string | null | undefined, fallbackQuery: string): string {
  const coords = extractCoords(mapLink)
  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordString(coords))}`
  }

  // No coordinates to be had — a short link still resolves correctly on its own.
  if (mapLink && isShortLink(mapLink)) return mapLink

  const place = extractPlaceName(mapLink)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place ?? fallbackQuery)}`
}

/** Opens turn-by-turn directions to the meeting point from wherever they are. */
export function buildDirectionsUrl(
  mapLink: string | null | undefined,
  fallbackQuery: string,
): string {
  const coords = extractCoords(mapLink)
  const destination = coords ? coordString(coords) : (extractPlaceName(mapLink) ?? fallbackQuery)

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
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
