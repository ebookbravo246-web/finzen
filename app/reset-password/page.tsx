'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.95rem',
  outline: 'none', background: 'var(--white)', boxSizing: 'border-box' as const,
}

const labelStyle = { fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'block', marginBottom: '6px' }

type Stage = 'waiting' | 'ready' | 'done' | 'invalid'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the token in the URL hash is detected
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('ready')
    })

    // Fallback: if session already established before the listener was set up
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStage('ready')
    })

    // After 6s with no token, the link is invalid or expired
    const timeout = setTimeout(() => {
      setStage(s => s === 'waiting' ? 'invalid' : s)
    }, 6000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setStage('done')
      setTimeout(() => router.push('/dashboard'), 2500)
    }
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="font-display" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)' }}>
            Fin<span style={{ color: 'var(--ink)' }}>Zen</span>
          </div>
        </div>

        {/* WAITING */}
        {stage === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--ink-soft)' }}>
            <p style={{ fontSize: '0.95rem' }}>Verificando o link...</p>
          </div>
        )}

        {/* INVALID */}
        {stage === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</p>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Link inválido ou expirado</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Solicite um novo link de recuperação na tela de login.
            </p>
            <button onClick={() => router.push('/login')} style={{
              background: 'var(--green)', color: '#fff', padding: '0.75rem 2rem',
              borderRadius: '12px', border: 'none', fontFamily: 'inherit',
              fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
            }}>
              Voltar ao login
            </button>
          </div>
        )}

        {/* FORM */}
        {stage === 'ready' && (
          <>
            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Criar nova senha</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>
              Escolha uma senha segura com pelo menos 6 caracteres.
            </p>

            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px',
                padding: '0.75rem 1rem', marginBottom: '1rem',
                color: 'var(--danger)', fontSize: '0.875rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={inputStyle}
                  autoFocus
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" required minLength={6} style={inputStyle}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                background: 'var(--green)', color: '#fff', padding: '0.85rem',
                borderRadius: '12px', border: 'none', fontFamily: 'inherit', fontSize: '1rem',
                fontWeight: 500, cursor: loading ? 'wait' : 'pointer', marginTop: '0.25rem',
                transition: 'background .15s',
              }}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}

        {/* SUCCESS */}
        {stage === 'done' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</p>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Senha atualizada!</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
              Redirecionando para o dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
