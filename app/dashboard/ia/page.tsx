'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { supabase, type Transaction, type Goal } from '@/lib/supabase'
import { formatCurrency, categoryColor } from '@/lib/utils'

type Message = { from: 'user' | 'ai'; text: string; time: string }

const SUGGESTIONS = [
  'Quanto gastei esse mês?',
  'Onde posso economizar?',
  'Como estão minhas metas?',
  'Qual minha maior despesa?',
  'Estou dentro do orçamento?',
  'Quanto guardei este mês?',
]

function nowTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function IAPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'ai',
      text: 'Olá! Sou o FinZen AI 🤖 Seu assistente financeiro pessoal. Pode me perguntar qualquer coisa sobre suas finanças — gastos, metas, orçamentos ou investimentos.',
      time: nowTime(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }),
      supabase.from('goals').select('*'),
    ]).then(([{ data: txData }, { data: goalsData }]) => {
      setTransactions(txData ?? [])
      setGoals(goalsData ?? [])
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const monthTx = useMemo(() => transactions.filter(t => t.date.startsWith(currentMonth)), [transactions, currentMonth])
  const totalBalance   = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions])
  const monthlyIncome  = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx])
  const monthlyExpenses = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0), [monthTx])

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {}
    monthTx.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, value]) => ({ name, value }))
  }, [monthTx])

  const context = useMemo(() => ({
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    topCategories,
    goals: goals.map(g => ({ name: g.name, current: g.current, target: g.target })),
  }), [totalBalance, monthlyIncome, monthlyExpenses, topCategories, goals])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { from: 'user', text, time: nowTime() }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { from: 'ai', text: data.reply ?? 'Desculpe, não consegui processar.', time: nowTime() }])
    } catch {
      setMessages(prev => [...prev, { from: 'ai', text: 'Erro de conexão. Tente novamente.', time: nowTime() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>FinZen IA</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>Seu assistente financeiro pessoal com inteligência artificial</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.2rem', flex: 1, minHeight: 0 }}>
        {/* CHAT */}
        <div style={{
          background: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.9rem', margin: 0 }}>FinZen AI</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)' }}>Online agora</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '0.75rem 1rem',
                  borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.from === 'user' ? 'var(--green)' : 'var(--surface)',
                  color: msg.from === 'user' ? '#fff' : 'var(--ink)',
                  fontSize: '0.88rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', margin: '3px 4px 0' }}>{msg.time}</span>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', background: 'var(--surface)', fontSize: '1.2rem', letterSpacing: '3px' }}>
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="Pergunte sobre suas finanças..."
              disabled={loading}
              style={{
                flex: 1, border: '1px solid var(--border)', borderRadius: '100px',
                padding: '0.6rem 1rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              {loading ? '…' : 'Enviar →'}
            </Button>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.2rem', border: '1px solid var(--border)' }}>
            <p className="font-display" style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.8rem' }}>Sugestões</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} disabled={loading} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.55rem 0.8rem', fontSize: '0.82rem',
                  cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  color: 'var(--ink)', transition: 'all .15s',
                }}>
                  💬 {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.2rem', border: '1px solid var(--border)' }}>
            <p className="font-display" style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.8rem' }}>Contexto da IA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Saldo total', value: formatCurrency(totalBalance), color: totalBalance < 0 ? 'var(--danger)' : 'var(--green-light)' },
                { label: 'Receita', value: formatCurrency(monthlyIncome), color: 'var(--green-light)' },
                { label: 'Gastos', value: formatCurrency(monthlyExpenses), color: 'var(--danger)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}
              {topCategories.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.3rem', paddingTop: '0.6rem' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Top categorias</p>
                    {topCategories.map(c => (
                      <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: categoryColor(c.name), display: 'inline-block' }} />
                          {c.name}
                        </span>
                        <span style={{ fontWeight: 500 }}>{formatCurrency(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
