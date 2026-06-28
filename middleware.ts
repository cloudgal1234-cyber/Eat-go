import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from './lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/customer']
const API_PUBLIC_PATHS = ['/api/auth', '/api/customer']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isPublicAPI = API_PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.')

  if (isStaticAsset || isPublicPage || isPublicAPI) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname === '/') {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname.startsWith('/dashboard')) {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
