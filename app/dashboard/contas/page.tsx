'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency } from '@/lib/utils'
import { supabase, type Account } from '@/lib/supabase'

const TYPES = ['Conta Corrente', 'Poupança', 'Cartão de Crédito', 'Investimentos', 'Carteira', 'Outro']

const TYPE_ICON: Record<string, string> = {
  'Conta Corrente':    '🏦',
  'Poupança':          '🐷',
  'Cartão de Crédito': '💳',
  'Investimentos':     '📈',
  'Carteira':          '👛',
  'Outro':             '🏧',
}

const COLORS = ['#0F6E56','#1D9E75','#178BA5','#9B59B6','#E96A00','#820AD1','#E24B4A','#333333']

const EMPTY_FORM = { name: '', type: 'Conta Corrente', balance: '', color: '#0F6E56' }

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', background: 'var(--white)',
}
const labelStyle = { fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }

export default function ContasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAcc, setEditingAcc] = useState<Account | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setAccounts(data ?? [])
        setLoading(false)
      })
  }, [])

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])
  const totalAssets  = useMemo(() => accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0), [accounts])
  const totalDebt    = useMemo(() => accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0), [accounts])

  const openAdd = () => {
    setEditingAcc(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (acc: Account) => {
    setEditingAcc(acc)
    setForm({ name: acc.name, type: acc.type, balance: String(acc.balance), color: acc.color })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAcc(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const fields = { name: form.name, type: form.type, balance: Number(form.balance), color: form.color }

    if (editingAcc) {
      const { data, error } = await supabase
        .from('accounts').update(fields).eq('id', editingAcc.id).select().single()
      if (!error && data) setAccounts(prev => prev.map(a => a.id === editingAcc.id ? data : a))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('accounts').insert({ ...fields, user_id: user.id }).select().single()
      if (!error && data) setAccounts(prev => [...prev, data])
    }

    closeModal()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Contas</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>
            Gerencie suas contas e acompanhe seu patrimônio
          </p>
        </div>
        <Button onClick={openAdd}>+ Nova conta</Button>
      </div>

      {/* TOTAL CARD */}
      <Card style={{ marginBottom: '1.5rem', background: 'var(--green)', border: 'none' }}>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
          Patrimônio total consolidado
        </p>
        <p className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
          {loading ? '—' : formatCurrency(totalBalance)}
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Ativos: <strong style={{ color: '#fff' }}>{formatCurrency(totalAssets)}</strong>
          </p>
          {totalDebt < 0 && (
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Dívidas: <strong style={{ color: '#ffb3b3' }}>{formatCurrency(totalDebt)}</strong>
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {/* ACCOUNTS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
          <p style={{ fontSize: '0.9rem' }}>Carregando contas...</p>
        </div>
      ) : accounts.length === 0 ? (
        <Card style={{ marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏦</p>
            <p style={{ fontWeight: 500, marginBottom: '0.3rem' }}>Nenhuma conta cadastrada</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Adicione suas contas bancárias, cartões e carteiras para acompanhar seu patrimônio
            </p>
            <Button onClick={openAdd}>+ Adicionar primeira conta</Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {accounts.map(acc => (
            <Card key={acc.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
                  background: acc.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                }}>
                  {TYPE_ICON[acc.type] ?? '🏦'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>{acc.name}</p>
                    <Badge color={acc.color} bg={acc.color + '18'}>{acc.type}</Badge>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>
                    Adicionada em {new Date(acc.created_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <p className="font-display" style={{
                  fontSize: '1.1rem', fontWeight: 700, margin: 0, flexShrink: 0,
                  color: acc.balance < 0 ? 'var(--danger)' : 'var(--ink)',
                }}>
                  {formatCurrency(acc.balance)}
                </p>

                <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                  <button onClick={() => openEdit(acc)} title="Editar" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-soft)', fontSize: '0.95rem', padding: '0.3rem 0.4rem', borderRadius: '6px',
                  }}>✏️</button>
                  <button onClick={() => handleDelete(acc.id)} title="Excluir" style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-soft)', fontSize: '0.95rem', padding: '0.3rem 0.4rem', borderRadius: '6px',
                  }}>🗑</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* OPEN FINANCE — Em breve */}
      <div style={{
        padding: '1.2rem 1.4rem', borderRadius: '14px',
        background: 'var(--green-pale)', border: '1px solid rgba(29,158,117,0.2)',
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
      }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0, color: 'var(--green)' }}>
              Open Finance — Conexão automática com bancos
            </p>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.55rem',
              borderRadius: '100px', background: 'var(--green)', color: '#fff', letterSpacing: '0.5px',
            }}>EM BREVE</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
            Em breve você poderá conectar seus bancos via Open Finance (regulamentado pelo Banco Central)
            e suas transações serão importadas automaticamente. Suas credenciais nunca são armazenadas.
          </p>
        </div>
      </div>

      {/* MODAL */}
      <Modal open={showModal} onClose={closeModal} title={editingAcc ? 'Editar conta' : 'Nova conta'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Nome da conta</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Nubank, Itaú, Carteira..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Saldo atual (R$)</label>
            <input required type="number" step="0.01" value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
              placeholder="Ex: 5000 ou -2500 para dívidas" style={inputStyle} />
            <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Use valor negativo para cartão de crédito ou dívidas.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, border: '3px solid',
                  borderColor: form.color === c ? 'var(--ink)' : 'transparent',
                  cursor: 'pointer', transition: 'border-color .15s',
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" style={{ flex: 1 }} onClick={closeModal}>Cancelar</Button>
            <Button type="submit" style={{ flex: 1 }}>{editingAcc ? 'Salvar alterações' : 'Adicionar conta'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
