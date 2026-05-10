import { NextRequest, NextResponse } from 'next/server'
import { askFinancialAI } from '@/lib/claude'
import { createSupabaseRouteClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient(req)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { message, context } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 })
    }

    const reply = await askFinancialAI(message, context ?? {
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      topCategories: [],
      goals: [],
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}
