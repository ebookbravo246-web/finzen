import { createClient } from '@supabase/supabase-js'
import { processWhatsAppMessage } from '@/lib/whatsapp-ai'
import { sendTextMessage, sendTyping, parsePhone } from '@/lib/evolution'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  // Valida o webhook secret na query string
  const secret = request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const event = body.event
  if (event !== 'messages.upsert') return NextResponse.json({ ok: true })

  const data    = body.data
  const fromMe  = data?.key?.fromMe
  if (fromMe) return NextResponse.json({ ok: true }) // ignora mensagens enviadas pelo bot

  const remoteJid = data?.key?.remoteJid ?? ''
  if (remoteJid.includes('@g.us')) return NextResponse.json({ ok: true }) // ignora grupos

  const phone   = parsePhone(remoteJid)
  const message = data?.message?.conversation
    ?? data?.message?.extendedTextMessage?.text
    ?? ''

  if (!message.trim()) return NextResponse.json({ ok: true })

  // Busca o usuário pelo número
  const { data: record } = await supabaseAdmin
    .from('whatsapp_numbers')
    .select('user_id')
    .eq('phone', phone)
    .single()

  if (!record) {
    await sendTextMessage(phone,
      '👋 Olá! Seu número não está cadastrado no FinZen.\n\nAcesse *app.finzen.com.br* e vincule seu WhatsApp nas configurações para usar o assistente financeiro.'
    ).catch(() => null)
    return NextResponse.json({ ok: true })
  }

  // Envia indicador de digitação
  await sendTyping(phone)

  const reply = await processWhatsAppMessage(record.user_id, message)
  await sendTextMessage(phone, reply)

  return NextResponse.json({ ok: true })
}
