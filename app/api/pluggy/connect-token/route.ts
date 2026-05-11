import { createConnectToken } from '@/lib/pluggy'
import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  try {
    const connectToken = await createConnectToken(body.itemId)
    return NextResponse.json({ connectToken })
  } catch {
    return NextResponse.json({ error: 'Failed to create connect token' }, { status: 500 })
  }
}
