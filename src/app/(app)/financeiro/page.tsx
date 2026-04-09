"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { formatCPF, formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import type { Pagamento, Beneficiario } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [{ data: pag, error: pagError }, { data: ben, error: benError }] =
      await Promise.all([
      supabase
        .from("pagamentos")
        .select("*, beneficiarios(nome, cpf)")
        .eq("mes_referencia", filterMes)
        .order("status", { ascending: true }),
      supabase.from("beneficiarios").select("*, planos(*)").eq("status", "ativo"),
      ]);

    if (pagError) {
      toast.error(pagError.message);
      setError(pagError.message);
    }
    if (benError) {
      toast.error(benError.message);
      setError(benError.message);
    }

    setPagamentos((pag || []) as unknown as Pagamento[]);
    setBeneficiarios((ben || []) as unknown as Beneficiario[]);
    setLoading(false);
  }, [filterMes, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const receitaEsperada = beneficiarios.reduce(
    (sum, b) => sum + (b.planos?.valor_mensal || 0),
    0
  );
  const receitaRecebida = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + p.valor, 0);
  const totalPendente = pagamentos
    .filter((p) => p.status === "pendente")
    .reduce((sum, p) => sum + p.valor, 0);
  const totalAtraso = pagamentos
    .filter((p) => p.status === "em_atraso")
    .reduce((sum, p) => sum + p.valor, 0);

  const gerarPagamentosDoMes = async () => {
    setSaving(true);

    const novos = beneficiarios
      .filter(
        (b) => !pagamentos.some((p) => p.beneficiario_id === b.id && p.mes_referencia === filterMes)
      )
      .map((b) => ({
        beneficiario_id: b.id,
        mes_referencia: filterMes,
        valor: b.planos?.valor_mensal || 0,
        status: "pendente" as const,
      }));

    if (novos.length === 0) {
      toast.success("Todos os pagamentos deste mês já existem.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("pagamentos").insert(novos);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    toast.success("Pagamentos do mês gerados com sucesso!");
    setSaving(false);
    await loadData();
  };

  const updateStatus = async (id: string, newStatus: "pago" | "em_atraso") => {
    const update: { status: "pago" | "em_atraso"; data_pagamento?: string | null } = { status: newStatus };
    if (newStatus === "pago") {
      update.data_pagamento = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("pagamentos").update(update).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado!");
    await loadData();
  };
  if (!isAdmin) {
    return (
      <div className="py-10 text-center text-[var(--muted-foreground)]">
        Voce nao tem permissao para acessar o modulo financeiro.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <div className="flex gap-2">
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          />
          <button
            onClick={gerarPagamentosDoMes}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            {saving ? "Gerando..." : "Gerar Pagamentos do Mes"}
          </button>
        </div>
      </div>

      {error && (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Receita Esperada</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(receitaEsperada)}</p>
            </div>
            <TrendingUp size={24} className="text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Receita Recebida</p>
              <p className="text-xl font-bold mt-1 text-green-600">{formatCurrency(receitaRecebida)}</p>
            </div>
            <DollarSign size={24} className="text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Pendente</p>
              <p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(totalPendente)}</p>
            </div>
            <TrendingDown size={24} className="text-red-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--muted-foreground)]">Em Atraso</p>
              <p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(totalAtraso)}</p>
            </div>
            <TrendingDown size={24} className="text-red-500" />
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
          </div>
        ) : pagamentos.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted-foreground)]">Nenhum pagamento registrado para este mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Beneficiário</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Data Pgto</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 font-medium">{p.beneficiarios?.nome || "-"}</td>
                    <td className="px-4 py-3">{p.beneficiarios ? formatCPF(p.beneficiarios.cpf) : "-"}</td>
                    <td className="px-4 py-3">{formatCurrency(p.valor)}</td>
                    <td className="px-4 py-3"><Badge status={p.status} /></td>
                    <td className="px-4 py-3">{p.data_pagamento ? formatDate(p.data_pagamento) : "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== "pago" && (
                          <button
                            onClick={() => updateStatus(p.id, "pago")}
                            className="px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded hover:opacity-80 transition-opacity"
                          >
                            Marcar Pago
                          </button>
                        )}
                        {p.status === "pendente" && (
                          <button
                            onClick={() => updateStatus(p.id, "em_atraso")}
                            className="px-2.5 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded hover:opacity-80 transition-opacity"
                          >
                            Marcar Em Atraso
                          </button>
                        )}
                      </div>
                    </td>
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
