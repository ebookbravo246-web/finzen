import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type Message = { role: 'user' | 'assistant'; content: string }

async function getFinancialContext(userId: string) {
  const now = new Date()
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [{ data: txs }, { data: goals }, { data: budgets }] = await Promise.all([
    getAdmin().from('transactions').select('amount,type,category').eq('user_id', userId).gte('date', `${monthStr}-01`),
    getAdmin().from('goals').select('name,current,target').eq('user_id', userId),
    getAdmin().from('budgets').select('category,limit_amount,spent').eq('user_id', userId).eq('month', monthStr),
  ])

  const income   = (txs ?? []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = (txs ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const byCategory: Record<string, number> = {}
  for (const t of txs ?? []) {
    if (t.type === 'expense') byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }))

  return { income, expenses, balance: income - expenses, topCategories, goals: goals ?? [], budgets: budgets ?? [] }
}

async function loadHistory(userId: string): Promise<Message[]> {
  const { data } = await getAdmin()
    .from('whatsapp_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  return (data ?? []).reverse() as Message[]
}

async function saveMessages(userId: string, userMsg: string, assistantMsg: string) {
  await getAdmin().from('whatsapp_messages').insert([
    { user_id: userId, role: 'user',      content: userMsg },
    { user_id: userId, role: 'assistant', content: assistantMsg },
  ])
}

export async function processWhatsAppMessage(userId: string, message: string): Promise<string> {
  const [ctx, history] = await Promise.all([
    getFinancialContext(userId),
    loadHistory(userId),
  ])

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const systemPrompt = `Você é o FinZen AI, assistente financeiro pessoal via WhatsApp.
Responda em português brasileiro de forma *curta e direta* — máximo 5 linhas.
Use formatação WhatsApp: *negrito*, _itálico_. Sem markdown com # ou -.
Seja amigável e prático. Baseie-se sempre nos dados reais abaixo.

📊 *DADOS DO MÊS ATUAL*
• Receita: ${fmt(ctx.income)}
• Gastos: ${fmt(ctx.expenses)}
• Saldo: ${fmt(ctx.balance)}
• Maiores gastos: ${ctx.topCategories.map(c => `${c.name} ${fmt(c.value)}`).join(', ') || 'nenhum'}

🎯 *METAS*
${ctx.goals.length ? ctx.goals.map(g => `• ${g.name}: ${Math.round((g.current / g.target) * 100)}% (${fmt(g.current)} / ${fmt(g.target)})`).join('\n') : '• Nenhuma meta cadastrada'}

📋 *ORÇAMENTOS*
${ctx.budgets.length ? ctx.budgets.map(b => `• ${b.category}: ${fmt(b.spent)} / ${fmt(b.limit_amount)}`).join('\n') : '• Nenhum orçamento cadastrado'}

Se o usuário perguntar algo que não tem a ver com finanças, redirecione gentilmente para tópicos financeiros.`

  const messages: Message[] = [
    ...history.slice(-10),
    { role: 'user', content: message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].type === 'text'
    ? response.content[0].text
    : 'Desculpe, não consegui processar sua pergunta. Tente novamente.'

  await saveMessages(userId, message, reply)
  return reply
}
