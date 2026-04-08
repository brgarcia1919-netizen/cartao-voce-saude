-- ============================================
-- Schema: Gestão de Cartão de Benefícios
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela de planos
CREATE TABLE IF NOT EXISTS planos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_mensal NUMERIC(10,2) NOT NULL
);

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'operador')) DEFAULT 'operador'
);

-- Tabela de beneficiários
CREATE TABLE IF NOT EXISTS beneficiarios (
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

-- Tabela de renovações
CREATE TABLE IF NOT EXISTS renovacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiario_id UUID REFERENCES beneficiarios(id) ON DELETE CASCADE NOT NULL,
  mes_referencia TEXT NOT NULL, -- formato: YYYY-MM
  status TEXT NOT NULL CHECK (status IN ('pendente', 'renovado', 'cancelado')) DEFAULT 'pendente',
  data_renovacao DATE
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  beneficiario_id UUID REFERENCES beneficiarios(id) ON DELETE CASCADE NOT NULL,
  mes_referencia TEXT NOT NULL, -- formato: YYYY-MM
  valor NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pago', 'pendente', 'em_atraso')) DEFAULT 'pendente',
  data_pagamento DATE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_beneficiarios_status ON beneficiarios(status);
CREATE INDEX IF NOT EXISTS idx_beneficiarios_cpf ON beneficiarios(cpf);
CREATE INDEX IF NOT EXISTS idx_beneficiarios_vencimento ON beneficiarios(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_renovacoes_mes ON renovacoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_pagamentos_mes ON pagamentos(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados podem ler tudo
CREATE POLICY "Authenticated users can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read beneficiarios" ON beneficiarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read planos" ON planos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read renovacoes" ON renovacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read pagamentos" ON pagamentos FOR SELECT TO authenticated USING (true);

-- Políticas: usuários autenticados podem inserir/atualizar
CREATE POLICY "Authenticated users can insert beneficiarios" ON beneficiarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update beneficiarios" ON beneficiarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert renovacoes" ON renovacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update renovacoes" ON renovacoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pagamentos" ON pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update pagamentos" ON pagamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert planos" ON planos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update planos" ON planos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger: criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, perfil)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), COALESCE(NEW.raw_user_meta_data->>'perfil', 'operador'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
