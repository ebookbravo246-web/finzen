-- Pluggy Open Finance items (conexões bancárias)
CREATE TABLE IF NOT EXISTS pluggy_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id          text NOT NULL UNIQUE,
  institution_name text NOT NULL,
  institution_logo text,
  status           text NOT NULL DEFAULT 'UPDATED',
  last_synced_at   timestamptz,
  created_at       timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE pluggy_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pluggy items" ON pluggy_items
  FOR ALL USING (auth.uid() = user_id);

-- Colunas Pluggy na tabela accounts
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS pluggy_account_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS pluggy_item_id    text;

-- Coluna Pluggy na tabela transactions (evita duplicatas no sync)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS pluggy_transaction_id text UNIQUE;
