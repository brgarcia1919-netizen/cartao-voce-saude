export type PerfilUsuario = "admin" | "operador";
export type StatusBeneficiario = "ativo" | "inativo" | "suspenso";
export type StatusRenovacao = "pendente" | "renovado" | "cancelado";
export type StatusPagamento = "pago" | "pendente" | "em_atraso";

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  perfil: PerfilUsuario;
}

export interface Beneficiario {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  data_nascimento: string;
  status: StatusBeneficiario;
  data_inicio: string;
  data_vencimento: string;
  plano_id: string;
  created_at: string;
  planos?: Plano;
}

export interface Plano {
  id: string;
  nome: string;
  valor_mensal: number;
}

export interface Renovacao {
  id: string;
  beneficiario_id: string;
  mes_referencia: string;
  status: StatusRenovacao;
  data_renovacao: string | null;
  beneficiarios?: Beneficiario;
}

export interface Pagamento {
  id: string;
  beneficiario_id: string;
  mes_referencia: string;
  valor: number;
  status: StatusPagamento;
  data_pagamento: string | null;
  beneficiarios?: Beneficiario;
}
