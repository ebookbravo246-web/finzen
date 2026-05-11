import { createClient } from '@supabase/supabase-js'
import type { Plan } from './stripe'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export type Subscription = {
  plan: Plan
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

export async function getUserSubscription(userId: string): Promise<Subscription> {
  const { data } = await getAdmin()
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .single()

  return data ?? {
    plan: 'free',
    status: 'active',
    current_period_end: null,
    cancel_at_period_end: false,
    stripe_customer_id: null,
    stripe_subscription_id: null,
  }
}

export async function upsertSubscription(
  userId: string,
  fields: Partial<Subscription> & { stripe_customer_id?: string },
) {
  await getAdmin()
    .from('subscriptions')
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}
