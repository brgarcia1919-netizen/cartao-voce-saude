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
- `npm run db:init` - aplica schema e seed
