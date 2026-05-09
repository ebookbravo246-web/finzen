-- Habilita UUID
create extension if not exists "uuid-ossp";

-- Tabela de transações
create table if not exists transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  amount      numeric(12, 2) not null,
  category    text not null,
  date        date not null,
  type        text not null check (type in ('income', 'expense')),
  created_at  timestamptz default now()
);

-- Tabela de metas
create table if not exists goals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  icon        text default '🎯',
  current     numeric(12, 2) default 0,
  target      numeric(12, 2) not null,
  deadline    date,
  created_at  timestamptz default now()
);

-- Tabela de orçamentos
create table if not exists budgets (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  category     text not null,
  limit_amount numeric(12, 2) not null,
  spent        numeric(12, 2) default 0,
  month        text not null, -- formato: '2025-05'
  created_at   timestamptz default now(),
  unique (user_id, category, month)
);

-- Row Level Security: cada usuário vê só os próprios dados
alter table transactions enable row level security;
alter table goals enable row level security;
alter table budgets enable row level security;

create policy "transactions: own rows" on transactions
  using (auth.uid() = user_id);

create policy "goals: own rows" on goals
  using (auth.uid() = user_id);

create policy "budgets: own rows" on budgets
  using (auth.uid() = user_id);
