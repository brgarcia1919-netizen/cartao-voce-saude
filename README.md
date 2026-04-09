# Cartao Voce Saude

Sistema de gestao para cartao de descontos com:
- Dashboard de indicadores
- Gestao de beneficiarios
- Controle de renovacoes
- Modulo financeiro

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Supabase JS v2 (`@supabase/supabase-js`)
- Recharts + Lucide

## Configuracao

1. Instale dependencias:

```bash
npm install
```

2. Crie `.env.local`:

```bash
cp .env.example .env.local
```

3. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## Banco de dados

As tabelas e seeds estao em:
- `supabase/schema.sql`
- `supabase/seed.sql`

Se quiser aplicar automaticamente com conexao Postgres:

```bash
npm run db:init
```

Para isso, configure tambem:
- `SUPABASE_DB_URL` (ou `DATABASE_URL`)
- `SUPABASE_DB_SSL` (opcional, default true)

## Rodando

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Scripts

- `npm run dev` - ambiente de desenvolvimento
- `npm run typecheck` - validacao TypeScript
- `npm run build` - build de producao
- `npm run smoke` - smoke test E2E (login + modulos principais)
- `npm run db:init` - aplica schema e seed

## Smoke test automatico (anti-quebra)

Este teste valida em navegador real:
- login
- dashboard
- beneficiarios
- renovacoes
- financeiro (acesso ou bloqueio esperado por perfil)

### Primeira execucao

```bash
npx playwright install chromium
```

### Rodar smoke

```bash
SMOKE_EMAIL=seu@email.com SMOKE_PASSWORD=suaSenha npm run smoke
```

Alternativa: defina `SMOKE_EMAIL` e `SMOKE_PASSWORD` no `.env.local` e rode apenas:

```bash
npm run smoke
```

Variaveis opcionais:
- `SMOKE_PORT` (padrao: `3010`)
- `SMOKE_BASE_URL` (se quiser apontar para um ambiente ja rodando)
