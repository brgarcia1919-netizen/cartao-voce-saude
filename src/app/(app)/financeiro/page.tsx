"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { formatCPF, formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Plus } from "lucide-react";
import type { Pagamento, Beneficiario } from "@/lib/types";

export default function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { toast } = useToast();

  // Form state
  const [formBeneficiario, setFormBeneficiario] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formStatus, setFormStatus] = useState<"pago" | "pendente" | "em_atraso">("pago");
  const [formData, setFormData] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    await supabase.auth.getSession();
    const [{ data: pag }, { data: ben }] = await Promise.all([
      supabase
        .from("pagamentos")
        .select("*, beneficiarios(nome, cpf)")
        .gte("mes_referencia", `${filterMes}-01`)
        .lt("mes_referencia", (() => { const [y,m] = filterMes.split("-").map(Number); const n = new Date(y, m, 1); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-01`; })())
        .order("data_pagamento", { ascending: false }),
      supabase.from("beneficiarios").select("*, planos(*)").eq("status", "ativo"),
    ]);
    setPagamentos((pag || []) as unknown as Pagamento[]);
    setBeneficiarios((ben || []) as unknown as Beneficiario[]);
    setLoading(false);
  }, [filterMes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const receitaEsperada = beneficiarios.reduce(
    (sum, b) => sum + (b.planos?.valor_mensal || 0),
    0
  );
  const receitaRecebida = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + p.valor, 0);
  const totalPendente = pagamentos
    .filter((p) => p.status === "pendente" || p.status === "em_atraso")
    .reduce((sum, p) => sum + p.valor, 0);

  const handleAddPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("pagamentos").insert({
      beneficiario_id: formBeneficiario,
      mes_referencia: `${filterMes}-01`,
      valor: parseFloat(formValor),
      status: formStatus,
      data_pagamento: formStatus === "pago" ? formData : null,
    } as never);

    if (error) {
      toast(error.message, "error");
      setSaving(false);
      return;
    }

    toast("Pagamento registrado!");
    setShowForm(false);
    setFormBeneficiario("");
    setFormValor("");
    setSaving(false);
    loadData();
  };

  const updateStatus = async (id: string, newStatus: "pago" | "pendente" | "em_atraso") => {
    const update: { status: "pago" | "pendente" | "em_atraso"; data_pagamento?: string | null } = { status: newStatus };
    if (newStatus === "pago") {
      update.data_pagamento = new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase.from("pagamentos").update(update as never).eq("id", id);
    if (error) {
      toast(error.message, "error");
      return;
    }
    toast("Status atualizado!");
    loadData();
  };

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
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Pagamento
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <p className="text-sm text-[var(--muted-foreground)]">Pendente/Atraso</p>
              <p className="text-xl font-bold mt-1 text-red-600">{formatCurrency(totalPendente)}</p>
            </div>
            <TrendingDown size={24} className="text-red-500" />
          </div>
        </Card>
      </div>

      {/* Add payment form */}
      {showForm && (
        <Card>
          <h3 className="text-sm font-semibold mb-3">Registrar Pagamento</h3>
          <form onSubmit={handleAddPagamento} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={formBeneficiario}
              onChange={(e) => {
                setFormBeneficiario(e.target.value);
                const ben = beneficiarios.find((b) => b.id === e.target.value);
                if (ben?.planos) setFormValor(ben.planos.valor_mensal.toFixed(2));
              }}
              required
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            >
              <option value="">Beneficiário...</option>
              {beneficiarios.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome} - {formatCPF(b.cpf)}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              value={formValor}
              onChange={(e) => setFormValor(e.target.value)}
              required
              placeholder="Valor"
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "pago" | "pendente" | "em_atraso")}
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            >
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="em_atraso">Em atraso</option>
            </select>
            <input
              type="date"
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </Card>
      )}

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
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Ações</th>
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
                      {p.status !== "pago" && (
                        <button
                          onClick={() => updateStatus(p.id, "pago")}
                          className="px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded hover:opacity-80 transition-opacity"
                        >
                          Marcar pago
                        </button>
                      )}
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
