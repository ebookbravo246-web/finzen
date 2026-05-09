# FinZen — Assistente Financeiro com IA

## O que é este projeto
SaaS financeiro pessoal similar ao Dinzo.com.br. Usuários conectam bancos via Open Finance,
controlam gastos, investimentos e metas, e conversam com IA financeira via WhatsApp e web.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Estilo**: Tailwind CSS + CSS variables (ver globals.css)
- **Banco de dados**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Pagamentos**: Stripe
- **IA**: Claude API (Anthropic)
- **Open Finance**: Pluggy (fase 2)
- **WhatsApp**: Evolution API + n8n (fase 2)

## Estrutura de pastas
```
app/
  page.tsx          → Landing page pública
  layout.tsx        → Root layout
  globals.css       → Design tokens e estilos globais
  login/page.tsx    → Login e cadastro
  dashboard/
    layout.tsx      → Layout com sidebar
    page.tsx        → Dashboard principal (visão geral)
    transacoes/     → (criar) listagem de transações
    orcamentos/     → (criar) controle de orçamentos
    metas/          → (criar) metas financeiras
    investimentos/  → (criar) carteira de investimentos
    contas/         → (criar) contas conectadas
    ia/             → (criar) chat com IA
    configuracoes/  → (criar) perfil e plano
components/
  layout/Sidebar.tsx → Sidebar de navegação
  dashboard/         → (criar) componentes do dashboard
  ui/                → (criar) componentes genéricos (Button, Input, Card...)
lib/
  supabase.ts        → (criar) client do Supabase
  claude.ts          → (criar) client da API Claude
```

## Design System
Paleta de cores definida em `app/globals.css` via CSS variables:
- `--green`: #0F6E56 (cor primária)
- `--green-light`: #1D9E75 (hover / sucesso)
- `--green-pale`: #E1F5EE (backgrounds suaves)
- `--ink`: #1a1f1c (texto principal)
- `--ink-soft`: #6b7570 (texto secundário)
- `--surface`: #f5f7f5 (background de página)
- `--danger`: #E24B4A (gastos / erros)
- Fontes: 'DM Sans' (corpo), 'Syne' (títulos via `.font-display`)

## Convenções de código
- Componentes em TypeScript (.tsx)
- 'use client' apenas onde necessário (interatividade)
- Dados mockados inline por enquanto — substituir por queries Supabase depois
- Não usar styled-components — usar Tailwind + inline styles com CSS variables
- Border radius padrão: 16px (cards grandes), 12px (cards menores), 100px (pills/botões)

## Próximas features a construir (por prioridade)
1. [ ] `lib/supabase.ts` — configurar client com variáveis de ambiente
2. [ ] `app/login/page.tsx` — conectar form ao Supabase Auth (signIn/signUp)
3. [ ] Middleware de autenticação (redirecionar /dashboard se não logado)
4. [ ] `app/dashboard/transacoes/page.tsx` — listagem com filtros
5. [ ] `app/dashboard/metas/page.tsx` — CRUD de metas
6. [ ] `lib/claude.ts` — integração Claude API para o chat
7. [ ] Stripe webhook para gerenciar planos

## Variáveis de ambiente necessárias (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Como rodar localmente
```bash
npm install
npm run dev
# abre em http://localhost:3000
```
