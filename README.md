# Gestão de Cartão de Benefícios

Sistema web para gestão de cartão de benefícios com controle de beneficiários, renovações e financeiro.

## Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS 4
- **Backend/BD:** Supabase (Auth, Database, RLS)
- **Gráficos:** Recharts
- **Ícones:** Lucide React

## Instalação

### 1. Clonar e instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Preencha as variáveis com as credenciais do seu projeto Supabase (Settings > API)

### 3. Criar tabelas no banco

1. No Supabase, vá em **SQL Editor**
2. Execute o conteúdo de `supabase/schema.sql`
3. Para dados de teste, execute `supabase/seed.sql`

### 4. Criar usuários de teste

No Supabase, vá em **Authentication > Users** e crie:

- **Admin:** admin@teste.com (ao criar, o trigger criará o profile automaticamente)
  - Depois, no SQL Editor, atualize o perfil:
    ```sql
    UPDATE profiles SET perfil = 'admin', nome = 'Administrador' WHERE user_id = '<ID_DO_USUARIO>';
    ```

- **Operador:** operador@teste.com (será criado automaticamente como "operador")

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Dashboard | Resumo mensal com gráficos de evolução e receita |
| Beneficiários | CRUD completo com busca, filtros e export CSV |
| Renovações | Acompanhamento mensal com alertas de vencimento |
| Financeiro | Registro de pagamentos e relatório receita esperada vs recebida |

## Perfis de Acesso

- **Admin:** acesso total (todos os módulos + edição + financeiro)
- **Operador:** visualização + cadastro de beneficiários (sem financeiro, sem edição)

## Estrutura de Arquivos

```
src/
├── app/
│   ├── (app)/           # Rotas autenticadas
│   │   ├── dashboard/
│   │   ├── beneficiarios/
│   │   ├── renovacoes/
│   │   └── financeiro/
│   ├── login/
│   └── layout.tsx
├── components/
│   ├── ui/             # Componentes reutilizáveis
│   ├── AppLayout.tsx
│   ├── Sidebar.tsx
│   └── ThemeProvider.tsx
└── lib/
    ├── supabase/       # Configuração Supabase
    ├── auth-context.tsx
    ├── types.ts
    └── utils.ts
supabase/
├── schema.sql          # DDL das tabelas
└── seed.sql            # Dados fictícios
```
