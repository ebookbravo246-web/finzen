import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// GET — retorna o número vinculado ao usuário
export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await getAdmin()
    .from('whatsapp_numbers')
    .select('phone')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ phone: data?.phone ?? null })
}

// POST — vincula/atualiza número
export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phone } = await request.json()
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })

  // Normaliza: remove tudo que não seja dígito
  const normalized = phone.replace(/\D/g, '')
  if (normalized.length < 10 || normalized.length > 13) {
    return NextResponse.json({ error: 'Número de telefone inválido' }, { status: 400 })
  }

  const { error } = await getAdmin()
    .from('whatsapp_numbers')
    .upsert({ user_id: user.id, phone: normalized }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, phone: normalized })
}

// DELETE — desvincula número
export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await getAdmin().from('whatsapp_numbers').delete().eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
