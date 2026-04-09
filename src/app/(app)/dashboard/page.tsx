"use client";

import { useEffect, useState } from "react";
import { ensureSupabaseAuthReady, supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCPF, formatCurrency, formatDate, getMesAtual } from "@/lib/utils";
import { Users, RefreshCw, DollarSign, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import type { Beneficiario, StatusPagamento } from "@/lib/types";

interface DashboardData {
  totalAtivos: number;
  renovacoesPendentes: number;
  receitaMes: number;
  inadimplentes: number;
  evolucao: { mes: string; total: number }[];
  receitas: { mes: string; valor: number }[];
  ultimosBeneficiarios: Beneficiario[];
}

interface MonthWindow {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

function buildMonthWindow(baseDate: Date): MonthWindow[] {
  const months: MonthWindow[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    months.push({
      key: monthKey,
      label: monthDate.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      startDate: `${monthKey}-01`,
      endDate: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
    });
  }

  return months;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      await ensureSupabaseAuthReady();
      const now = new Date();
      const mesAtual = getMesAtual();
      const months = buildMonthWindow(now);

      const [
        ativosResult,
        renovacoesResult,
        pagamentosMesResult,
        inadimplentesResult,
        ultimosBeneficiariosResult,
      ] = await Promise.all([
        supabase.from("beneficiarios").select("*", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("renovacoes").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("pagamentos").select("valor").eq("mes_referencia", mesAtual).eq("status", "pago"),
        supabase
          .from("pagamentos")
          .select("*", { count: "exact", head: true })
          .eq("status", "em_atraso"),
        supabase
          .from("beneficiarios")
          .select("*, planos(*)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const [evolucaoResults, receitasResults] = await Promise.all([
        Promise.all(
          months.map((month) =>
            supabase
              .from("beneficiarios")
              .select("*", { count: "exact", head: true })
              .lte("data_inicio", month.endDate)
              .gte("data_vencimento", month.startDate)
          )
        ),
        Promise.all(
          months.map((month) =>
            supabase
              .from("pagamentos")
              .select("valor")
              .eq("mes_referencia", month.key)
              .eq("status", "pago")
          )
        ),
      ]);

      const pagamentosMes = (pagamentosMesResult.data || []) as unknown as { valor: number }[];
      const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valor || 0), 0);

      const evolucao = months.map((month, index) => ({
        mes: month.label,
        total: evolucaoResults[index].count || 0,
      }));

      const receitas = months.map((month, index) => {
        const pagamentos = (receitasResults[index].data || []) as unknown as { valor: number }[];
        return {
          mes: month.label,
          valor: pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0),
        };
      });

      setData({
        totalAtivos: ativosResult.count || 0,
        renovacoesPendentes: renovacoesResult.count || 0,
        receitaMes,
        inadimplentes: inadimplentesResult.count || 0,
        evolucao,
        receitas,
        ultimosBeneficiarios: (ultimosBeneficiariosResult.data || []) as unknown as Beneficiario[],
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Erro ao carregar dashboard. Verifique a conexão com o banco de dados.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: "Beneficiários Ativos", value: data.totalAtivos, icon: Users, color: "text-blue-500" },
    { label: "Renovações Pendentes", value: data.renovacoesPendentes, icon: RefreshCw, color: "text-yellow-500" },
    { label: "Receita do Mês", value: formatCurrency(data.receitaMes), icon: DollarSign, color: "text-green-500" },
    { label: "Inadimplentes", value: data.inadimplentes, icon: AlertTriangle, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value}</p>
              </div>
              <c.icon size={28} className={c.color} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)]">
            Evolução de Beneficiários (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.evolucao}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)]">
            Receita Mensal (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.receitas}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="valor" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)]">
          Últimos Beneficiários Cadastrados
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Nome</th>
                <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">CPF</th>
                <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Plano</th>
                <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Status</th>
                <th className="text-left py-2 font-medium text-[var(--muted-foreground)]">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {data.ultimosBeneficiarios.map((b) => (
                <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5">{b.nome}</td>
                  <td className="py-2.5">{formatCPF(b.cpf)}</td>
                  <td className="py-2.5">{b.planos?.nome || "-"}</td>
                  <td className="py-2.5">
                    <Badge status={b.status} />
                  </td>
                  <td className="py-2.5">{formatDate(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
