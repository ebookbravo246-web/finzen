-- Run in Supabase SQL Editor after 001_init.sql

create table if not exists public.investments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  type       text not null default 'Outros',
  value      numeric(12,2) not null,
  return_pct numeric(6,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.investments enable row level security;

create policy "investments: select own" on public.investments for select using (auth.uid() = user_id);
create policy "investments: insert own" on public.investments for insert with check (auth.uid() = user_id);
create policy "investments: update own" on public.investments for update using (auth.uid() = user_id);
create policy "investments: delete own" on public.investments for delete using (auth.uid() = user_id);
