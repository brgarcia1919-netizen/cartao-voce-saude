"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { exportCSV, formatCPF, formatDate, formatPhone } from "@/lib/utils";
import { Download, Eye, Plus, Search } from "lucide-react";
import type { Beneficiario } from "@/lib/types";

export default function BeneficiariosPage() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mesVencimento, setMesVencimento] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    void loadBeneficiarios();
  }, []);

  async function loadBeneficiarios() {
    setLoading(true);

    const { data, error } = await supabase
      .from("beneficiarios")
      .select("*, planos(*)")
      .order("nome", { ascending: true });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setBeneficiarios((data || []) as unknown as Beneficiario[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return beneficiarios.filter((b) => {
      const searchOk =
        !search ||
        b.nome.toLowerCase().includes(search.toLowerCase()) ||
        b.cpf.includes(search.replace(/\D/g, ""));

      const statusOk = !status || b.status === status;

      const mesOk =
        !mesVencimento || b.data_vencimento.slice(5, 7) === mesVencimento;

      return searchOk && statusOk && mesOk;
    });
  }, [beneficiarios, search, status, mesVencimento]);

  function handleExportCsv() {
    const rows = filtered.map((b) => ({
      nome: b.nome,
      cpf: formatCPF(b.cpf),
      telefone: formatPhone(b.telefone),
      email: b.email,
      endereco: b.endereco,
      status: b.status,
      plano: b.planos?.nome || "-",
      vencimento: formatDate(b.data_vencimento),
    }));

    exportCSV(rows, `beneficiarios-${new Date().toISOString().slice(0, 10)}`);
    toast.success("CSV exportado com sucesso.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Beneficiários</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)]"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <Link
            href="/beneficiarios/novo"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
          >
            <Plus size={16} />
            Novo Beneficiário
          </Link>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou CPF"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="suspenso">Suspenso</option>
          </select>

          <select
            value={mesVencimento}
            onChange={(e) => setMesVencimento(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="">Todos os meses</option>
            <option value="01">Jan</option>
            <option value="02">Fev</option>
            <option value="03">Mar</option>
            <option value="04">Abr</option>
            <option value="05">Mai</option>
            <option value="06">Jun</option>
            <option value="07">Jul</option>
            <option value="08">Ago</option>
            <option value="09">Set</option>
            <option value="10">Out</option>
            <option value="11">Nov</option>
            <option value="12">Dez</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-[var(--primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Telefone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Plano
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-[var(--muted-foreground)]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]"
                  >
                    <td className="px-4 py-3 font-medium">{b.nome}</td>
                    <td className="px-4 py-3">{formatCPF(b.cpf)}</td>
                    <td className="px-4 py-3">{formatPhone(b.telefone)}</td>
                    <td className="px-4 py-3">{b.planos?.nome || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge status={b.status} />
                    </td>
                    <td className="px-4 py-3">{formatDate(b.data_vencimento)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/beneficiarios/${b.id}`}
                        className="inline-flex rounded p-1.5 hover:bg-[var(--accent)]"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </Link>
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
