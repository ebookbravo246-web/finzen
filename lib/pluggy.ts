const BASE = 'https://api.pluggy.ai'

let _cache: { key: string; exp: number } | null = null

async function getApiKey(): Promise<string> {
  if (_cache && Date.now() < _cache.exp) return _cache.key

  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`Pluggy auth failed: ${res.status}`)

  const { apiKey } = await res.json()
  _cache = { key: apiKey, exp: Date.now() + 90 * 60 * 1000 }
  return apiKey
}

async function pluggyFetch(path: string, init?: RequestInit) {
  const apiKey = await getApiKey()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`Pluggy ${path} failed: ${res.status}`)
  return res.status === 204 ? null : res.json()
}

export async function createConnectToken(itemId?: string): Promise<string> {
  const body = itemId ? { itemId } : {}
  const data = await pluggyFetch('/connect_token', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return data.accessToken
}

export async function getItem(itemId: string) {
  return pluggyFetch(`/items/${itemId}`)
}

export async function getAccounts(itemId: string): Promise<PluggyAccount[]> {
  const data = await pluggyFetch(`/accounts?itemId=${itemId}`)
  return data.results ?? []
}

export async function getTransactions(
  accountId: string,
  from: string,
  to: string,
): Promise<PluggyTransaction[]> {
  const data = await pluggyFetch(
    `/transactions?accountId=${accountId}&from=${from}&to=${to}&pageSize=500`,
  )
  return data.results ?? []
}

export async function deleteItem(itemId: string) {
  return pluggyFetch(`/items/${itemId}`, { method: 'DELETE' })
}

// ── types ──────────────────────────────────────────────────────────────────
export type PluggyAccount = {
  id: string
  name: string
  type: string
  subtype: string
  number: string
  balance: number
  currencyCode: string
}

export type PluggyTransaction = {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'DEBIT' | 'CREDIT'
}
