-- ============================================
-- Seed: Dados fictícios para teste
-- Execute após o schema.sql
-- ============================================

-- Planos
INSERT INTO planos (id, nome, valor_mensal) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'Básico', 49.90),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'Padrão', 89.90),
  ('a1b2c3d4-0001-0001-0001-000000000003', 'Premium', 149.90)
ON CONFLICT DO NOTHING;

-- Beneficiários
INSERT INTO beneficiarios (id, nome, cpf, telefone, email, endereco, data_nascimento, status, data_inicio, data_vencimento, plano_id, created_at) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'Maria Silva Santos', '12345678901', '11987654321', 'maria.silva@email.com', 'Rua das Flores, 123 - São Paulo/SP', '1990-05-15', 'ativo', '2025-01-10', '2026-07-10', 'a1b2c3d4-0001-0001-0001-000000000002', '2025-01-10'),
  ('b1b2c3d4-0001-0001-0001-000000000002', 'João Pedro Oliveira', '23456789012', '11976543210', 'joao.pedro@email.com', 'Av. Paulista, 456 - São Paulo/SP', '1985-08-20', 'ativo', '2025-02-01', '2026-08-01', 'a1b2c3d4-0001-0001-0001-000000000003', '2025-02-01'),
  ('b1b2c3d4-0001-0001-0001-000000000003', 'Ana Beatriz Costa', '34567890123', '21987654321', 'ana.costa@email.com', 'Rua Copacabana, 789 - Rio de Janeiro/RJ', '1995-03-10', 'ativo', '2025-03-15', '2026-04-15', 'a1b2c3d4-0001-0001-0001-000000000001', '2025-03-15'),
  ('b1b2c3d4-0001-0001-0001-000000000004', 'Carlos Eduardo Lima', '45678901234', '31987654321', 'carlos.lima@email.com', 'Rua Savassi, 321 - Belo Horizonte/MG', '1988-11-25', 'suspenso', '2025-01-20', '2026-04-20', 'a1b2c3d4-0001-0001-0001-000000000002', '2025-01-20'),
  ('b1b2c3d4-0001-0001-0001-000000000005', 'Fernanda Rodrigues', '56789012345', '41987654321', 'fernanda.rod@email.com', 'Rua XV de Novembro, 654 - Curitiba/PR', '1992-07-08', 'ativo', '2025-04-01', '2026-10-01', 'a1b2c3d4-0001-0001-0001-000000000003', '2025-04-01'),
  ('b1b2c3d4-0001-0001-0001-000000000006', 'Ricardo Souza Neto', '67890123456', '51987654321', 'ricardo.souza@email.com', 'Av. Ipiranga, 987 - Porto Alegre/RS', '1980-01-30', 'inativo', '2024-06-01', '2025-06-01', 'a1b2c3d4-0001-0001-0001-000000000001', '2024-06-01'),
  ('b1b2c3d4-0001-0001-0001-000000000007', 'Patrícia Mendes', '78901234567', '61987654321', 'patricia.mendes@email.com', 'SQS 308, Bloco A - Brasília/DF', '1993-09-12', 'ativo', '2025-02-15', '2026-05-15', 'a1b2c3d4-0001-0001-0001-000000000002', '2025-02-15'),
  ('b1b2c3d4-0001-0001-0001-000000000008', 'Lucas Gabriel Ferreira', '89012345678', '71987654321', 'lucas.ferreira@email.com', 'Rua Chile, 111 - Salvador/BA', '1998-04-22', 'ativo', '2025-05-01', '2026-11-01', 'a1b2c3d4-0001-0001-0001-000000000001', '2025-05-01'),
  ('b1b2c3d4-0001-0001-0001-000000000009', 'Juliana Almeida', '90123456789', '81987654321', 'juliana.almeida@email.com', 'Av. Boa Viagem, 222 - Recife/PE', '1991-12-05', 'ativo', '2025-03-01', '2026-04-01', 'a1b2c3d4-0001-0001-0001-000000000003', '2025-03-01'),
  ('b1b2c3d4-0001-0001-0001-000000000010', 'Roberto Carlos Dias', '01234567890', '85987654321', 'roberto.dias@email.com', 'Rua José Avelino, 333 - Fortaleza/CE', '1987-06-18', 'ativo', '2025-01-05', '2026-07-05', 'a1b2c3d4-0001-0001-0001-000000000002', '2025-01-05')
