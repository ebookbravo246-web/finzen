'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { loginAction, signupAction } from './actions'

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.95rem',
  outline: 'none', background: 'var(--white)', boxSizing: 'border-box' as const,
}

const labelStyle = { fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }

function translateError(msg: string): string {
  if (msg.includes('Email not confirmed'))      return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('already registered'))        return 'Este e-mail já está cadastrado. Tente entrar.'
  if (msg.includes('Password should be'))        return 'A senha deve ter pelo menos 6 caracteres.'
  return msg
}

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handler = (e: PageTransitionEvent) => { if (e.persisted) setLoading(false) }
    window.addEventListener('pageshow', handler)
    return () => window.removeEventListener('pageshow', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (tab === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) setError('Não foi possível enviar o e-mail. Tente novamente.')
        else setMessage('Link de recuperação enviado! Verifique sua caixa de entrada.')
        setLoading(false)
        return
      }

      if (tab === 'login') {
        // loginAction faz redirect('/dashboard') no servidor em caso de sucesso
        // e retorna { error } em caso de falha
        const result = await loginAction(email, password)
        if (result?.error) {
          setError(translateError(result.error))
          setLoading(false)
        }
        // Se não há error, o redirect já aconteceu — não chega aqui
        return
      }

      // signup — signupAction faz redirect('/dashboard') se sessão for criada
      const result = await signupAction(email, password, name)
      if (result?.error) {
        setError(translateError(result.error))
        setLoading(false)
        return
      }
      if (result?.needsConfirmation) {
        setMessage('Conta criada! Confirme seu e-mail e depois volte aqui para entrar.')
        setTab('login')
        setLoading(false)
        return
      }
      // redirect já aconteceu no servidor

    } catch (err) {
      console.error('[FinZen] Erro inesperado no login:', err)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
      setLoading(false)
    }
  }

  const switchTab = (t: typeof tab) => {
    setTab(t)
    setError('')
    setMessage('')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', padding: '2rem',
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: '24px', padding: '2.5rem',
        border: '1px solid var(--border)', width: '100%', maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)' }}>
            Fin<span style={{ color: 'var(--ink)' }}>Zen</span>
          </div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            {tab === 'forgot' ? 'Recuperar senha' : 'Seu dinheiro, no automático.'}
          </p>
        </div>

        {tab !== 'forgot' && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px',
            background: 'var(--surface)', borderRadius: '12px', padding: '4px', marginBottom: '1.8rem',
          }}>
            {(['login', 'signup'] as const).map((t) => (
              <button key={t} onClick={() => switchTab(t)} style={{
                padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500, transition: 'all .15s',
                background: tab === t ? 'var(--white)' : 'transparent',
                color: tab === t ? 'var(--ink)' : 'var(--ink-soft)',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
            padding: '0.75rem 1rem', marginBottom: '1rem',
            color: 'var(--danger)', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{
            background: 'var(--green-pale)', border: '1px solid #A7F3D0', borderRadius: '10px',
            padding: '0.75rem 1rem', marginBottom: '1rem',
            color: 'var(--green)', fontSize: '0.875rem',
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'signup' && (
            <div>
              <label style={labelStyle}>Nome</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo" required style={inputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required style={inputStyle} />
          </div>
          {tab !== 'forgot' && (
            <div>
              <label style={labelStyle}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} style={inputStyle} />
            </div>
          )}

          {tab === 'login' && (
            <button type="button" onClick={() => switchTab('forgot')} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: '0.82rem', color: 'var(--green)', textAlign: 'right',
              fontFamily: 'inherit',
            }}>
              Esqueci a senha
            </button>
          )}

          <button type="submit" disabled={loading} style={{
            background: 'var(--green)', color: '#fff', padding: '0.85rem',
            borderRadius: '12px', border: 'none', fontFamily: 'inherit', fontSize: '1rem',
            fontWeight: 500, cursor: loading ? 'wait' : 'pointer', marginTop: '0.5rem',
            transition: 'background .15s',
          }}>
            {loading
              ? 'Aguarde...'
              : tab === 'login' ? 'Entrar'
              : tab === 'signup' ? 'Criar conta gratuita'
              : 'Enviar link de recuperação'}
          </button>
        </form>

        {tab === 'forgot' && (
          <button onClick={() => switchTab('login')} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '1rem',
            fontFamily: 'inherit', display: 'block', width: '100%', textAlign: 'center',
          }}>
            ← Voltar para o login
          </button>
        )}

        {tab === 'signup' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
            Ao criar conta você concorda com os{' '}
            <a href="#" style={{ color: 'var(--green)' }}>Termos de Uso</a> e{' '}
            <a href="#" style={{ color: 'var(--green)' }}>Política de Privacidade</a>
          </p>
        )}
      </div>
    </div>
  )
}
