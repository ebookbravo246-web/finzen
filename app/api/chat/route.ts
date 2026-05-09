import { NextRequest, NextResponse } from 'next/server'
import { askFinancialAI } from '@/lib/claude'

export async function POST(req: NextRequest) {
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
