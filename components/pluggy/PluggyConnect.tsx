'use client'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

declare global {
  interface Window {
    PluggyConnect: new (config: PluggyConnectConfig) => { init: () => void }
  }
}

type PluggyConnectConfig = {
  connectToken: string
  includeSandbox?: boolean
  onSuccess: (data: { item: { id: string } }) => void
  onError: (data: { message: string }) => void
  onClose: () => void
}

type Props = {
  onSuccess: (itemId: string) => void
  onError?: (msg: string) => void
  itemId?: string
  label?: string
  disabled?: boolean
}

export function PluggyConnect({ onSuccess, onError, itemId, label = 'Conectar banco', disabled }: Props) {
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current) return
    const script = document.createElement('script')
    script.src = 'https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js'
    script.async = true
    document.head.appendChild(script)
    scriptLoaded.current = true
  }, [])

  const handleClick = async () => {
    const res = await fetch('/api/pluggy/connect-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemId ? { itemId } : {}),
    })

    if (!res.ok) {
      onError?.('Não foi possível iniciar a conexão.')
      return
    }

    const { connectToken } = await res.json()

    const pluggy = new window.PluggyConnect({
      connectToken,
      includeSandbox: process.env.NODE_ENV === 'development',
      onSuccess: ({ item }) => onSuccess(item.id),
      onError:   ({ message }) => onError?.(message),
      onClose:   () => {},
    })
    pluggy.init()
  }

  return (
    <Button onClick={handleClick} disabled={disabled}>
      {label}
    </Button>
  )
}
