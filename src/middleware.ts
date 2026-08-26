import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, verifySession } from '@/lib/session'

/**
 * Edge guard for /admin and /profile. This is defence in depth — every admin
 * page and server action also calls requireAdmin() on the server. Doing it here
 * as well means an unauthenticated visitor gets a clean redirect instead of a
 * flash of the layout.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(pathname)}`
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && session.role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = '?error=admin-only'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/profile'],
}
