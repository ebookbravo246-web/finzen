import { createClient } from '@supabase/supabase-js'
import { getAccounts, getTransactions } from '@/lib/pluggy'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const { event, itemId } = body

  if (!['ITEM_UPDATED', 'TRANSACTIONS_UPDATED'].includes(event)) {
    return NextResponse.json({ ok: true })
  }

  const { data: pluggyItem } = await supabaseAdmin
    .from('pluggy_items')
    .select()
    .eq('item_id', itemId)
    .single()

  if (!pluggyItem) return NextResponse.json({ ok: true })

  const accounts = await getAccounts(itemId).catch(() => [])

  const to   = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  for (const acc of accounts) {
    await supabaseAdmin
      .from('accounts')
      .update({ balance: acc.balance })
      .eq('pluggy_account_id', acc.id)

    const txs = await getTransactions(acc.id, from, to).catch(() => [])
    for (const tx of txs) {
      await supabaseAdmin.from('transactions').upsert({
        user_id:               pluggyItem.user_id,
        name:                  tx.description || 'Transação',
        amount:                Math.abs(tx.amount),
        category:              'Outros',
        date:                  tx.date.split('T')[0],
        type:                  tx.amount < 0 ? 'expense' : 'income',
        pluggy_transaction_id: tx.id,
      }, { onConflict: 'pluggy_transaction_id' })
    }
  }

  await supabaseAdmin
    .from('pluggy_items')
    .update({ last_synced_at: new Date().toISOString(), status: 'UPDATED' })
    .eq('item_id', itemId)

  return NextResponse.json({ ok: true })
}
