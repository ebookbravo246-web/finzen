import { stripe, PLANS, type Plan } from '@/lib/stripe'
import { getUserSubscription, upsertSubscription } from '@/lib/subscription'
import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json() as { plan: Plan }
  if (!plan || plan === 'free') return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const planConfig = PLANS[plan]
  if (!planConfig.priceId) return NextResponse.json({ error: 'No price configured' }, { status: 400 })

  const subscription = await getUserSubscription(user.id)

  // Reutiliza o customer Stripe se já existir
  let customerId = subscription.stripe_customer_id ?? undefined
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await upsertSubscription(user.id, { stripe_customer_id: customerId })
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? `https://${request.headers.get('host')}`

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${baseUrl}/dashboard/configuracoes?success=true`,
    cancel_url:  `${baseUrl}/dashboard/configuracoes?canceled=true`,
    metadata: { userId: user.id, plan },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })

  return NextResponse.json({ url: session.url })
}
