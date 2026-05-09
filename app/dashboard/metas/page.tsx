'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { supabase, type Goal } from '@/lib/supabase'

const ICONS = ['✈️','🏠','🚗','📚','💍','🎮','🏋️','🌎','💻','🎓','🐶','🏖️','🎵','🍕','💰','🎯']

const EMPTY_FORM = { name: '', icon: '✈️', target: '', current: '', deadline: '' }

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
  background: 'var(--white)',
}

const labelStyle = { fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [depositModal, setDepositModal] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setGoals(data ?? [])
        setLoading(false)
      })
  }, [])

  const openAdd = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      icon: goal.icon,
      target: String(goal.target),
      current: String(goal.current),
      deadline: goal.deadline?.slice(0, 7) ?? '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingGoal(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const fields = {
      name: form.name,
      icon: form.icon,
      target: Number(form.target),
      current: Number(form.current) || 0,
      deadline: form.deadline ? form.deadline + '-01' : null,
    }

    if (editingGoal) {
      const { data, error } = await supabase
        .from('goals')
        .update(fields)
        .eq('id', editingGoal.id)
        .select()
        .single()
      if (!error && data) setGoals(prev => prev.map(g => g.id === editingGoal.id ? data : g))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...fields, user_id: user.id })
        .select()
        .single()
      if (!error && data) setGoals(prev => [data, ...prev])
    }

    closeModal()
  }

  const handleDeposit = async (id: string) => {
    const val = Number(depositValue)
    if (!val) return
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newCurrent = Math.min(goal.current + val, goal.target)
    const { error } = await supabase.from('goals').update({ current: newCurrent }).eq('id', id)
    if (!error) setGoals(prev => prev.map(g => g.id === id ? { ...g, current: newCurrent } : g))
    setDepositModal(null)
    setDepositValue('')
  }

  const handleDelete = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const totalSaved  = goals.reduce((s, g) => s + g.current, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Metas</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>Acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={openAdd}>+ Nova meta</Button>
      </div>

      {/* SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Total guardado</p>
          <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green-light)', letterSpacing: '-1px' }}>
            {formatCurrency(totalSaved)}
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Meta total</p>
          <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
            {formatCurrency(totalTarget)}
          </p>
        </Card>
        <Card>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginBottom: '0.4rem' }}>Progresso geral</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '-1px' }}>
              {overallPct}%
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{goals.length} meta{goals.length !== 1 ? 's' : ''}</span>
          </div>
        </Card>
      </div>

      {/* GOALS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-soft)' }}>
          <p style={{ fontSize: '0.9rem' }}>Carregando metas...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.2rem' }}>
          {goals.map(goal => {
            const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100)
            const remaining = goal.target - goal.current
            const deadline = goal.deadline
              ? new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              : 'Sem prazo'
            const done = pct >= 100

            return (
              <Card key={goal.id} style={{ position: 'relative' }}>
                {done && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--green-pale)', color: 'var(--green)',
                    fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '100px',
                  }}>✓ Concluída</div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '16px', background: 'var(--green-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
                  }}>{goal.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="font-display" style={{ fontSize: '1rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {goal.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '3px 0 0' }}>Prazo: {deadline}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(goal.current)}</span>
                    <span style={{ color: 'var(--ink-soft)' }}>{formatCurrency(goal.target)}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: '100px',
                      background: done ? 'var(--green)' : 'var(--green-light)',
                      transition: 'width .5s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--green)', fontWeight: 600 }}>{pct}% concluído</span>
                    {!done && <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Faltam {formatCurrency(remaining)}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  {!done && (
                    <Button size="sm" style={{ flex: 1 }} onClick={() => setDepositModal(goal.id)}>
                      + Depositar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(goal)} title="Editar">✏️</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(goal.id)} title="Excluir">🗑</Button>
                </div>
              </Card>
            )
          })}

          {/* ADD CARD */}
          <div
            onClick={openAdd}
            style={{
              border: '2px dashed var(--border)', borderRadius: '16px', padding: '2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--ink-soft)', gap: '0.5rem', minHeight: 200,
              transition: 'border-color .2s, color .2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'; (e.currentTarget as HTMLElement).style.color = 'var(--green)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink-soft)' }}
          >
            <span style={{ fontSize: '2rem' }}>＋</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Nova meta</span>
          </div>

          {/* EMPTY STATE */}
          {goals.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--ink-soft)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</p>
              <p style={{ fontWeight: 500, marginBottom: '0.3rem' }}>Nenhuma meta ainda</p>
              <p style={{ fontSize: '0.85rem' }}>Crie sua primeira meta e comece a poupar com foco.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL NOVA / EDITAR META */}
      <Modal open={showModal} onClose={closeModal} title={editingGoal ? 'Editar meta' : 'Nova meta'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Ícone</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{
                  width: 40, height: 40, borderRadius: '10px', border: '2px solid',
                  borderColor: form.icon === ic ? 'var(--green)' : 'var(--border)',
                  background: form.icon === ic ? 'var(--green-pale)' : 'transparent',
                  cursor: 'pointer', fontSize: '1.2rem',
                }}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nome da meta</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Viagem para Europa" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Valor alvo (R$)</label>
              <input required type="number" min="1" step="0.01" value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="15.000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Já guardei (R$)</label>
              <input type="number" min="0" step="0.01" value={form.current}
                onChange={e => setForm(f => ({ ...f, current: e.target.value }))} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Prazo</label>
            <input type="month" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={closeModal}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>{editingGoal ? 'Salvar alterações' : 'Criar meta'}</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL DEPÓSITO */}
      <Modal open={!!depositModal} onClose={() => { setDepositModal(null); setDepositValue('') }} title="Adicionar depósito">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {depositModal && (() => {
            const g = goals.find(g => g.id === depositModal)
            return g ? (
              <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: '0 0 2px' }}>{g.icon} {g.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: 0 }}>
                  {formatCurrency(g.current)} guardado de {formatCurrency(g.target)}
                </p>
              </div>
            ) : null
          })()}
          <div>
            <label style={labelStyle}>Valor a depositar (R$)</label>
            <input
              type="number" min="0.01" step="0.01" value={depositValue}
              onChange={e => setDepositValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && depositModal && handleDeposit(depositModal)}
              placeholder="0,00" style={inputStyle} autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" style={{ flex: 1 }} onClick={() => { setDepositModal(null); setDepositValue('') }}>Cancelar</Button>
            <Button style={{ flex: 1 }} onClick={() => depositModal && handleDeposit(depositModal)}>Depositar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
