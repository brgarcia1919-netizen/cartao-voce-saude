"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { formatCPF, formatDate } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import type { Renovacao } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

export default function RenovacoesPage() {
  const [renovacoes, setRenovacoes] = useState<Renovacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "renovado" | "cancelado">("todos");
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    const [year, month] = filterMes.split("-").map(Number);
    const firstDay = `${filterMes}-01`;
    const lastDay = `${filterMes}-31`;

    let query = supabase
      .from("renovacoes")
      .select("*, beneficiarios(*, planos(*))")
      .eq("mes_referencia", filterMes)
      .order("mes_referencia", { ascending: true });

    if (statusFilter !== "todos") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    let renovacoesMes = (data || []) as unknown as Renovacao[];

    if (renovacoesMes.length === 0) {
      const { data: beneficiariosAtivos, error: ativosError } = await supabase
        .from("beneficiarios")
        .select("*")
        .eq("status", "ativo")
        .gte("data_vencimento", firstDay)
        .lte("data_vencimento", lastDay);

      if (ativosError) {
        toast.error(ativosError.message);
        setLoading(false);
        return;
      }

      for (const beneficiario of beneficiariosAtivos || []) {
        await supabase.from("renovacoes").upsert(
          {
            beneficiario_id: beneficiario.id,
            mes_referencia: filterMes,
            status: "pendente",
          },
          { onConflict: "beneficiario_id,mes_referencia" }
        );
      }

      const { data: geradas } = await supabase
        .from("renovacoes")
        .select("*, beneficiarios(*, planos(*))")
        .eq("mes_referencia", filterMes)
        .order("mes_referencia", { ascending: true });

      renovacoesMes = (geradas || []) as unknown as Renovacao[];
    }

    setRenovacoes(renovacoesMes);
    setLoading(false);
  }, [filterMes, statusFilter, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const marcarRenovado = async (id: string) => {
    const { error } = await supabase
      .from("renovacoes")
      .update({
        status: "renovado",
        data_renovacao: new Date().toISOString().slice(0, 10),
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Renovação concluída!");
    void loadData();
  };

  const marcarCancelado = async (id: string) => {
    const { error } = await supabase
      .from("renovacoes")
      .update({ status: "cancelado" })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Renovação cancelada.");
    void loadData();
  };

  const isVencimentoProximo = (r: Renovacao) => {
    if (!r.beneficiarios?.data_vencimento) return false;
    const dias = differenceInDays(
      parseISO(r.beneficiarios.data_vencimento),
      new Date()
    );
    return dias >= 0 && dias <= 7;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Renovações</h2>
        <div className="flex gap-2">
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "todos" | "pendente" | "renovado" | "cancelado")}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="renovado">Renovado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Pendentes", count: renovacoes.filter((r) => r.status === "pendente").length, icon: Clock, color: "text-yellow-500" },
          { label: "Renovados", count: renovacoes.filter((r) => r.status === "renovado").length, icon: CheckCircle, color: "text-green-500" },
          { label: "Cancelados", count: renovacoes.filter((r) => r.status === "cancelado").length, icon: AlertTriangle, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.count}</p>
              </div>
              <s.icon size={24} className={s.color} />
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
          </div>
        ) : renovacoes.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted-foreground)]">Nenhuma renovação encontrada para este período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Beneficiário</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Mês Ref.</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Vencimento</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {renovacoes.map((r) => {
                  const proximo = isVencimentoProximo(r);
                  return (
                    <tr
                      key={r.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors ${
                        proximo && r.status === "pendente" ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          {r.beneficiarios?.nome}
                          {proximo && r.status === "pendente" && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                              Vence em breve
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{r.beneficiarios ? formatCPF(r.beneficiarios.cpf) : "-"}</td>
                      <td className="px-4 py-3">{r.mes_referencia}</td>
                      <td className="px-4 py-3">{r.beneficiarios ? formatDate(r.beneficiarios.data_vencimento) : "-"}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "pendente" && isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => marcarRenovado(r.id)}
                              className="px-2.5 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded hover:opacity-80 transition-opacity"
                            >
                              Renovar
                            </button>
                            <button
                              onClick={() => marcarCancelado(r.id)}
                              className="px-2.5 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded hover:opacity-80 transition-opacity"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {r.status !== "pendente" && r.data_renovacao && (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(r.data_renovacao)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
