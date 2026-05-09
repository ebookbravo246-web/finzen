import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  bg?: string
}

export function Badge({ children, color = 'var(--green)', bg = 'var(--green-pale)' }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.2rem 0.7rem', borderRadius: '100px',
      fontSize: '0.75rem', fontWeight: 500,
      color, background: bg,
    }}>
      {children}
    </span>
  )
}
