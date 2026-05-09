'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard',              icon: '⬛', label: 'Visão Geral' },
  { href: '/dashboard/transacoes',   icon: '💳', label: 'Transações' },
  { href: '/dashboard/orcamentos',   icon: '📊', label: 'Orçamentos' },
  { href: '/dashboard/metas',        icon: '🎯', label: 'Metas' },
  { href: '/dashboard/investimentos',icon: '📈', label: 'Investimentos' },
  { href: '/dashboard/contas',       icon: '🏦', label: 'Contas' },
  { href: '/dashboard/ia',           icon: '💬', label: 'IA — WhatsApp' },
  { href: '/dashboard/configuracoes',icon: '⚙️', label: 'Configurações' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [initials, setInitials] = useState('?')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name: string = user.user_metadata?.full_name || user.email || ''
      setDisplayName(name)
      const parts = name.trim().split(/\s+/)
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()
      )
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: 240, background: 'var(--white)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
      position: 'fixed', top: 0, bottom: 0, left: 0,
    }}>
      <div className="font-display" style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--green)', padding: '0 1.5rem 2rem' }}>
        Fin<span style={{ color: 'var(--ink)' }}>Zen</span>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1.5rem', textDecoration: 'none', fontSize: '0.9rem',
              transition: 'all .15s',
              color: active ? 'var(--green)' : 'var(--ink-soft)',
              background: active ? 'var(--green-pale)' : 'transparent',
              borderLeft: active ? '2px solid var(--green)' : '2px solid transparent',
              fontWeight: active ? 500 : 400,
            }}>
              <span style={{ fontSize: '1rem', width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.8rem', background: 'var(--surface)', borderRadius: '12px',
        }}>
          <div style={{
            width: 36, height: 36, background: 'var(--green)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName || '…'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', margin: 0 }}>Plano Gratuito</p>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          width: '100%', padding: '0.65rem', borderRadius: '10px',
          border: '1px solid var(--border)', background: 'transparent',
          fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--ink-soft)',
          cursor: 'pointer', transition: 'all .15s', textAlign: 'center',
        }}>
          Sair
        </button>
      </div>
    </aside>
  )
}
