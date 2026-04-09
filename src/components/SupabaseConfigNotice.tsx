interface Props {
  title?: string;
  missingVars: string[];
}

export default function SupabaseConfigNotice({
  title = "Configuração do Supabase pendente",
  missingVars,
}: Props) {
  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm">
        Defina as variáveis abaixo no arquivo <code>.env.local</code> (local) e no
        painel da Vercel (produção):
      </p>
      <ul className="mt-2 list-inside list-disc text-xs">
        {missingVars.map((key) => (
          <li key={key}>
            <code>{key}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
