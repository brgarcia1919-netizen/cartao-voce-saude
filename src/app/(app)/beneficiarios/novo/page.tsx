"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import type { Plano } from "@/lib/types";

interface FormData {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: string;
  data_nascimento: string;
  plano_id: string;
  data_inicio: string;
  data_vencimento: string;
}

const emptyForm: FormData = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  endereco: "",
  data_nascimento: "",
  plano_id: "",
  data_inicio: new Date().toISOString().slice(0, 10),
  data_vencimento: "",
};

export default function NovoBeneficiarioPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("planos")
      .select("*")
      .order("valor_mensal", { ascending: true })
      .then(({ data, error: planosError }) => {
        if (planosError) {
          toast.error(planosError.message);
          setLoadingPlanos(false);
          return;
        }

        setPlanos((data || []) as Plano[]);
        setLoadingPlanos(false);
      });
  }, [toast]);

  const setField =
    (key: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const cpfClean = form.cpf.replace(/\D/g, "");
    if (cpfClean.length !== 11) {
      setError("CPF deve ter 11 dígitos.");
      setSaving(false);
      return;
    }

    const payload = {
      nome: form.nome,
      cpf: cpfClean,
      telefone: form.telefone.replace(/\D/g, ""),
      email: form.email,
      endereco: form.endereco,
      data_nascimento: form.data_nascimento || null,
      plano_id: form.plano_id || null,
      data_inicio: form.data_inicio,
      data_vencimento: form.data_vencimento,
    };

    const { error: insertError } = await supabase
      .from("beneficiarios")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      toast.error(insertError.message);
      setSaving(false);
      return;
    }

    toast.success("Beneficiário cadastrado com sucesso!");
    router.push("/beneficiarios");
  }

  if (loadingPlanos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/beneficiarios")}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold">Novo Beneficiário</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo *</label>
              <input
                type="text"
                value={form.nome}
                onChange={setField("nome")}
                required
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CPF *</label>
              <input
                type="text"
                value={form.cpf}
                onChange={setField("cpf")}
                maxLength={14}
                required
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={setField("telefone")}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={setField("email")}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input
                type="text"
                value={form.endereco}
                onChange={setField("endereco")}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento}
                onChange={setField("data_nascimento")}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Plano</label>
              <select
                value={form.plano_id}
                onChange={setField("plano_id")}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              >
                <option value="">Selecione...</option>
                {planos.map((plano) => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome} - R$ {plano.valor_mensal.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de início *</label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={setField("data_inicio")}
                required
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de vencimento *</label>
              <input
                type="date"
                value={form.data_vencimento}
                onChange={setField("data_vencimento")}
                required
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[var(--destructive)] bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/beneficiarios")}
              className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
