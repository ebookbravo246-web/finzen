import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function askFinancialAI(
  userMessage: string,
  context: {
    totalBalance: number
    monthlyIncome: number
    monthlyExpenses: number
    topCategories: { name: string; value: number }[]
    goals: { name: string; current: number; target: number }[]
  }
): Promise<string> {
  const systemPrompt = `Você é o FinZen AI, assistente financeiro pessoal inteligente e amigável.
Você tem acesso aos dados financeiros do usuário e responde em português brasileiro de forma clara e direta.
Seja conciso (máximo 3 parágrafos), use emojis com moderação e sempre baseie suas respostas nos dados reais do usuário.

DADOS FINANCEIROS DO USUÁRIO:
- Saldo total: R$ ${context.totalBalance.toLocaleString('pt-BR')}
- Receita do mês: R$ ${context.monthlyIncome.toLocaleString('pt-BR')}
- Gastos do mês: R$ ${context.monthlyExpenses.toLocaleString('pt-BR')}
- Maiores categorias de gasto: ${context.topCategories.map(c => `${c.name} (R$ ${c.value})`).join(', ')}
- Metas: ${context.goals.map(g => `${g.name} (${Math.round((g.current / g.target) * 100)}%)`).join(', ')}

Responda a pergunta do usuário com base nesses dados reais.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  return message.content[0].type === 'text' ? message.content[0].text : 'Desculpe, não consegui processar sua pergunta.'
}
