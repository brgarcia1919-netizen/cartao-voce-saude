# Cartao Voce Saude - Especificacao Completa para Reconstrucao

## INSTRUCOES PARA O CURSOR
Reconstrua este projeto Next.js do zero seguindo EXATAMENTE esta especificacao.
Use Next.js 15 App Router, TypeScript, Tailwind CSS v4 e Supabase JS v2.
Todas as paginas sao "use client". Nao use Server Components para dados dinamicos.
Interface 100% em portugues brasileiro.

---

## 1. STACK E DEPENDENCIAS

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.49.0",
    "recharts": "^2.15.0",
    "lucide-react": "^0.460.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

IMPORTANTE: NAO use @supabase/ssr. Use apenas @supabase/supabase-js diretamente.
Isso evita problemas de lock conflict e cookies que causaram bugs na versao anterior.

---

## 2. VARIAVEIS DE AMBIENTE

Arquivo: `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://kxawjkqgbbwangaqqqfw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_s8zYpPfsqFZHbpnLQGVmpQ_KP3mMPS1
```

Arquivo: `.env.example`
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

---

## 3. BANCO DE DADOS SUPABASE - SCHEMA REAL

As tabelas JA EXISTEM no Supabase com esta estrutura exata. NAO altere os tipos.

### Tabela: planos
```sql
CREATE TABLE planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_mensal NUMERIC(10,2) NOT NULL
);
```
Dados existentes: Basico (R$49.90), Padrao (R$89.90), Premium (R$149.90)

### Tabela: profiles
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'operador')) DEFAULT 'operador'
);
```

### Tabela: beneficiarios
```sql
CREATE TABLE beneficiarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  telefone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  data_nascimento DATE,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'inativo', 'suspenso')) DEFAULT 'ativo',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  plano_id UUID REFERENCES planos(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: renovacoes
```sql
CREATE TABLE renovacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiario_id UUID REFERENCES beneficiarios(id) ON DELETE CASCADE NOT NULL,
  mes_referencia TEXT NOT NULL,  -- formato YYYY-MM (ex: "2026-04")
  status TEXT NOT NULL CHECK (status IN ('pendente', 'renovado', 'cancelado')) DEFAULT 'pendente',
  data_renovacao DATE
);
```

### Tabela: pagamentos
```sql
CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiario_id UUID REFERENCES beneficiarios(id) ON DELETE CASCADE NOT NULL,
  mes_referencia TEXT NOT NULL,  -- formato YYYY-MM (ex: "2026-04")
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pago', 'pendente', 'em_atraso')) DEFAULT 'pendente',
  data_pagamento DATE
);
```

### RLS (Row Level Security)
Todas as tabelas tem RLS ativado. Politicas existentes:
- SELECT: usuarios autenticados podem ler todas as tabelas
- INSERT: usuarios autenticados podem inserir em todas as tabelas
- UPDATE: usuarios autenticados podem atualizar todas as tabelas
- profiles: INSERT/UPDATE restrito ao proprio user_id

### Trigger existente
Ao criar usuario no Supabase Auth, um profile e criado automaticamente com perfil "operador".

---

## 4. CLIENTE SUPABASE - SINGLETON SIMPLES

Arquivo: `src/lib/supabase.ts`
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Use `import { supabase } from "@/lib/supabase"` em TODOS os componentes.
NAO crie multiplas instancias. NAO use createBrowserClient.

---

## 5. TIPOS TYPESCRIPT

Arquivo: `src/lib/types.ts`
```typescript
export interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
}

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  perfil: "admin" | "operador";
}

export interface Beneficiario {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  data_nascimento: string | null;
  status: "ativo" | "inativo" | "suspenso";
  data_inicio: string;
  data_vencimento: string;
  plano_id: string | null;
  created_at: string;
  planos?: Plano | null;
}

export interface Renovacao {
  id: string;
  beneficiario_id: string;
  mes_referencia: string;
  status: "pendente" | "renovado" | "cancelado";
  data_renovacao: string | null;
  beneficiarios?: Beneficiario;
}

export interface Pagamento {
  id: string;
  beneficiario_id: string;
  mes_referencia: string;
  valor: number;
  status: "pago" | "pendente" | "em_atraso";
  data_pagamento: string | null;
  beneficiarios?: Beneficiario;
}
```

---

## 6. UTILITARIOS

Arquivo: `src/lib/utils.ts`
```typescript
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function getMesAtual(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getProximoMes(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

export function getMesLabel(mesKey: string): string {
  const [y, m] = mesKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// Gerar CSV a partir de array de objetos
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

## 7. CONTEXTO DE AUTENTICACAO

Arquivo: `src/lib/auth-context.tsx`

Comportamento:
- Usa `supabase.auth.onAuthStateChange()` para reagir a mudancas de sessao
- NAO usa `getSession()` (causa lock conflict)
- Carrega o profile do usuario da tabela `profiles`
- Expoe: user, profile, loading, isAdmin, signOut
- Fallback timeout de 5 segundos se o auth nao resolver

```typescript
"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", currentUser.id)
            .single();
          setProfile(data as Profile | null);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Fallback: se onAuthStateChange nao disparar em 5s
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: profile?.perfil === "admin", signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 8. ESTRUTURA DE PASTAS

