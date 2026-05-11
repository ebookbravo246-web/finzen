-- Mapeamento de número WhatsApp → usuário
CREATE TABLE IF NOT EXISTS whatsapp_numbers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone      text NOT NULL UNIQUE, -- formato: 5511999999999
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE whatsapp_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own whatsapp number" ON whatsapp_numbers
  FOR ALL USING (auth.uid() = user_id);

-- Histórico de conversa por usuário (WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       text NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own whatsapp messages" ON whatsapp_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS whatsapp_messages_user_created
  ON whatsapp_messages(user_id, created_at DESC);
