import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { getItem, deleteItem } from '@/lib/pluggy'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/pluggy/items — lista itens conectados do usuário
export async function GET(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('pluggy_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ items: data ?? [] })
}

// POST /api/pluggy/items — salva item após sucesso no widget
export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await request.json()
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const item = await getItem(itemId)

  const { data, error } = await supabase
    .from('pluggy_items')
    .upsert({
      user_id: user.id,
      item_id: itemId,
      institution_name: item.connector?.name ?? 'Banco',
      institution_logo: item.connector?.imageUrl ?? null,
      status: item.status,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'item_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// DELETE /api/pluggy/items?itemId=xxx — desconecta banco
export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const itemId = request.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  // Verifica que pertence ao usuário
  const { data: pluggyItem } = await supabase
    .from('pluggy_items')
    .select()
    .eq('item_id', itemId)
    .eq('user_id', user.id)
    .single()

  if (!pluggyItem) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteItem(itemId).catch(() => null) // melhor esforço

  // Remove contas e transações vinculadas
  await supabase.from('accounts').delete().eq('pluggy_item_id', itemId)
  await supabase.from('pluggy_items').delete().eq('item_id', itemId)

  return NextResponse.json({ ok: true })
}
