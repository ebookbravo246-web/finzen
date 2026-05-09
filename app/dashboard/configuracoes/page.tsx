'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem',
  outline: 'none', background: 'var(--white)',
}
const labelStyle = { fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '5px' }

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: '100px', cursor: 'pointer', transition: 'background .2s',
      background: checked ? 'var(--green-light)' : '#D1D5DB', position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, transition: 'left .2s',
        left: checked ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

function Feedback({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div style={{
      padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem',
      background: type === 'success' ? 'var(--green-pale)' : '#FEF2F2',
      color: type === 'success' ? 'var(--green)' : 'var(--danger)',
      border: `1px solid ${type === 'success' ? 'rgba(29,158,117,0.3)' : '#FECACA'}`,
    }}>
      {type === 'success' ? '✓ ' : '⚠ '}{msg}
    </div>
  )
}

export default function ConfiguracoesPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('?')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const [notifications, setNotifications] = useState({
    weeklyReport: true, budgetAlerts: true, goalAlerts: true, whatsapp: false,
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const fullName = user.user_metadata?.full_name ?? ''
      setEmail(user.email ?? '')
      setName(fullName)
      const parts = fullName.trim().split(' ').filter(Boolean)
      setInitials(parts.length >= 2
        ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        : (parts[0]?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?')
      )
    })
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileMsg(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    })

    if (error) {
      setProfileMsg({ type: 'error', text: error.message })
    } else {
      const parts = name.trim().split(' ').filter(Boolean)
      setInitials(parts.length >= 2
        ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        : parts[0]?.[0]?.toUpperCase() ?? '?'
      )
      setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' })
      setTimeout(() => setProfileMsg(null), 3000)
    }
    setProfileLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)

    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }

    setPwdLoading(true)

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPwd })
    if (signInError) {
      setPwdMsg({ type: 'error', text: 'Senha atual incorreta.' })
      setPwdLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      setPwdMsg({ type: 'error', text: error.message })
    } else {
      setPwdMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => setPwdMsg(null), 3000)
    }
    setPwdLoading(false)
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Tem certeza? Esta ação é irreversível e apagará todos os seus dados.')
    if (!confirmed) return
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Configurações</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.88rem', marginTop: 2 }}>Gerencie seu perfil e preferências</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* PERFIL */}
          <Card>
            <CardHeader title="Perfil" />
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0,
                }}>{initials}</div>
                <div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '0 0 2px' }}>{name || email}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', margin: 0 }}>{email}</p>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Nome completo</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input value={email} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '0.76rem', color: 'var(--ink-soft)', marginTop: '4px' }}>
                  O e-mail não pode ser alterado por aqui.
                </p>
              </div>
              {profileMsg && <Feedback type={profileMsg.type} msg={profileMsg.text} />}
              <div>
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </form>
          </Card>

          {/* SEGURANÇA */}
          <Card>
            <CardHeader title="Segurança" />
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Senha atual</label>
                <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="••••••••" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar nova senha</label>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="••••••••" required style={inputStyle} />
              </div>
              {pwdMsg && <Feedback type={pwdMsg.type} msg={pwdMsg.text} />}
              <div>
                <Button type="submit" variant="outline" disabled={pwdLoading}>
                  {pwdLoading ? 'Alterando...' : 'Alterar senha'}
                </Button>
              </div>
            </form>
          </Card>

          {/* NOTIFICAÇÕES */}
          <Card>
            <CardHeader title="Notificações" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'weeklyReport', label: 'Relatório semanal',          desc: 'Resumo das suas finanças toda segunda-feira' },
                { key: 'budgetAlerts', label: 'Alertas de orçamento',       desc: 'Aviso quando atingir 80% de um limite' },
                { key: 'goalAlerts',   label: 'Alertas de metas',           desc: 'Progresso das suas metas financeiras' },
                { key: 'whatsapp',     label: 'Notificações via WhatsApp',  desc: 'Receba alertas diretamente no WhatsApp' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{item.label}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', margin: '2px 0 0' }}>{item.desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof notifications] }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* PLANO */}
          <Card>
            <CardHeader title="Seu plano" />
            <div style={{
              background: 'var(--green-pale)', borderRadius: '12px', padding: '1.2rem',
              border: '1px solid rgba(29,158,117,0.2)', marginBottom: '1.2rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)' }}>Plano Free</span>
                <span style={{ fontSize: '0.75rem', background: 'var(--green)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>Ativo</span>
              </div>
              <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-1px' }}>
                R$ 0<span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--ink-soft)' }}>/mês</span>
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '4px' }}>Grátis para sempre</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
              {[
                { label: 'Transações ilimitadas', active: true },
                { label: 'Metas e orçamentos',    active: true },
                { label: 'IA financeira',          active: true },
                { label: 'Open Finance (bancos)',  active: false },
                { label: 'WhatsApp ilimitado',     active: false },
                { label: 'Relatórios PDF',         active: false },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: f.active ? 'var(--green-light)' : '#D1D5DB', fontWeight: 700 }}>
                    {f.active ? '✓' : '○'}
                  </span>
                  <span style={{ color: f.active ? 'var(--ink)' : 'var(--ink-soft)' }}>{f.label}</span>
                </div>
              ))}
            </div>
            <Button style={{ width: '100%' }}>Fazer upgrade → Pro</Button>
          </Card>

          {/* DADOS E PRIVACIDADE */}
          <Card>
            <CardHeader title="Dados e privacidade" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button variant="outline" size="sm" style={{ width: '100%' }}>📥 Exportar meus dados</Button>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <Button
                size="sm"
                style={{ width: '100%', background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={handleDeleteAccount}
              >
                Excluir minha conta
              </Button>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', textAlign: 'center', lineHeight: 1.4 }}>
                Esta ação é permanente e apaga todos os seus dados.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