```
src/
  app/
    layout.tsx              -- Root layout (html, body, fonte)
    page.tsx                -- Redirect para /dashboard
    login/
      page.tsx              -- Tela de login
    (app)/
      layout.tsx            -- Layout autenticado (AuthProvider + Sidebar)
      dashboard/
        page.tsx            -- Dashboard com cards, graficos, tabela
      beneficiarios/
        page.tsx            -- Lista de beneficiarios com filtros
        [id]/
          page.tsx          -- Detalhe/edicao do beneficiario
        novo/
          page.tsx          -- Cadastro de novo beneficiario
      renovacoes/
        page.tsx            -- Acompanhamento de renovacoes
      financeiro/
        page.tsx            -- Gestao financeira
  components/
    Sidebar.tsx             -- Barra lateral de navegacao
    ui/
      Card.tsx              -- Card wrapper
      Badge.tsx             -- Badge de status colorido
      Toast.tsx             -- Sistema de notificacoes toast
  lib/
    supabase.ts             -- Cliente Supabase singleton
    types.ts                -- Interfaces TypeScript
    utils.ts                -- Funcoes utilitarias
    auth-context.tsx        -- Contexto de autenticacao
```

---

## 9. PAGINAS E COMPONENTES

### 9.1 Root Layout (`src/app/layout.tsx`)
- HTML com lang="pt-BR"
- Fonte Inter do Google Fonts
- CSS global com variaveis de tema claro/escuro
- Meta tags basicas

### 9.2 Login (`src/app/login/page.tsx`)
- Formulario centralizado com email e senha
- Usa `supabase.auth.signInWithPassword()`
- Apos login: `window.location.href = "/dashboard"`
- Mostra erro "E-mail ou senha invalidos" se falhar
- Se ja estiver logado, redireciona para /dashboard

### 9.3 Layout Autenticado (`src/app/(app)/layout.tsx`)
- Envolve children com `<AuthProvider>`
- Componente `<AppShell>` que:
  - Mostra loading spinner enquanto auth carrega
  - Redireciona para /login se nao autenticado
  - Renderiza Sidebar + main content se autenticado

### 9.4 Sidebar (`src/components/Sidebar.tsx`)
- Fixa na esquerda, 256px de largura (hidden no mobile, toggle com botao)
- Logo "Cartao Beneficios" no topo
- Mostra perfil do usuario (nome e "Admin" ou "Operador")
- Links de navegacao com icones (lucide-react):
  - Dashboard (LayoutDashboard)
  - Beneficiarios (Users)
  - Renovacoes (RefreshCw)
  - Financeiro (DollarSign) -- so aparece para Admin
- Botao "Modo escuro" que alterna tema
- Botao "Sair" em vermelho
- Link ativo destacado com fundo azul claro
- No mobile: botao hamburger no topo que abre/fecha sidebar como overlay

### 9.5 Dashboard (`src/app/(app)/dashboard/page.tsx`)

