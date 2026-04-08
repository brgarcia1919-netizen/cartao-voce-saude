import { classNames } from "@/lib/utils";

const variants: Record<string, string> = {
  ativo: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inativo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  suspenso: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  renovado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pago: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  em_atraso: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function Badge({ status }: { status: string }) {
  const label = status.replace("_", " ");
  return (
    <span
      className={classNames(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        variants[status] || "bg-gray-100 text-gray-800"
      )}
    >
      {label}
    </span>
  );
}
