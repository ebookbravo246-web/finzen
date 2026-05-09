import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FinZen — Seu dinheiro, no automático',
  description: 'Assistente financeiro pessoal com IA e Open Finance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
