const BASE     = process.env.EVOLUTION_API_URL   // ex: https://evolution.seudominio.com
const API_KEY  = process.env.EVOLUTION_API_KEY
const INSTANCE = process.env.EVOLUTION_INSTANCE  // ex: finzen

async function evoFetch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY!,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Evolution API ${path} failed: ${res.status}`)
  return res.json()
}

export async function sendTextMessage(phone: string, text: string) {
  return evoFetch(`/message/sendText/${INSTANCE}`, {
    number: phone,
    text,
  })
}

export async function sendTyping(phone: string, duration = 3000) {
  return evoFetch(`/chat/sendPresence/${INSTANCE}`, {
    number: phone,
    options: { presence: 'composing', delay: duration },
  }).catch(() => null) // não crítico
}

// Normaliza o remoteJid do Evolution para só o número
export function parsePhone(remoteJid: string): string {
  return remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
}
