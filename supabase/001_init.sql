-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  amount     numeric(12,2) not null,
  category   text not null default 'Outros',
  type       text not null check (type in ('income', 'expense')),
  date       date not null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions: select own"  on public.transactions for select  using (auth.uid() = user_id);
create policy "transactions: insert own"  on public.transactions for insert  with check (auth.uid() = user_id);
create policy "transactions: update own"  on public.transactions for update  using (auth.uid() = user_id);
create policy "transactions: delete own"  on public.transactions for delete  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- GOALS
-- ─────────────────────────────────────────
create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default '🎯',
  current    numeric(12,2) not null default 0,
  target     numeric(12,2) not null,
  deadline   date,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals: select own"  on public.goals for select  using (auth.uid() = user_id);
create policy "goals: insert own"  on public.goals for insert  with check (auth.uid() = user_id);
create policy "goals: update own"  on public.goals for update  using (auth.uid() = user_id);
create policy "goals: delete own"  on public.goals for delete  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- BUDGETS
-- ─────────────────────────────────────────
create table if not exists public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null,
  limit_amount numeric(12,2) not null,
  spent        numeric(12,2) not null default 0,
  month        text not null,  -- 'YYYY-MM'
  created_at   timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table public.budgets enable row level security;

create policy "budgets: select own"  on public.budgets for select  using (auth.uid() = user_id);
create policy "budgets: insert own"  on public.budgets for insert  with check (auth.uid() = user_id);
create policy "budgets: update own"  on public.budgets for update  using (auth.uid() = user_id);
create policy "budgets: delete own"  on public.budgets for delete  using (auth.uid() = user_id);
