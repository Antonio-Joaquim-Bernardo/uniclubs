import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card p-8 text-center">
      <p className="font-display text-2xl font-semibold text-white">{title}</p>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-6 flex justify-center gap-3">{action}</div> : null}
    </div>
  );
}

