'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { supabase, type Investment } from '@/lib/supabase'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const TYPES = ['Renda Fixa', 'Ação', 'ETF', 'FII', 'Criptomoeda', 'Outros']

const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  'Renda Fixa':  { color: '#0F6E56', bg: '#E1F5EE' },
  'Ação':        { color: '#E24B4A', bg: '#FCEAEA' },
  'ETF':         { color: '#178BA5', bg: '#E3F4F8' },
  'FII':         { color: '#9B59B6', bg: '#F3EAF8' },
  'Criptomoeda': { color: '#BA7517', bg: '#FDF3E0' },
  'Outros':      { color: '#888780', bg: '#F0F0EF' },
}

const COLORS = ['#0F6E56','#1D9E75','#5DCAA5','#178BA5','#9B59B6','#BA7517','#E24B4A','#888780']

const EMPTY_FORM = { name: '', type: 'Renda Fixa', value: '', return_pct: '' }

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', background: 'var(--white)',
}
const labelStyle = { fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }

export default function InvestimentosPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInv, setEditingInv] = useState<Investment | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setInvestments(data ?? [])
        setLoading(false)
      })
  }, [])

  const total = useMemo(() => investments.reduce((s, i) => s + i.value, 0), [investments])

  const avgReturn = useMemo(() => {
    if (total === 0) return 0
    return investments.reduce((s, i) => s + i.return_pct * (i.value / total), 0)
  }, [investments, total])

  const pieData = useMemo(() =>
    investments.map(i => ({
      name: i.name,
      value: i.value,
      pct: total > 0 ? Math.round((i.value / total) * 100) : 0,
    })),
    [investments, total]
  )

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    investments.forEach(i => { map[i.type] = (map[i.type] || 0) + i.value })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [investments])

  const openAdd = () => {
    setEditingInv(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (inv: Investment) => {
    setEditingInv(inv)
    setForm({ name: inv.name, type: inv.type, value: String(inv.value), return_pct: String(inv.return_pct) })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingInv(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const fields = {
      name: form.name,
      type: form.type,
      value: Number(form.value),
      return_pct: Number(form.return_pct),
    }

    if (editingInv) {
      const { data, error } = await supabase
        .from('investments').update(fields).eq('id', editingInv.id).select().single()
      if (!error && data) setInvestments(prev => prev.map(i => i.id === editingInv.id ? data : i))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('investments').insert({ ...fields, user_id: user.id }).select().single()
      if (!error && data) setInvestments(prev => [data, ...prev])
    }

    closeModal()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('investments').delete().eq('id', id)
    setInvestments(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Investimentos</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>Visão geral da sua carteira</p>
        </div>
        <Button onClick={openAdd}>+ Novo ativo</Button>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Patrimônio total</p>
          <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
            {loading ? '—' : formatCurrency(total)}
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Rentabilidade média</p>
          <p className="font-display" style={{
            fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-1px',
            color: avgReturn >= 0 ? 'var(--green-light)' : 'var(--danger)',
          }}>
            {loading ? '—' : `${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(1)}% a.a.`}
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Ativos na carteira</p>
          <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
            {loading ? '—' : investments.length}
          </p>
        </Card>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-soft)' }}>
          <p style={{ fontSize: '0.9rem' }}>Carregando carteira...</p>
        </div>
      ) : investments.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</p>
            <p style={{ fontWeight: 500, marginBottom: '0.3rem' }}>Nenhum ativo cadastrado</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Adicione seus investimentos para acompanhar sua carteira</p>
            <Button onClick={openAdd}>+ Adicionar primeiro ativo</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.2rem' }}>
          {/* LISTA */}
          <Card>
            <CardHeader title={`${investments.length} ativo${investments.length !== 1 ? 's' : ''}`} />
            <div>
              {investments.map((inv, i) => {
                const pct = total > 0 ? Math.round((inv.value / total) * 100) : 0
                const color = COLORS[i % COLORS.length]
                return (
                  <div key={inv.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 0',
                    borderBottom: i < investments.length - 1 ? '1px solid var(--surface)' : 'none',
                  }}>
                    <div style={{ width: 4, height: 44, borderRadius: '4px', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inv.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
                        <Badge
                          color={TYPE_STYLE[inv.type]?.color ?? '#888'}
                          bg={TYPE_STYLE[inv.type]?.bg ?? '#f0f0f0'}
                        >{inv.type}</Badge>
                        <span style={{ fontSize: '0.76rem', color: 'var(--ink-soft)' }}>{pct}% da carteira</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, margin: 0 }}>{formatCurrency(inv.value)}</p>
                      <p style={{
                        fontSize: '0.78rem', margin: '2px 0 0', fontWeight: 500,
                        color: inv.return_pct >= 0 ? 'var(--green-light)' : 'var(--danger)',
                      }}>
                        {inv.return_pct >= 0 ? '+' : ''}{inv.return_pct.toFixed(1)}% a.a.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                      <button onClick={() => openEdit(inv)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-soft)', fontSize: '0.9rem', padding: '0.25rem 0.4rem', borderRadius: '6px',
                      }}>✏️</button>
                      <button onClick={() => handleDelete(inv.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-soft)', fontSize: '0.9rem', padding: '0.25rem 0.4rem', borderRadius: '6px',
                      }}>🗑</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* PIE CHART */}
            <Card>
              <CardHeader title="Diversificação" />
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                {pieData.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 }}>{item.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* POR TIPO */}
            <Card>
              <CardHeader title="Por tipo" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {byType.map(([type, val]) => {
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0
                  const style = TYPE_STYLE[type] ?? { color: '#888', bg: '#f0f0f0' }
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 500 }}>{type}</span>
                        <span style={{ color: 'var(--ink-soft)' }}>{pct}% · {formatCurrency(val)}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: style.color, borderRadius: '100px', transition: 'width .4s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MODAL */}
      <Modal open={showModal} onClose={closeModal} title={editingInv ? 'Editar ativo' : 'Novo ativo'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nome do ativo</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Tesouro Selic 2027, IVVB11..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Valor atual (R$)</label>
              <input required type="number" min="0.01" step="0.01" value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="10.000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rentabilidade (% a.a.)</label>
              <input required type="number" step="0.01" value={form.return_pct}
                onChange={e => setForm(f => ({ ...f, return_pct: e.target.value }))} placeholder="10.5" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={closeModal}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>{editingInv ? 'Salvar alterações' : 'Adicionar ativo'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
