"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { formatCPF, formatPhone, formatDate, formatCurrency } from "@/lib/utils";
import { Plus, Search, Download, Edit2, Eye, X } from "lucide-react";
import type { Beneficiario, Plano, StatusBeneficiario } from "@/lib/types";
import BeneficiarioForm from "./BeneficiarioForm";
import BeneficiarioDetail from "./BeneficiarioDetail";

export default function BeneficiariosPage() {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterMes, setFilterMes] = useState<string>("");
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("beneficiarios")
      .select("*, planos(*)")
      .order("created_at", { ascending: false });

    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterMes) {
      const [year, month] = filterMes.split("-");
      const start = `${year}-${month}-01`;
      const end = `${year}-${month}-31`;
      query = query.gte("data_vencimento", start).lte("data_vencimento", end);
    }

    const { data } = await query;
    setBeneficiarios(data || []);

    const { data: planosData } = await supabase.from("planos").select("*");
    setPlanos(planosData || []);
    setLoading(false);
  }, [filterStatus, filterMes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = beneficiarios.filter((b) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.nome.toLowerCase().includes(term) ||
      b.cpf.includes(term.replace(/\D/g, ""))
    );
  });

  const exportCSV = () => {
    const headers = ["Nome", "CPF", "Telefone", "E-mail", "Status", "Plano", "Vencimento"];
    const rows = filtered.map((b) => [
      b.nome,
      formatCPF(b.cpf),
      formatPhone(b.telefone),
      b.email,
      b.status,
      b.planos?.nome || "",
      formatDate(b.data_vencimento),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beneficiarios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exportado com sucesso!");
  };

  if (viewingId) {
    return (
      <BeneficiarioDetail
        id={viewingId}
        onClose={() => setViewingId(null)}
      />
    );
  }

  if (showForm || editingId) {
    return (
      <BeneficiarioForm
        id={editingId}
        planos={planos}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSaved={() => {
          setShowForm(false);
          setEditingId(null);
          loadData();
          toast(editingId ? "Beneficiário atualizado!" : "Beneficiário cadastrado!");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Beneficiários</h2>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <Download size={16} /> CSV
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity">
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="suspenso">Suspenso</option>
          </select>
          <input
            type="month"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
            className="px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
            placeholder="Mês vencimento"
          />
          {(filterStatus || filterMes) && (
            <button onClick={() => { setFilterStatus(""); setFilterMes(""); }} className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X size={16} />
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-[var(--muted-foreground)]">Nenhum beneficiário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--muted)] border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">CPF</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] hidden md:table-cell">Telefone</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Plano</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--muted-foreground)] hidden lg:table-cell">Vencimento</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--muted-foreground)]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 font-medium">{b.nome}</td>
                    <td className="px-4 py-3">{formatCPF(b.cpf)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{formatPhone(b.telefone)}</td>
                    <td className="px-4 py-3">{b.planos?.nome || "-"}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell">{formatDate(b.data_vencimento)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewingId(b.id)} className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors" title="Ver detalhes">
                          <Eye size={15} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setEditingId(b.id)} className="p-1.5 rounded hover:bg-[var(--accent)] transition-colors" title="Editar">
                            <Edit2 size={15} />
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
