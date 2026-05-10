'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleLogin() {
    console.log('clicou', email, password)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.log('erro:', error.message)
      setError(error.message)
    } else {
      console.log('sucesso!')
      window.location.href = '/dashboard'
    }
  }

  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="senha" />
      {error && <p>{error}</p>}
      <button onClick={handleLogin}>Entrar</button>
    </div>
  )
}
