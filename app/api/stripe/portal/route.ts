import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/subscription'
import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await getUserSubscription(user.id)
  if (!subscription.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? `https://${request.headers.get('host')}`

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${baseUrl}/dashboard/configuracoes`,
  })

  return NextResponse.json({ url: session.url })
}
