import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const styles = {
  primary: { background: 'var(--green)', color: '#fff', border: 'none' },
  outline: { background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--border)' },
  ghost:   { background: 'transparent', color: 'var(--green)', border: 'none' },
  danger:  { background: 'var(--danger)', color: '#fff', border: 'none' },
}

const sizes = {
  sm: { padding: '0.4rem 0.9rem', fontSize: '0.82rem' },
  md: { padding: '0.6rem 1.2rem', fontSize: '0.9rem' },
  lg: { padding: '0.85rem 2rem', fontSize: '1rem' },
}

export function Button({ variant = 'primary', size = 'md', children, style, ...props }: ButtonProps) {
  return (
    <button
      style={{
        ...styles[variant],
        ...sizes[size],
        borderRadius: '100px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 500,
        transition: 'all .15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
