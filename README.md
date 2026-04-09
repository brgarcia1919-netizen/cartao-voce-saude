# Gestao de Cartao Voce Saude

Sistema web para gestao de cartao de descontos com:
- Dashboard com indicadores atualizados
- Cadastro e acompanhamento de beneficiarios
- Controle de renovacoes mensais
- Modulo financeiro com pagamentos e inadimplencia

## Stack

- Frontend: Next.js 16 + TypeScript + Tailwind CSS 4
- Backend/DB/Auth: Supabase
- Deploy: Vercel

## Requisitos

- Node.js 20+
- Conta no Supabase
- (Opcional, recomendado) acesso a connection string Postgres do Supabase para automacao de schema/seed

## Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Obrigatorias (aplicacao):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Opcionais (automacao de banco):
- `SUPABASE_DB_URL` (ou `DATABASE_URL`)
- `SUPABASE_DB_SSL` (`true` por padrao)

## Inicializacao do banco

### Opcao A (automatica, recomendada)

Com `SUPABASE_DB_URL` preenchido:

```bash
npm run db:init
```

Esse comando aplica:
1. `supabase/schema.sql`
2. `supabase/seed.sql`

de forma idempotente (sem duplicar pagamentos/renovacoes ao repetir).

### Opcao B (manual no SQL Editor)

1. Execute `supabase/schema.sql`
2. Execute `supabase/seed.sql`

## Rodando local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Scripts uteis

- `npm run dev` - desenvolvimento
- `npm run build` - build de producao
- `npm run typecheck` - validacao TypeScript
- `npm run db:init` - aplica schema + seed no Postgres

## Usuarios de teste

No Supabase, em **Authentication > Users**, crie:
- `admin@teste.com`
- `operador@teste.com`

O trigger de `schema.sql` cria o profile automaticamente.
Para promover admin:

```sql
UPDATE profiles
SET perfil = 'admin', nome = 'Administrador'
WHERE user_id = '<ID_DO_USUARIO>';
```

## Execucao automatica no Claude (prompt pronto)

Se quiser pedir para outro agente executar tudo sem pausas, use este prompt:

```text
Voce esta no repositorio do projeto Cartao Voce Saude.
Execute do inicio ao fim sem interromper:
1) npm install
2) validar .env.local e avisar variaveis faltantes
3) se existir SUPABASE_DB_URL, rodar npm run db:init
4) rodar npm run typecheck
5) rodar npm run build
6) se tudo estiver ok, rodar npm run dev
Se houver erro, corrija o codigo e continue ate concluir com sucesso.
```
