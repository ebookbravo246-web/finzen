'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, categoryColor, categoryIcon } from '@/lib/utils'
import { supabase, type Transaction } from '@/lib/supabase'

const EXPENSE_CATEGORIES = ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros']
const INCOME_CATEGORIES  = ['Salário', 'Freelance', 'Aluguel recebido', 'Investimentos', 'Outros']

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7)
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function lastMonths(n = 12) {
  const months: string[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

const EMPTY_FORM = {
  name: '', amount: '', category: 'Alimentação', type: 'expense' as 'expense' | 'income',
  date: new Date().toISOString().slice(0, 10),
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit',
  fontSize: '0.9rem', outline: 'none', background: 'var(--white)',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px',
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(currentMonthStr())
  const [filterCat, setFilterCat] = useState('Todas')
  const [filterType, setFilterType] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    const [y, m] = filterMonth.split('-')
    const lastDay = new Date(Number(y), Number(m), 0).getDate()
    supabase
      .from('transactions')
      .select('*')
      .gte('date', `${filterMonth}-01`)
      .lte('date', `${filterMonth}-${lastDay}`)
      .order('date', { ascending: false })
      .then(({ data }) => {
        setTransactions(data ?? [])
        setLoading(false)
      })
  }, [filterMonth])

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const filtered = transactions.filter(tx => {
    if (filterCat !== 'Todas' && tx.category !== filterCat) return false
    if (filterType === 'Receitas' && tx.type !== 'income') return false
    if (filterType === 'Gastos' && tx.type !== 'expense') return false
    if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalIncome   = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)

  const openAdd = () => {
    setEditingTx(null)
    setForm(EMPTY_FORM)
    setSaveError('')
    setShowModal(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setForm({
      name: tx.name,
      amount: String(Math.abs(tx.amount)),
      category: tx.category,
      type: tx.type,
      date: tx.date,
    })
    setSaveError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTx(null)
    setForm(EMPTY_FORM)
    setSaveError('')
  }

  const handleTypeChange = (type: 'expense' | 'income') => {
    const defaultCat = type === 'income' ? 'Salário' : 'Alimentação'
    setForm(f => ({ ...f, type, category: defaultCat }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    const amount = form.type === 'expense' ? -Math.abs(Number(form.amount)) : Number(form.amount)
    const fields = { name: form.name, category: form.category, amount, date: form.date, type: form.type }

    if (editingTx) {
      const { data, error } = await supabase
        .from('transactions')
        .update(fields)
        .eq('id', editingTx.id)
        .select()
        .single()
      if (error) { setSaveError(error.message); setSaving(false); return }
      if (data) setTransactions(prev => prev.map(t => t.id === editingTx.id ? data : t))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaveError('Sessão expirada. Faça login novamente.'); setSaving(false); return }
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...fields, user_id: user.id })
        .select()
        .single()
      if (error) { setSaveError(error.message); setSaving(false); return }
      if (data) setTransactions(prev => [data, ...prev])
    }

    setSaving(false)
    closeModal()
  }

  const confirmDelete = (id: string) => setDeleteId(id)

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('transactions').delete().eq('id', deleteId)
    setTransactions(prev => prev.filter(t => t.id !== deleteId))
    setDeleteId(null)
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Transações</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>Histórico completo de entradas e saídas</p>
        </div>
        <Button onClick={openAdd}>+ Novo lançamento</Button>
      </div>

      {/* MONTH SELECTOR */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
        {lastMonths(6).map(ym => (
          <button key={ym} onClick={() => setFilterMonth(ym)} style={{
            padding: '0.45rem 1rem', borderRadius: '100px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap',
            background: filterMonth === ym ? 'var(--green)' : 'var(--white)',
            color: filterMonth === ym ? '#fff' : 'var(--ink-soft)',
            border: filterMonth === ym ? 'none' : '1px solid var(--border)',
          }}>
            {monthLabel(ym)}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Receitas', value: totalIncome,                color: 'var(--green-light)' },
          { label: 'Gastos',   value: totalExpenses,              color: 'var(--danger)' },
          { label: 'Saldo',    value: totalIncome - totalExpenses, color: totalIncome - totalExpenses >= 0 ? 'var(--ink)' : 'var(--danger)' },
        ].map(s => (
          <Card key={s.label}>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>{s.label}</p>
            <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, letterSpacing: '-1px' }}>
              {formatCurrency(s.value)}
            </p>
          </Card>
        ))}
      </div>

      {/* FILTERS */}
      <Card style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Buscar transação..."
            style={{ ...inputStyle, maxWidth: 240, flex: 1 }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            {['Todos', 'Receitas', 'Gastos'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
            <option>Todas</option>
            {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <option key={c}>{c}</option>)}
          </select>
          {(filterCat !== 'Todas' || filterType !== 'Todos' || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCat('Todas'); setFilterType('Todos'); setSearch('') }}>
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* LIST */}
      <Card>
        <CardHeader title={loading ? 'Carregando...' : `${filtered.length} transações`} />
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '0.9rem' }}>Carregando transações...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
            <p>Nenhuma transação em {monthLabel(filterMonth)}</p>
          </div>
        ) : (
          <div>
            {filtered.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.85rem 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--surface)' : 'none',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
                  background: `${categoryColor(tx.category)}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>
                  {categoryIcon(tx.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</p>
                  <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                    {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <Badge color={categoryColor(tx.category)} bg={`${categoryColor(tx.category)}15`}>
                  {tx.category}
                </Badge>
                <span style={{
                  fontSize: '0.95rem', fontWeight: 600, minWidth: 100, textAlign: 'right',
                  color: tx.amount > 0 ? 'var(--green-light)' : 'var(--danger)',
                }}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button onClick={() => openEdit(tx)} title="Editar" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-soft)', fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: '6px',
                  }}>✏️</button>
                  <button onClick={() => confirmDelete(tx.id)} title="Excluir" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-soft)', fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: '6px',
                  }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODAL — add & edit */}
      <Modal open={showModal} onClose={closeModal} title={editingTx ? 'Editar lançamento' : 'Novo lançamento'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--surface)', borderRadius: '10px', padding: '4px' }}>
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => handleTypeChange(t)} style={{
                padding: '0.55rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
                background: form.type === t ? 'var(--white)' : 'transparent',
                color: form.type === t ? (t === 'expense' ? 'var(--danger)' : 'var(--green-light)') : 'var(--ink-soft)',
              }}>
                {t === 'expense' ? '💸 Gasto' : '💰 Receita'}
              </button>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={form.type === 'income' ? 'Ex: Salário, Freelance...' : 'Ex: Mercado, Netflix...'}
              style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Valor (R$)</label>
              <input required type="number" step="0.01" min="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data</label>
              <input required type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {saveError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.82rem', background: '#fef2f2', padding: '0.6rem 0.9rem', borderRadius: '8px' }}>
              {saveError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={closeModal}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }} disabled={saving}>
              {saving ? 'Salvando...' : editingTx ? 'Salvar alterações' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir transação?">
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
