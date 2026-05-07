import type { ReactNode } from "react";

const toneStyles = {
  neutral: "border-white/10 bg-white/5 text-slate-200",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  accent: "border-violet-400/20 bg-violet-400/10 text-violet-200",
} as const;

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof toneStyles;
  children: ReactNode;
}) {
  return <span className={`chip ${toneStyles[tone]}`}>{children}</span>;
}

