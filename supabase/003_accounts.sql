-- Run in Supabase SQL Editor

create table if not exists public.accounts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  type       text not null default 'Conta Corrente',
  balance    numeric(12,2) not null default 0,
  color      text not null default '#0F6E56',
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "accounts: select own" on public.accounts for select using (auth.uid() = user_id);
create policy "accounts: insert own" on public.accounts for insert with check (auth.uid() = user_id);
create policy "accounts: update own" on public.accounts for update using (auth.uid() = user_id);
create policy "accounts: delete own" on public.accounts for delete using (auth.uid() = user_id);
