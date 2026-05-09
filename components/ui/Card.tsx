import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: '16px',
      padding: '1.5rem',
      border: '1px solid var(--border)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
      <span className="font-display" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{title}</span>
      {action}
    </div>
  )
}
