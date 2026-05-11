import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  pluggy_account_id?: string | null
  pluggy_item_id?: string | null
  created_at: string
}

export type PluggyItem = {
  id: string
  user_id: string
  item_id: string
  institution_name: string
  institution_logo: string | null
  status: string
  last_synced_at: string | null
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
