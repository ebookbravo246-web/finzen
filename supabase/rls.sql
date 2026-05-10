-- ============================================================
-- FinZen — Row Level Security (RLS)
-- Execute no Supabase SQL Editor:
--   https://supabase.com/dashboard → seu projeto → SQL Editor
--
-- O que isso faz:
--   - Ativa RLS em cada tabela
--   - Cria 4 políticas por tabela (SELECT / INSERT / UPDATE / DELETE)
--   - Cada política garante: usuário só acessa os próprios dados
-- ============================================================


-- ------------------------------------------------------------
-- TRANSACTIONS
-- ------------------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: select own"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions: insert own"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions: update own"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions: delete own"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- GOALS
-- ------------------------------------------------------------
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals: select own"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals: insert own"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: update own"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals: delete own"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- BUDGETS
-- ------------------------------------------------------------
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets: select own"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "budgets: insert own"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets: update own"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets: delete own"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- ACCOUNTS
-- ------------------------------------------------------------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: select own"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "accounts: insert own"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts: update own"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts: delete own"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- INVESTMENTS
-- ------------------------------------------------------------
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investments: select own"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "investments: insert own"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments: update own"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments: delete own"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);
