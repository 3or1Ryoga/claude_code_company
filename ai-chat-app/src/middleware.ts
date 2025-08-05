import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/api/auth/login', '/api/auth/register']
const protectedApiPaths = ['/api/chat', '/api/messages', '/api/users']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    if (protectedApiPaths.some(path => pathname.startsWith(path))) {
      const authHeader = request.headers.get('authorization')
      const cookieToken = request.cookies.get('auth-token')?.value
      
      let token: string | null = null
      
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else if (cookieToken) {
        token = cookieToken
      }

      if (!token) {
        return NextResponse.json(
          { success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
          { status: 401 }
        )
      }

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', payload.userId)
      requestHeaders.set('x-user-email', payload.email)

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      })
    }
  }

  const response = NextResponse.next()
  
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}