ON CONFLICT DO NOTHING;

-- Renovações (mês atual e próximo)
INSERT INTO renovacoes (beneficiario_id, mes_referencia, status, data_renovacao) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', '2026-04', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000002', '2026-04', 'renovado', '2026-04-02'),
  ('b1b2c3d4-0001-0001-0001-000000000003', '2026-04', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000005', '2026-04', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000007', '2026-04', 'renovado', '2026-04-01'),
  ('b1b2c3d4-0001-0001-0001-000000000008', '2026-04', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000009', '2026-04', 'cancelado', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000010', '2026-04', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000001', '2026-05', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000002', '2026-05', 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000003', '2026-05', 'pendente', NULL)
ON CONFLICT (beneficiario_id, mes_referencia) DO UPDATE
SET
  status = EXCLUDED.status,
  data_renovacao = EXCLUDED.data_renovacao;

-- Pagamentos (últimos 3 meses)
INSERT INTO pagamentos (beneficiario_id, mes_referencia, valor, status, data_pagamento) VALUES
  -- Fev/2026
  ('b1b2c3d4-0001-0001-0001-000000000001', '2026-02', 89.90, 'pago', '2026-02-10'),
  ('b1b2c3d4-0001-0001-0001-000000000002', '2026-02', 149.90, 'pago', '2026-02-05'),
  ('b1b2c3d4-0001-0001-0001-000000000003', '2026-02', 49.90, 'pago', '2026-02-15'),
  ('b1b2c3d4-0001-0001-0001-000000000005', '2026-02', 149.90, 'pago', '2026-02-03'),
  ('b1b2c3d4-0001-0001-0001-000000000007', '2026-02', 89.90, 'pago', '2026-02-15'),
  ('b1b2c3d4-0001-0001-0001-000000000008', '2026-02', 49.90, 'pago', '2026-02-20'),
  ('b1b2c3d4-0001-0001-0001-000000000010', '2026-02', 89.90, 'pago', '2026-02-08'),
  -- Mar/2026
  ('b1b2c3d4-0001-0001-0001-000000000001', '2026-03', 89.90, 'pago', '2026-03-10'),
  ('b1b2c3d4-0001-0001-0001-000000000002', '2026-03', 149.90, 'pago', '2026-03-02'),
  ('b1b2c3d4-0001-0001-0001-000000000003', '2026-03', 49.90, 'pago', '2026-03-15'),
  ('b1b2c3d4-0001-0001-0001-000000000005', '2026-03', 149.90, 'pago', '2026-03-04'),
  ('b1b2c3d4-0001-0001-0001-000000000007', '2026-03', 89.90, 'pago', '2026-03-15'),
  ('b1b2c3d4-0001-0001-0001-000000000008', '2026-03', 49.90, 'em_atraso', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000009', '2026-03', 149.90, 'pago', '2026-03-01'),
  ('b1b2c3d4-0001-0001-0001-000000000010', '2026-03', 89.90, 'pago', '2026-03-08'),
  -- Abr/2026 (mês atual)
  ('b1b2c3d4-0001-0001-0001-000000000001', '2026-04', 89.90, 'pago', '2026-04-05'),
  ('b1b2c3d4-0001-0001-0001-000000000002', '2026-04', 149.90, 'pago', '2026-04-02'),
  ('b1b2c3d4-0001-0001-0001-000000000003', '2026-04', 49.90, 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000005', '2026-04', 149.90, 'pendente', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000007', '2026-04', 89.90, 'pago', '2026-04-01'),
  ('b1b2c3d4-0001-0001-0001-000000000008', '2026-04', 49.90, 'em_atraso', NULL),
  ('b1b2c3d4-0001-0001-0001-000000000010', '2026-04', 89.90, 'pendente', NULL)
ON CONFLICT (beneficiario_id, mes_referencia) DO UPDATE
SET
  valor = EXCLUDED.valor,
  status = EXCLUDED.status,
  data_pagamento = EXCLUDED.data_pagamento;
