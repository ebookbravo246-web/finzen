import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase'

async function getAuthenticatedUser(req: NextRequest) {
  const supabase = createSupabaseRouteClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const category = searchParams.get('category')
  const type = searchParams.get('type')

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (month) {
    query = query
      .gte('date', `${month}-01`)
      .lte('date', `${month}-31`)
  }
  if (category) query = query.eq('category', category)
  if (type) query = query.eq('type', type)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...body, user_id: user.id }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
