import { classNames } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
