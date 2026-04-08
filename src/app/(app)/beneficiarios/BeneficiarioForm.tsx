"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, Save } from "lucide-react";
import type { Beneficiario, Plano, StatusBeneficiario } from "@/lib/types";

interface Props {
  id: string | null;
  planos: Plano[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
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

const emptyForm: FormData = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  data_nascimento: "",
  status: "ativo",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_vencimento: "",
  plano_id: "",
};

export default function BeneficiarioForm({ id, planos, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!id);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (id) {
      supabase
        .from("beneficiarios")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data: rawData }) => {
          const data = rawData as unknown as Beneficiario | null;
          if (data) {
            setForm({
              nome: data.nome,
              cpf: data.cpf,
              telefone: data.telefone,
              email: data.email,
              endereco: data.endereco,
              data_nascimento: data.data_nascimento,
              status: data.status,
              data_inicio: data.data_inicio,
              data_vencimento: data.data_vencimento,
              plano_id: data.plano_id,
            });
          }
          setLoadingData(false);
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const cpfClean = form.cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      setLoading(false);
      return;
    }

    const payload = { ...form, cpf: cpfClean, telefone: form.telefone.replace(/\D/g, "") };

    if (id) {
      const { error: err } = await supabase
        .from("beneficiarios")
        .update(payload as never)
        .eq("id", id);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from("beneficiarios")
        .insert(payload as never);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSaved();
  };

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [key]: e.target.value });

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">
          {id ? "Editar Beneficiário" : "Novo Beneficiário"}
        </h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo *</label>
              <input type="text" value={form.nome} onChange={set("nome")} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CPF *</label>
              <input type="text" value={form.cpf} onChange={set("cpf")} required maxLength={14} placeholder="000.000.000-00" className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input type="text" value={form.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={set("email")} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input type="text" value={form.endereco} onChange={set("endereco")} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de nascimento</label>
              <input type="date" value={form.data_nascimento} onChange={set("data_nascimento")} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plano *</label>
              <select value={form.plano_id} onChange={set("plano_id")} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="">Selecione...</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - R$ {p.valor_mensal.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status} onChange={set("status")} className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de início *</label>
              <input type="date" value={form.data_inicio} onChange={set("data_inicio")} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de vencimento *</label>
              <input type="date" value={form.data_vencimento} onChange={set("data_vencimento")} required className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)] bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Save size={16} />
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
