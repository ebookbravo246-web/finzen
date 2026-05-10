import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  // getUser() valida o JWT com o servidor Supabase — mais confiável que getSession()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('[FinZen] middleware getUser error:', error.message)
  }

  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard') && !user) {
    console.log('[FinZen] middleware: sem sessão, redirecionando para /login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && user) {
    console.log('[FinZen] middleware: sessão ativa, redirecionando para /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/login'],
}
