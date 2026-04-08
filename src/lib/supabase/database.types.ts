export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          perfil: "admin" | "operador";
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          perfil?: "admin" | "operador";
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          perfil?: "admin" | "operador";
        };
      };
      beneficiarios: {
        Row: {
          id: string;
          nome: string;
          cpf: string;
          telefone: string;
          email: string;
          endereco: string;
          data_nascimento: string;
          status: "ativo" | "inativo" | "suspenso";
          data_inicio: string;
          data_vencimento: string;
          plano_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf: string;
          telefone: string;
          email?: string;
          endereco?: string;
          data_nascimento?: string;
          status?: "ativo" | "inativo" | "suspenso";
          data_inicio: string;
          data_vencimento: string;
          plano_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cpf?: string;
          telefone?: string;
          email?: string;
          endereco?: string;
          data_nascimento?: string;
          status?: "ativo" | "inativo" | "suspenso";
          data_inicio?: string;
          data_vencimento?: string;
          plano_id?: string;
          created_at?: string;
        };
      };
      planos: {
        Row: {
          id: string;
          nome: string;
          valor_mensal: number;
        };
        Insert: {
          id?: string;
          nome: string;
          valor_mensal: number;
        };
        Update: {
          id?: string;
          nome?: string;
          valor_mensal?: number;
        };
      };
      renovacoes: {
        Row: {
          id: string;
          beneficiario_id: string;
          mes_referencia: string;
          status: "pendente" | "renovado" | "cancelado";
          data_renovacao: string | null;
        };
        Insert: {
          id?: string;
          beneficiario_id: string;
          mes_referencia: string;
          status?: "pendente" | "renovado" | "cancelado";
          data_renovacao?: string | null;
        };
        Update: {
          id?: string;
          beneficiario_id?: string;
          mes_referencia?: string;
          status?: "pendente" | "renovado" | "cancelado";
          data_renovacao?: string | null;
        };
      };
      pagamentos: {
        Row: {
          id: string;
          beneficiario_id: string;
          mes_referencia: string;
          valor: number;
          status: "pago" | "pendente" | "em_atraso";
          data_pagamento: string | null;
        };
        Insert: {
          id?: string;
          beneficiario_id: string;
          mes_referencia: string;
          valor: number;
          status?: "pago" | "pendente" | "em_atraso";
          data_pagamento?: string | null;
        };
        Update: {
          id?: string;
          beneficiario_id?: string;
          mes_referencia?: string;
          valor?: number;
          status?: "pago" | "pendente" | "em_atraso";
          data_pagamento?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
