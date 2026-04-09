"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Beneficiario, Pagamento, Renovacao, StatusBeneficiario } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FormState {
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
}

const emptyForm: FormState = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  data_nascimento: "",
  status: "ativo",
  data_inicio: "",
  data_vencimento: "",
  plano_id: "",
};

export default function BeneficiarioDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [beneficiario, setBeneficiario] = useState<Beneficiario | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [renovacoes, setRenovacoes] = useState<Renovacao[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    void loadData();
  }, [params.id]);

  async function loadData() {
    setLoading(true);

    const [beneficiarioResult, pagamentosResult, renovacoesResult] = await Promise.all([
      supabase.from("beneficiarios").select("*, planos(*)").eq("id", params.id).single(),
      supabase
        .from("pagamentos")
        .select("*")
        .eq("beneficiario_id", params.id)
        .order("mes_referencia", { ascending: false }),
      supabase
        .from("renovacoes")
        .select("*")
        .eq("beneficiario_id", params.id)
        .order("mes_referencia", { ascending: false }),
    ]);

    if (beneficiarioResult.error || !beneficiarioResult.data) {
      toast.error(beneficiarioResult.error?.message || "Beneficiário não encontrado.");
      router.push("/beneficiarios");
      return;
    }

    const b = beneficiarioResult.data as unknown as Beneficiario;
    setBeneficiario(b);
    setPagamentos((pagamentosResult.data || []) as unknown as Pagamento[]);
    setRenovacoes((renovacoesResult.data || []) as unknown as Renovacao[]);
    setForm({
      nome: b.nome,
      cpf: b.cpf,
      telefone: b.telefone || "",
      email: b.email || "",
      endereco: b.endereco || "",
      data_nascimento: b.data_nascimento || "",
      status: b.status,
      data_inicio: b.data_inicio,
      data_vencimento: b.data_vencimento,
      plano_id: b.plano_id || "",
    });

    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const cpfClean = form.cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      toast.error("CPF inválido.");
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      cpf: cpfClean,
      telefone: form.telefone.replace(/\D/g, ""),
      status: isAdmin ? form.status : beneficiario?.status,
    };

    const { error } = await supabase.from("beneficiarios").update(payload).eq("id", params.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Alterações salvas com sucesso.");
    await loadData();
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (loading || !beneficiario) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/beneficiarios")}
          className="rounded-lg p-2 hover:bg-[var(--muted)]"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-2xl font-bold">Detalhes do Beneficiário</h2>
        <Badge status={beneficiario.status} />
      </div>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">Dados Pessoais</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              value={form.nome}
              onChange={(e) => setField("nome", e.target.value)}
              placeholder="Nome completo"
              required
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <input
              value={form.cpf}
              onChange={(e) => setField("cpf", e.target.value)}
              placeholder="CPF"
              required
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <input
              value={form.telefone}
              onChange={(e) => setField("telefone", e.target.value)}
              placeholder="Telefone"
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="E-mail"
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <input
              value={form.endereco}
              onChange={(e) => setField("endereco", e.target.value)}
              placeholder="Endereço"
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm md:col-span-2"
            />
            <input
              type="date"
              value={form.data_nascimento}
              onChange={(e) => setField("data_nascimento", e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value as StatusBeneficiario)}
              disabled={!isAdmin}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="suspenso">Suspenso</option>
            </select>
            <input
              type="date"
              value={form.data_inicio}
              onChange={(e) => setField("data_inicio", e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.data_vencimento}
              onChange={(e) => setField("data_vencimento", e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">
          Histórico de Pagamentos
        </h3>
        {pagamentos.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum registro encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">Mês</th>
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">Valor</th>
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">
                    Data Pagamento
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((pg) => (
                  <tr key={pg.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2">{pg.mes_referencia}</td>
                    <td className="py-2">{formatCurrency(pg.valor)}</td>
                    <td className="py-2">
                      <Badge status={pg.status} />
                    </td>
                    <td className="py-2">{formatDate(pg.data_pagamento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-[var(--muted-foreground)]">
          Histórico de Renovações
        </h3>
        {renovacoes.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">Nenhum registro encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">Mês</th>
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="py-2 text-left font-medium text-[var(--muted-foreground)]">
                    Data Renovação
                  </th>
                </tr>
              </thead>
              <tbody>
                {renovacoes.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2">{r.mes_referencia}</td>
                    <td className="py-2">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-2">{formatDate(r.data_renovacao)}</td>
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
