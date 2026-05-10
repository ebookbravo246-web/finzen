'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [tab, setTab]       = useState<'login' | 'signup'>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const [error, setError]   = useState('')
  const [msg, setMsg]       = useState('')
  const [loading, setLoad]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoad(true)
    setError('')
    setMsg('')

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoad(false)
      } else {
        window.location.href = '/dashboard'
      }
      return
    }

    // signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoad(false)
      return
    }
    if (data.session) {
      window.location.href = '/dashboard'
      return
    }
    setMsg('Conta criada! Verifique seu e-mail para confirmar.')
    setTab('login')
    setLoad(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7f5' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '2.5rem', border: '1px solid #e5e7e6', width: '100%', maxWidth: 400 }}>

        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#0F6E56' }}>FinZen</h1>

        <div style={{ display: 'flex', marginBottom: '1.5rem', gap: 4 }}>
          {(['login', 'signup'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(''); setMsg('') }} style={{
              flex: 1, padding: '0.5rem', border: 'none', borderRadius: 8, cursor: 'pointer',
              background: tab === t ? '#0F6E56' : '#f5f7f5', color: tab === t ? '#fff' : '#555',
              fontWeight: 600, fontSize: '0.9rem',
            }}>
              {t === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        {error && <p style={{ color: '#E24B4A', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
        {msg   && <p style={{ color: '#0F6E56', marginBottom: '1rem', fontSize: '0.9rem' }}>{msg}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'signup' && (
            <input
              placeholder="Nome completo" required value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #ddd', fontSize: '1rem' }}
            />
          )}
          <input
            type="email" placeholder="E-mail" required value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #ddd', fontSize: '1rem' }}
          />
          <input
            type="password" placeholder="Senha (mín. 6 caracteres)" required minLength={6} value={password}
            onChange={e => setPass(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid #ddd', fontSize: '1rem' }}
          />
          <button type="submit" disabled={loading} style={{
            padding: '0.85rem', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#0F6E56', color: '#fff', fontWeight: 600, fontSize: '1rem',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

      </div>
    </div>
  )
}
