import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Para uso em API routes — lê cookies da request, não precisa escrever de volta
export function createSupabaseRouteClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
}

export type Transaction = {
  id: string
  user_id: string
  name: string
  amount: number
  category: string
  date: string
  type: 'income' | 'expense'
  created_at: string
}

export type Goal = {
  id: string
  user_id: string
  name: string
  icon: string
  current: number
  target: number
  deadline: string
  created_at: string
}

export type Budget = {
  id: string
  user_id: string
  category: string
  limit_amount: number
  spent: number
  month: string
}

export type Account = {
  id: string
  user_id: string
  name: string
  type: string
  balance: number
  color: string
  created_at: string
}

export type Investment = {
  id: string
  user_id: string
  name: string
  type: string
  value: number
  return_pct: number
  created_at: string
}