#### Cards de resumo (grid 4 colunas):
```
Query 1: SELECT count(*) FROM beneficiarios WHERE status = 'ativo'
  -> Card "Beneficiarios Ativos" (icone Users, azul)

Query 2: SELECT count(*) FROM renovacoes WHERE status = 'pendente'
  -> Card "Renovacoes Pendentes" (icone RefreshCw, amarelo)

Query 3: SELECT valor FROM pagamentos WHERE mes_referencia = '2026-04' AND status = 'pago'
  -> Soma dos valores -> Card "Receita do Mes" (icone DollarSign, verde)

Query 4: SELECT count(*) FROM pagamentos WHERE status = 'em_atraso'
  -> Card "Inadimplentes" (icone AlertTriangle, vermelho)
```

#### Grafico 1 - Evolucao de Beneficiarios (ultimos 6 meses):
Para cada mes dos ultimos 6:
```
SELECT count(*) FROM beneficiarios
WHERE data_inicio <= 'YYYY-MM-ultimo-dia'
AND data_vencimento >= 'YYYY-MM-01'
```
Renderizar com recharts BarChart.

#### Grafico 2 - Receita Mensal (ultimos 6 meses):
Para cada mes dos ultimos 6:
```
SELECT valor FROM pagamentos WHERE mes_referencia = 'YYYY-MM' AND status = 'pago'
```
Somar valores. Renderizar com recharts LineChart.

#### Tabela - Ultimos Beneficiarios:
```
SELECT *, planos(*) FROM beneficiarios ORDER BY created_at DESC LIMIT 5
```
Colunas: Nome, CPF (formatado), Plano, Status (badge colorido), Cadastro (data formatada)

IMPORTANTE: Todas as queries devem rodar em paralelo com Promise.all.
Se uma query falhar, as outras devem continuar funcionando.
Cada resultado deve ter tratamento: `result.data || []` e `result.count || 0`.

### 9.6 Beneficiarios - Lista (`src/app/(app)/beneficiarios/page.tsx`)

#### Filtros (barra superior):
- Input de busca por nome ou CPF
- Select de status: Todos, Ativo, Inativo, Suspenso
- Select de mes de vencimento: Todos, Jan-Dez do ano atual
- Botao "Exportar CSV"
- Botao "Novo Beneficiario" (link para /beneficiarios/novo)

#### Query principal:
```
SELECT *, planos(*) FROM beneficiarios ORDER BY nome ASC
```
Filtrar no frontend conforme os filtros selecionados.

#### Tabela:
Colunas: Nome, CPF, Telefone, Plano, Status (badge), Vencimento, Acoes
Acoes: botao "Ver" que navega para /beneficiarios/[id]

#### Exportar CSV:
Gera CSV com todos os beneficiarios filtrados: nome, cpf, telefone, email, endereco, status, plano, vencimento.

### 9.7 Beneficiarios - Novo (`src/app/(app)/beneficiarios/novo/page.tsx`)

Formulario com os campos:
- Nome completo (text, obrigatorio)
- CPF (text, obrigatorio, mascara XXX.XXX.XXX-XX)
- Telefone (text, mascara (XX) XXXXX-XXXX)
- E-mail (email)
- Endereco (text)
- Data de nascimento (date)
- Plano (select carregado da tabela planos)
- Data de inicio (date, default hoje)
- Data de vencimento (date, obrigatorio)

```
INSERT INTO beneficiarios (nome, cpf, telefone, email, endereco, data_nascimento, plano_id, data_inicio, data_vencimento)
VALUES (...)
```

Apos salvar: toast de sucesso + redirecionar para /beneficiarios

### 9.8 Beneficiarios - Detalhe (`src/app/(app)/beneficiarios/[id]/page.tsx`)

#### Dados do beneficiario:
```
SELECT *, planos(*) FROM beneficiarios WHERE id = :id
```

#### Tabs ou secoes:
1. **Dados Pessoais** - formulario editavel com os mesmos campos do cadastro
   - Botao "Salvar Alteracoes" -> UPDATE beneficiarios SET ... WHERE id = :id
   - Select de status: ativo, inativo, suspenso (so Admin pode alterar)

