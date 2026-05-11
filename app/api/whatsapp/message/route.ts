// Endpoint para o n8n chamar — recebe a mensagem e retorna a resposta da IA
// O n8n é responsável por enviar a resposta de volta via Evolution API
import { createClient } from '@supabase/supabase-js'
import { processWhatsAppMessage } from '@/lib/whatsapp-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const apiKey = request.headers.get('x-api-key')
  if (apiKey !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone, message } = await request.json()
  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message are required' }, { status: 400 })
  }

  const { data: record } = await supabaseAdmin
    .from('whatsapp_numbers')
    .select('user_id')
    .eq('phone', phone)
    .single()

  if (!record) {
    return NextResponse.json({
      reply: '👋 Seu número não está cadastrado no FinZen. Acesse o app e vincule seu WhatsApp nas configurações.',
      registered: false,
    })
  }

  const reply = await processWhatsAppMessage(record.user_id, message)
  return NextResponse.json({ reply, registered: true })
}
