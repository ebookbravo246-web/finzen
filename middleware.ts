import { NextRequest, NextResponse } from 'next/server'

// Middleware temporariamente desativado para diagnostico
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
