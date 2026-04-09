"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCPF, formatCurrency, formatDate } from "@/lib/utils";
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

interface BeneficiarioRow {
  id: string;
  nome: string;
  cpf: string;
  status: string;
  data_inicio: string;
  data_vencimento: string;
  created_at: string;
  planos: { nome: string } | null;
}

export default function DashboardPage() {
  const [totalAtivos, setTotalAtivos] = useState(0);
  const [renovacoesPendentes, setRenovacoesPendentes] = useState(0);
  const [receitaMes, setReceitaMes] = useState(0);
  const [inadimplentes, setInadimplentes] = useState(0);
  const [evolucao, setEvolucao] = useState<{ mes: string; total: number }[]>([]);
  const [receitas, setReceitas] = useState<{ mes: string; valor: number }[]>([]);
  const [ultimos, setUltimos] = useState<BeneficiarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Forçar init da sessão antes das queries (evita lock interno)
      await supabase.auth.getSession();

      // --- Cards ---
      const { count: ativos } = await supabase
        .from("beneficiarios")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");
      setTotalAtivos(ativos || 0);

      const { count: pendentes } = await supabase
        .from("renovacoes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      setRenovacoesPendentes(pendentes || 0);

      const { count: atraso } = await supabase
        .from("pagamentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "em_atraso");
      setInadimplentes(atraso || 0);

      // Receita do mes - usa date range
      const now = new Date();
      const mesInicio = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const proxMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const mesFim = `${proxMes.getFullYear()}-${String(proxMes.getMonth() + 1).padStart(2, "0")}-01`;

      const { data: pagsMes } = await supabase
        .from("pagamentos")
        .select("valor")
        .gte("mes_referencia", mesInicio)
        .lt("mes_referencia", mesFim)
        .eq("status", "pago");

      const receita = (pagsMes || []).reduce((s: number, p: { valor: number }) => s + Number(p.valor || 0), 0);
      setReceitaMes(receita);

      // --- Ultimos beneficiarios ---
      const { data: ultimosData } = await supabase
        .from("beneficiarios")
        .select("id, nome, cpf, status, data_inicio, data_vencimento, created_at, planos(nome)")
        .order("created_at", { ascending: false })
        .limit(5);
      setUltimos((ultimosData || []) as unknown as BeneficiarioRow[]);

      // --- Graficos: evolucao e receita dos ultimos 6 meses ---
      const evolucaoArr: { mes: string; total: number }[] = [];
      const receitasArr: { mes: string; valor: number }[] = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
        const end = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const { count: benCount } = await supabase
          .from("beneficiarios")
          .select("*", { count: "exact", head: true })
          .lte("data_inicio", end)
          .gte("data_vencimento", start);
        evolucaoArr.push({ mes: label, total: benCount || 0 });

        const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const nextStart = `${nextM.getFullYear()}-${String(nextM.getMonth() + 1).padStart(2, "0")}-01`;
        const { data: recData } = await supabase
          .from("pagamentos")
          .select("valor")
          .gte("mes_referencia", start)
          .lt("mes_referencia", nextStart)
          .eq("status", "pago");

        const val = (recData || []).reduce((s: number, p: { valor: number }) => s + Number(p.valor || 0), 0);
        receitasArr.push({ mes: label, valor: val });
      }

      setEvolucao(evolucaoArr);
      setReceitas(receitasArr);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Erro ao carregar dados. Tente recarregar a página.");
    }
    setLoading(false);
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
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={() => { setError(""); setLoading(true); loadData(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Tentar novamente
        </button>
      </div>
    );
  }

  const cards = [
    { label: "Beneficiários Ativos", value: totalAtivos, icon: Users, color: "text-blue-500" },
    { label: "Renovações Pendentes", value: renovacoesPendentes, icon: RefreshCw, color: "text-yellow-500" },
    { label: "Receita do Mês", value: formatCurrency(receitaMes), icon: DollarSign, color: "text-green-500" },
    { label: "Inadimplentes", value: inadimplentes, icon: AlertTriangle, color: "text-red-500" },
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
            <BarChart data={evolucao}>
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
            <LineChart data={receitas}>
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
        {ultimos.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum beneficiário cadastrado.</p>
        ) : (
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
                {ultimos.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2.5">{b.nome}</td>
                    <td className="py-2.5">{formatCPF(b.cpf)}</td>
                    <td className="py-2.5">{b.planos?.nome || "-"}</td>
                    <td className="py-2.5"><Badge status={b.status} /></td>
                    <td className="py-2.5">{formatDate(b.created_at)}</td>
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