2. **Historico de Pagamentos**
   ```
   SELECT * FROM pagamentos WHERE beneficiario_id = :id ORDER BY mes_referencia DESC
   ```
   Tabela: Mes, Valor, Status (badge), Data Pagamento

3. **Historico de Renovacoes**
   ```
   SELECT * FROM renovacoes WHERE beneficiario_id = :id ORDER BY mes_referencia DESC
   ```
   Tabela: Mes, Status (badge), Data Renovacao

### 9.9 Renovacoes (`src/app/(app)/renovacoes/page.tsx`)

#### Filtros:
- Select de mes/ano (default: mes atual)
- Select de status: Todos, Pendente, Renovado, Cancelado

#### Query:
```
SELECT *, beneficiarios(nome, cpf, plano_id, planos(*))
FROM renovacoes
WHERE mes_referencia = 'YYYY-MM'
ORDER BY status ASC
```

Se nao houver renovacoes para o mes, gerar automaticamente para beneficiarios ativos com vencimento no mes:
```
SELECT * FROM beneficiarios WHERE status = 'ativo'
AND EXTRACT(MONTH FROM data_vencimento) = :mes
AND EXTRACT(YEAR FROM data_vencimento) = :ano
```
Para cada um, inserir renovacao pendente se nao existir.

#### Tabela:
Colunas: Beneficiario (nome), CPF, Plano, Status (badge), Vencimento, Acoes
- Alerta visual (icone vermelho) se vencimento em 7 dias ou menos
- Acoes:
  - "Marcar como Renovado" -> UPDATE renovacoes SET status = 'renovado', data_renovacao = NOW()
  - "Cancelar" -> UPDATE renovacoes SET status = 'cancelado'

### 9.10 Financeiro (`src/app/(app)/financeiro/page.tsx`)
IMPORTANTE: So acessivel por Admin. Operador nao ve este item na sidebar.

#### Filtros:
- Select de mes/ano (default: mes atual)

#### Cards de resumo:
- Receita Esperada: soma de valor_mensal dos planos dos beneficiarios ativos
- Receita Recebida: soma de pagamentos com status 'pago' no mes
- Pendente: soma de pagamentos com status 'pendente' no mes
- Em Atraso: soma de pagamentos com status 'em_atraso' no mes

#### Botao "Gerar Pagamentos do Mes"
Para cada beneficiario ativo, criar pagamento pendente se nao existir para o mes:
```
INSERT INTO pagamentos (beneficiario_id, mes_referencia, valor, status)
SELECT b.id, 'YYYY-MM', p.valor_mensal, 'pendente'
FROM beneficiarios b
JOIN planos p ON b.plano_id = p.id
WHERE b.status = 'ativo'
AND NOT EXISTS (
  SELECT 1 FROM pagamentos pg
  WHERE pg.beneficiario_id = b.id AND pg.mes_referencia = 'YYYY-MM'
)
```

#### Tabela de pagamentos:
```
SELECT *, beneficiarios(nome, cpf)
FROM pagamentos
WHERE mes_referencia = 'YYYY-MM'
ORDER BY status ASC, beneficiarios(nome) ASC
```

Colunas: Beneficiario, CPF, Valor, Status (badge), Data Pagamento, Acoes
Acoes:
- Se pendente/em_atraso: botao "Marcar como Pago" -> UPDATE pagamentos SET status = 'pago', data_pagamento = CURRENT_DATE
- Se pendente: botao "Marcar Em Atraso" -> UPDATE pagamentos SET status = 'em_atraso'

---

## 10. COMPONENTES UI

