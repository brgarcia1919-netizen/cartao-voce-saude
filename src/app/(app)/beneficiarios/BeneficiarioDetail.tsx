"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCPF, formatPhone, formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Beneficiario, Pagamento } from "@/lib/types";

interface Props {
  id: string;
  onClose: () => void;
}

export default function BeneficiarioDetail({ id, onClose }: Props) {
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(() => Promise.all([
      supabase.from("beneficiarios").select("*, planos(*)").eq("id", id).single(),
      supabase.from("pagamentos").select("*").eq("beneficiario_id", id).order("mes_referencia", { ascending: false }),
    ])).then(([{ data: b }, { data: p }]) => {
      setBeneficiario(b as unknown as Beneficiario | null);
      setPagamentos((p || []) as unknown as Pagamento[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!beneficiario) return null;

  const fields = [
    { label: "Nome", value: beneficiario.nome },
    { label: "CPF", value: formatCPF(beneficiario.cpf) },
    { label: "Telefone", value: formatPhone(beneficiario.telefone) },
    { label: "E-mail", value: beneficiario.email || "-" },
    { label: "Endereço", value: beneficiario.endereco || "-" },
    { label: "Data de nascimento", value: beneficiario.data_nascimento ? formatDate(beneficiario.data_nascimento) : "-" },
    { label: "Plano", value: beneficiario.planos ? `${beneficiario.planos.nome} (${formatCurrency(beneficiario.planos.valor_mensal)}/mês)` : "-" },
    { label: "Data de início", value: formatDate(beneficiario.data_inicio) },
    { label: "Data de vencimento", value: formatDate(beneficiario.data_vencimento) },
    { label: "Cadastrado em", value: formatDate(beneficiario.created_at) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Detalhes do Beneficiário</h2>
        <Badge status={beneficiario.status} />
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">{f.label}</p>
              <p className="mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)]">Histórico de Pagamentos</h3>
        {pagamentos.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum pagamento registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Mês Ref.</th>
                  <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Valor</th>
                  <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Data Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2">{p.mes_referencia}</td>
                    <td className="py-2">{formatCurrency(p.valor)}</td>
                    <td className="py-2"><Badge status={p.status} /></td>
                    <td className="py-2">{p.data_pagamento ? formatDate(p.data_pagamento) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
