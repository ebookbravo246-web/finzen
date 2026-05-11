import { createSupabaseRouteClient } from '@/lib/supabase-server'
import { getAccounts, getTransactions } from '@/lib/pluggy'
import { NextRequest, NextResponse } from 'next/server'

const ACCOUNT_TYPE: Record<string, string> = {
  BANK:          'Conta Corrente',
  SAVINGS:       'Poupança',
  CREDIT:        'Cartão de Crédito',
  INVESTMENT:    'Investimentos',
}

const CATEGORY_MAP: Record<string, string> = {
  'Food and Beverage':  'Alimentação',
  'Transport':          'Transporte',
  'Health and Medical': 'Saúde',
  'Housing':            'Moradia',
  'Education':          'Educação',
  'Entertainment':      'Lazer',
  'Shopping':           'Compras',
  'Salary':             'Salário',
  'Transfer':           'Transferência',
  'Financial':          'Finanças',
  'Taxes':              'Impostos',
  'Supermarket':        'Alimentação',
  'Utilities':          'Moradia',
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseRouteClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await request.json()
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const { data: pluggyItem } = await supabase
    .from('pluggy_items')
    .select()
    .eq('item_id', itemId)
    .eq('user_id', user.id)
    .single()

  if (!pluggyItem) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const accounts = await getAccounts(itemId)

  // Upsert contas
  for (const acc of accounts) {
    await supabase.from('accounts').upsert({
      user_id:           user.id,
      name:              acc.name,
      type:              ACCOUNT_TYPE[acc.subtype] ?? ACCOUNT_TYPE[acc.type] ?? 'Conta Corrente',
      balance:           acc.balance,
      color:             '#0F6E56',
      pluggy_account_id: acc.id,
      pluggy_item_id:    itemId,
    }, { onConflict: 'pluggy_account_id' })
  }

  // Upsert transações dos últimos 3 meses
  const to   = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let syncedCount = 0
  for (const acc of accounts) {
    const txs = await getTransactions(acc.id, from, to)
    for (const tx of txs) {
      const { error } = await supabase.from('transactions').upsert({
        user_id:               user.id,
        name:                  tx.description || 'Transação',
        amount:                Math.abs(tx.amount),
        category:              CATEGORY_MAP[tx.category] ?? 'Outros',
        date:                  tx.date.split('T')[0],
        type:                  tx.amount < 0 ? 'expense' : 'income',
        pluggy_transaction_id: tx.id,
      }, { onConflict: 'pluggy_transaction_id' })
      if (!error) syncedCount++
    }
  }

  await supabase
    .from('pluggy_items')
    .update({ last_synced_at: new Date().toISOString(), status: 'UPDATED' })
    .eq('item_id', itemId)

  return NextResponse.json({ synced: syncedCount, accounts: accounts.length })
}
