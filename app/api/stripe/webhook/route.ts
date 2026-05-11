import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription'
import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import type { Plan } from '@/lib/stripe'

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRO_PRICE_ID!]:     'pro',
  [process.env.STRIPE_FAMILIA_PRICE_ID!]: 'familia',
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return (customer as Stripe.Customer).metadata?.userId ?? null
}

function getPlanFromSubscription(sub: Stripe.Subscription): Plan {
  const priceId = sub.items.data[0]?.price.id
  return PRICE_TO_PLAN[priceId] ?? 'free'
}

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.userId
      if (!userId) break

      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      await upsertSubscription(userId, {
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: sub.id,
        plan:                   getPlanFromSubscription(sub),
        status:                 sub.status,
        current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end:   sub.cancel_at_period_end,
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(sub.customer as string)
      if (!userId) break

      await upsertSubscription(userId, {
        stripe_subscription_id: sub.id,
        plan:                   getPlanFromSubscription(sub),
        status:                 sub.status,
        current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end:   sub.cancel_at_period_end,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(sub.customer as string)
      if (!userId) break

      await upsertSubscription(userId, {
        plan:                   'free',
        status:                 'canceled',
        stripe_subscription_id: sub.id,
        current_period_end:     null,
        cancel_at_period_end:   false,
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