### Card (`src/components/ui/Card.tsx`)
```typescript
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 ${className || ""}`}>
      {children}
    </div>
  );
}
```

### Badge (`src/components/ui/Badge.tsx`)
Recebe `status` string e renderiza badge colorido:
- ativo / pago / renovado -> verde (bg-green-100 text-green-700)
- pendente -> amarelo (bg-yellow-100 text-yellow-700)
- inativo / cancelado -> cinza (bg-gray-100 text-gray-700)
- suspenso / em_atraso -> vermelho (bg-red-100 text-red-700)

### Toast (`src/components/ui/Toast.tsx`)
Sistema simples de toast notifications:
- Contexto com funcoes: `toast.success("msg")`, `toast.error("msg")`
- Aparece no canto superior direito
- Auto-dismiss apos 3 segundos
- Verde para sucesso, vermelho para erro

---

## 11. TEMA CLARO/ESCURO

Usar classe `dark` no `<html>` e salvar preferencia no localStorage.
Tailwind dark mode: `darkMode: "class"` no tailwind config.

Cores base:
- Claro: bg-gray-50, text-gray-900, cards bg-white
- Escuro: bg-gray-900, text-gray-100, cards bg-gray-800
- Primaria: blue-600
- Sucesso: green-600
- Erro: red-600
- Alerta: yellow-600

---

## 12. RESPONSIVIDADE

- Sidebar: fixa no desktop (md+), overlay toggle no mobile
- Cards do dashboard: 1 coluna mobile, 2 tablet, 4 desktop
- Tabelas: overflow-x-auto para scroll horizontal no mobile
- Formularios: full width no mobile
- Graficos: ResponsiveContainer do recharts com width 100%

---

## 13. FEEDBACK VISUAL

Toda acao deve ter feedback:
- Botoes: `disabled` + texto "Salvando...", "Carregando..." durante operacoes
- Apos INSERT/UPDATE: toast de sucesso
- Se erro: toast de erro com mensagem
- Loading: spinner animado (animate-spin) centralizado
- Tabelas vazias: mensagem "Nenhum registro encontrado"

---

## 14. PERMISSOES

- **Admin**: acesso total (dashboard, beneficiarios, renovacoes, financeiro)
- **Operador**: dashboard (somente leitura), beneficiarios (cadastro e visualizacao), renovacoes (visualizacao e marcar renovacao)
- Operador NAO ve o menu "Financeiro" na sidebar
- Operador NAO pode alterar status do beneficiario
- Operador NAO pode excluir registros

---

## 15. QUERIES SUPABASE - REFERENCIA RAPIDA

```typescript
// SELECT com join
const { data, error } = await supabase
  .from("beneficiarios")
  .select("*, planos(*)")
  .eq("status", "ativo")
  .order("nome", { ascending: true });

// SELECT com count
const { count, error } = await supabase
  .from("beneficiarios")
  .select("*", { count: "exact", head: true })
  .eq("status", "ativo");

// INSERT
const { data, error } = await supabase
  .from("beneficiarios")
  .insert({ nome, cpf, telefone, email, endereco, data_nascimento, plano_id, data_inicio, data_vencimento })
  .select()
  .single();

// UPDATE
const { error } = await supabase
  .from("beneficiarios")
  .update({ nome, telefone, email, status })
  .eq("id", id);

// DELETE (se necessario)
const { error } = await supabase
  .from("beneficiarios")
  .delete()
  .eq("id", id);
```

---

## 16. ERROS COMUNS A EVITAR

1. NAO use `@supabase/ssr` - causa lock conflicts. Use `@supabase/supabase-js` direto.
2. NAO crie multiplas instancias do cliente Supabase. Use singleton.
3. NAO use `getSession()` no auth context - use apenas `onAuthStateChange()`.
4. NAO use `as never` para contornar erros de tipo. Defina tipos corretos.
5. NAO faca queries sequenciais em loop - use `Promise.all`.
6. SEMPRE trate erros: `if (error) { toast.error(error.message); return; }`
7. SEMPRE use `|| 0` para counts e `|| []` para arrays nulos.
8. mes_referencia e TEXT no formato "YYYY-MM", NAO e DATE.
9. Valores monetarios sao NUMERIC(10,2) no banco, vem como number no JS.
10. CPF e TEXT no banco, armazene so digitos, formate na exibicao.

---

## 17. USUARIO DE TESTE

- Email: brgarcia1919@gmail.com
- Senha: 123456
- Perfil: operador (para testar como admin, alterar na tabela profiles)

---

## 18. DEPLOY VERCEL

1. Push para GitHub
2. Importar no Vercel
3. Adicionar env vars ANTES do primeiro deploy:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy automatico a cada push no main
