'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, categoryColor, categoryIcon } from '@/lib/utils'
import { supabase, type Budget } from '@/lib/supabase'

const CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros']

const WARN_COLOR = '#BA7517'

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
}
const labelStyle = { fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }

export default function OrcamentosPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ category: 'Alimentação', limit: '' })
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    async function load() {
      const [y, mo] = currentMonth.split('-')
      const lastDay = new Date(Number(y), Number(mo), 0).getDate()

      const [{ data: budgetsData }, { data: txData }] = await Promise.all([
        supabase
          .from('budgets')
          .select('*')
          .eq('month', currentMonth)
          .order('created_at'),
        supabase
          .from('transactions')
          .select('category, amount, type')
          .gte('date', `${currentMonth}-01`)
          .lte('date', `${currentMonth}-${String(lastDay).padStart(2, '0')}`)
          .eq('type', 'expense'),
      ])

      // Compute spent per category from real transactions
      const spent: Record<string, number> = {}
      txData?.forEach(tx => {
        spent[tx.category] = (spent[tx.category] || 0) + Math.abs(tx.amount)
      })

      setBudgets(budgetsData ?? [])
      setSpentByCategory(spent)
      setLoading(false)
    }
    load()
  }, [currentMonth])

  const enriched = useMemo(() =>
    budgets.map(b => ({ ...b, spent: spentByCategory[b.category] || 0 })),
    [budgets, spentByCategory]
  )

  const totalLimit = enriched.reduce((s, b) => s + b.limit_amount, 0)
  const totalSpent = enriched.reduce((s, b) => s + b.spent, 0)
  const totalPct   = totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0

  // Also show categories with spending but no budget set
  const unbudgeted = useMemo(() => {
    const budgetedCats = new Set(budgets.map(b => b.category))
    return Object.entries(spentByCategory)
      .filter(([cat]) => !budgetedCats.has(cat) && cat !== 'Receita')
      .sort((a, b) => b[1] - a[1])
  }, [budgets, spentByCategory])

  const openAdd = () => {
    setEditingId(null)
    setForm({ category: 'Alimentação', limit: '' })
    setShowModal(true)
  }

  const openEdit = (b: Budget) => {
    setEditingId(b.id)
    setForm({ category: b.category, limit: String(b.limit_amount) })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveError('Sessão expirada. Faça login novamente.'); setSaving(false); return }

    if (editingId) {
      const { data, error } = await supabase
        .from('budgets')
        .update({ limit_amount: Number(form.limit) })
        .eq('id', editingId)
        .select()
        .single()
      if (error) { setSaveError(error.message); setSaving(false); return }
      if (data) setBudgets(prev => prev.map(b => b.id === editingId ? data : b))
    } else {
      const existing = budgets.find(b => b.category === form.category)
      if (existing) {
        const { data, error } = await supabase
          .from('budgets')
          .update({ limit_amount: Number(form.limit) })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) { setSaveError(error.message); setSaving(false); return }
        if (data) setBudgets(prev => prev.map(b => b.id === existing.id ? data : b))
      } else {
        const { data, error } = await supabase
          .from('budgets')
          .insert({ category: form.category, limit_amount: Number(form.limit), month: currentMonth, spent: 0, user_id: user.id })
          .select()
          .single()
        if (error) { setSaveError(error.message); setSaving(false); return }
        if (data) setBudgets(prev => [...prev, data])
      }
    }

    setSaving(false)
    setShowModal(false)
    setForm({ category: 'Alimentação', limit: '' })
    setEditingId(null)
    setSaveError('')
  }

  const confirmDelete = (id: string) => setDeleteId(id)

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('budgets').delete().eq('id', deleteId)
    setBudgets(prev => prev.filter(b => b.id !== deleteId))
    setDeleteId(null)
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Orçamentos</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>
            Limites por categoria · {monthLabel}
          </p>
        </div>
        <Button onClick={openAdd}>+ Novo orçamento</Button>
      </div>

      {/* TOTAL CARD */}
      {!loading && totalLimit > 0 && (
        <Card style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.25rem' }}>Orçamento total do mês</p>
              <p className="font-display" style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-1px' }}>
                {formatCurrency(totalSpent)}{' '}
                <span style={{ fontSize: '1rem', color: 'var(--ink-soft)', fontWeight: 400 }}>
                  / {formatCurrency(totalLimit)}
                </span>
              </p>
            </div>
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              background: `conic-gradient(${totalSpent > totalLimit ? 'var(--danger)' : 'var(--green-light)'} ${(totalSpent / totalLimit) * 360}deg, var(--surface) 0deg)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: 'var(--white)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="font-display" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  {totalPct}%
                </span>
              </div>
            </div>
          </div>
          <div style={{ height: 8, background: 'var(--surface)', borderRadius: '100px', overflow: 'hidden' }}>
            <div style={{
              width: `${totalPct}%`, height: '100%', borderRadius: '100px',
              background: totalSpent > totalLimit ? 'var(--danger)' : 'var(--green-light)',
              transition: 'width .4s',
            }} />
          </div>
        </Card>
      )}

      {/* BUDGET LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
          <p>Carregando orçamentos...</p>
        </div>
      ) : enriched.length === 0 && unbudgeted.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</p>
            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Nenhum orçamento definido</p>
            <p style={{ fontSize: '0.85rem' }}>Defina limites por categoria para controlar seus gastos</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {enriched.map(b => {
            const pct  = b.limit_amount > 0 ? Math.min(Math.round((b.spent / b.limit_amount) * 100), 100) : 0
            const over = b.spent > b.limit_amount
            const warn = pct >= 80 && !over
            const barColor = over ? 'var(--danger)' : warn ? WARN_COLOR : 'var(--green-light)'
            const labelColor = over ? 'var(--danger)' : warn ? WARN_COLOR : 'var(--green)'

            return (
              <Card key={b.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                    background: `${categoryColor(b.category)}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                  }}>
                    {categoryIcon(b.category)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{b.category}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {over && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Excedido</span>}
                        {warn && <span style={{ fontSize: '0.75rem', color: WARN_COLOR, fontWeight: 600 }}>⚡ Atenção</span>}
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                          {formatCurrency(b.spent)} / {formatCurrency(b.limit_amount)}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '100px', background: barColor, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <span style={{ fontSize: '0.76rem', color: labelColor, fontWeight: 600 }}>{pct}% usado</span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>
                        {over
                          ? `${formatCurrency(b.spent - b.limit_amount)} acima do limite`
                          : `${formatCurrency(b.limit_amount - b.spent)} disponível`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <button onClick={() => openEdit(b)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-soft)', fontSize: '0.9rem', padding: '0.2rem',
                    }}>✏️</button>
                    <button onClick={() => confirmDelete(b.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-soft)', fontSize: '0.9rem', padding: '0.2rem',
                    }}>🗑</button>
                  </div>
                </div>
              </Card>
            )
          })}

          {/* Categories with spending but no budget */}
          {unbudgeted.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', marginBottom: '0.75rem', fontWeight: 500 }}>
                Categorias sem orçamento definido
              </p>
              {unbudgeted.map(([cat, spent]) => (
                <Card key={cat} style={{ marginBottom: '0.75rem', opacity: 0.8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
                      background: `${categoryColor(cat)}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>
                      {categoryIcon(cat)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{cat}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{formatCurrency(spent)}</span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', margin: '3px 0 0' }}>Sem limite definido</p>
                    </div>
                    <button onClick={() => {
                      setForm({ category: cat, limit: '' })
                      setEditingId(null)
                      setShowModal(true)
                    }} style={{
                      background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                      color: 'var(--green)', fontSize: '0.78rem', padding: '0.3rem 0.7rem',
                      borderRadius: '8px', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    }}>
                      Definir limite
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Editar orçamento' : 'Novo orçamento'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              disabled={!!editingId}
              style={{ ...inputStyle, opacity: editingId ? 0.6 : 1 }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Limite mensal (R$)</label>
            <input
              required type="number" min="1" value={form.limit}
              onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
              placeholder="1.000" style={inputStyle} autoFocus
            />
          </div>
          {!editingId && spentByCategory[form.category] > 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', background: 'var(--surface)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
              Você já gastou {formatCurrency(spentByCategory[form.category])} em {form.category} este mês.
            </p>
          )}
          {saveError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.82rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '8px' }}>
              {saveError}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir orçamento?">
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" style={{ flex: 1 }} onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
