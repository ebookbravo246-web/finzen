'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, type Transaction, type Goal } from '@/lib/supabase'
import { formatCurrency, categoryColor } from '@/lib/utils'

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CHAT_EMPTY = 'Você ainda não tem transações. Adicione seus lançamentos para que eu possa analisar suas finanças! 💡'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function DashboardPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: txData }, { data: goalsData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
      ])

      if (user) {
        const name: string = user.user_metadata?.full_name || user.email || ''
        setUserName(name.split(' ')[0])
      }

      const txs = txData ?? []
      setTransactions(txs)
      setGoals(goalsData ?? [])
      setLoading(false)

      const income = txs.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((s, t) => s + Math.abs(t.amount), 0)
      const intro = txs.length === 0
        ? CHAT_EMPTY
        : `Receita do mês: ${formatCurrency(income)} · Gastos: ${formatCurrency(expenses)} · Economia: ${formatCurrency(income - expenses)}. Como posso ajudar? 🤖`
      setMessages([{ from: 'ai', text: intro }])
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const monthTx = useMemo(() =>
    transactions.filter(tx => tx.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  )

  const totalBalance = useMemo(() =>
    transactions.reduce((s, t) => s + t.amount, 0),
    [transactions]
  )

  const monthIncome = useMemo(() =>
    monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTx]
  )

  const monthExpenses = useMemo(() =>
    monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
    [monthTx]
  )

  const categories = useMemo(() => {
    const map: Record<string, number> = {}
    monthTx.filter(t => t.type === 'expense').forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount)
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const max = sorted[0]?.[1] || 1
    return sorted.map(([name, value]) => ({
      name, value,
      pct: Math.round((value / max) * 100),
      color: categoryColor(name),
    }))
  }, [monthTx])

  const flowData = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const mTx = transactions.filter(tx => tx.date.startsWith(key))
      result.push({
        mes: MONTH_NAMES[d.getMonth()],
        receita: mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        gastos: mTx.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
      })
    }
    return result
  }, [transactions]) // eslint-disable-line react-hooks/exhaustive-deps

  const recentTx = transactions.slice(0, 5)

  const metrics = [
    { label: 'Saldo Total',    value: formatCurrency(totalBalance),              color: totalBalance < 0 ? 'var(--danger)' : 'var(--ink)' },
    { label: 'Receita do Mês', value: formatCurrency(monthIncome),               color: 'var(--green-light)' },
    { label: 'Gastos do Mês',  value: formatCurrency(monthExpenses),             color: 'var(--danger)' },
    { label: 'Economia',       value: formatCurrency(monthIncome - monthExpenses), color: monthIncome - monthExpenses < 0 ? 'var(--danger)' : 'var(--green-light)' },
  ]

  const [aiLoading, setAiLoading] = useState(false)

  const sendMsg = async () => {
    if (!chatInput.trim() || aiLoading) return
    const text = chatInput
    setChatInput('')
    setMessages(prev => [...prev, { from: 'user', text }])
    setAiLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            totalBalance,
            monthlyIncome: monthIncome,
            monthlyExpenses: monthExpenses,
            topCategories: categories.slice(0, 3).map(c => ({ name: c.name, value: c.value })),
            goals: goals.map(g => ({ name: g.name, current: g.current, target: g.target })),
          },
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { from: 'ai', text: data.reply ?? 'Erro ao processar.' }])
    } catch {
      setMessages(prev => [...prev, { from: 'ai', text: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            {loading ? 'Carregando...' : `${greeting()}, ${userName || 'você'} 👋`}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>
            Resumo das suas finanças em {monthLabel}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => router.push('/dashboard/transacoes')}
            style={{
              padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem',
              background: 'var(--green)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>+ Lançamento</button>
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {metrics.map((m) => (
          <div key={m.label} style={{
            background: 'var(--white)', borderRadius: '16px', padding: '1.3rem 1.5rem', border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>{m.label}</p>
            <p className="font-display" style={{
              fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-1px', marginBottom: '0.3rem', color: m.color,
            }}>
              {loading ? '—' : m.value}
            </p>
          </div>
        ))}
      </div>

      {/* CHART + CATEGORIES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
            <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Fluxo de Caixa — Últimos 6 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={flowData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Bar dataKey="receita" name="Receita" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos"  name="Gastos"  fill="#E24B4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)' }}>
          <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600, display: 'block', marginBottom: '1.2rem' }}>
            Gastos por Categoria
          </span>
          {!loading && categories.length === 0 ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', textAlign: 'center', paddingTop: '2rem' }}>
              Sem gastos registrados este mês
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categories.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.87rem' }}>{c.name}</span>
                  <div style={{ flex: 2, height: 6, background: 'var(--surface)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: '100px' }} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, minWidth: 70, textAlign: 'right' }}>
                    {formatCurrency(c.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TRANSACTIONS + CHAT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Últimas transações */}
          <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Últimas Transações</span>
              <button onClick={() => router.push('/dashboard/transacoes')} style={{
                background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Ver todas →</button>
            </div>
            {!loading && recentTx.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', textAlign: 'center', padding: '1.5rem 0' }}>
                Nenhuma transação ainda
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentTx.map((tx, i) => (
                  <div key={tx.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    padding: '0.6rem 0', borderBottom: i < recentTx.length - 1 ? '1px solid var(--surface)' : 'none',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '12px',
                      background: `${categoryColor(tx.category)}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                    }}>
                      {tx.type === 'income' ? '💰' : '💸'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.88rem', fontWeight: 500, margin: 0 }}>{tx.name}</p>
                      <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', margin: 0 }}>
                        {tx.category} · {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 500, color: tx.amount > 0 ? 'var(--green-light)' : 'var(--danger)' }}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metas */}
          <div style={{ background: 'var(--white)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600 }}>Metas</span>
              <button onClick={() => router.push('/dashboard/metas')} style={{
                background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>+ Nova meta</button>
            </div>
            {!loading && goals.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', textAlign: 'center', padding: '1.5rem 0' }}>
                Nenhuma meta cadastrada
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {goals.slice(0, 4).map((g) => {
                  const pct = Math.min(Math.round((g.current / g.target) * 100), 100)
                  return (
                    <div key={g.id} style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0 2px' }}>{g.icon} {g.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: '0 0 0.8rem' }}>
                        {formatCurrency(g.current)} / {formatCurrency(g.target)}
                      </p>
                      <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: '100px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green-light)', borderRadius: '100px' }} />
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 500, margin: 0 }}>{pct}%</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* CHAT IA */}
        <div style={{ background: 'var(--white)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 8, height: 8, background: '#25D366', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>FinZen IA</span>
          </div>
          <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', maxHeight: 380 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                fontSize: '0.82rem', lineHeight: 1.5, padding: '0.55rem 0.8rem',
                borderRadius: '10px', maxWidth: '85%',
                background: msg.from === 'ai' ? 'var(--surface)' : 'var(--green)',
                color: msg.from === 'ai' ? 'var(--ink)' : '#fff',
                alignSelf: msg.from === 'ai' ? 'flex-start' : 'flex-end',
              }}>{msg.text}</div>
            ))}
          </div>
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Pergunte sobre suas finanças..."
              disabled={aiLoading}
              style={{
                flex: 1, border: '1px solid var(--border)', borderRadius: '100px',
                padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
              }}
            />
            <button onClick={sendMsg} disabled={aiLoading} style={{
              background: 'var(--green)', color: '#fff', border: 'none',
              borderRadius: '50%', width: 32, height: 32, cursor: aiLoading ? 'wait' : 'pointer', fontSize: '1rem',
            }}>{aiLoading ? '…' : '→'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
