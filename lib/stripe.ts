import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const PLANS = {
  free: {
    name: 'Grátis',
    price: 0,
    priceId: null,
    features: ['Transações ilimitadas', 'Metas e orçamentos', 'Dashboard básico', 'IA financeira (5/dia)'],
  },
  pro: {
    name: 'Pro',
    price: 39,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ['Tudo do Free', 'Open Finance ilimitado', 'IA financeira ilimitada', 'WhatsApp ilimitado', 'Relatórios PDF', 'Histórico ilimitado'],
  },
  familia: {
    name: 'Família',
    price: 69,
    priceId: process.env.STRIPE_FAMILIA_PRICE_ID!,
    features: ['Tudo do Pro', 'Até 4 usuários', 'Visão consolidada', 'Despesas compartilhadas', 'Suporte prioritário'],
  },
} as const

export type Plan = keyof typeof PLANS
