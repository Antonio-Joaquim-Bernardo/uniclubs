import type { ReactNode } from "react";

export function FormField({
  htmlFor,
  label,
  description,
  error,
  required,
  children,
}: {
  htmlFor: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-100">
          {label}
          {required ? <span className="ml-1 text-cyan-300">*</span> : null}
        </label>
        {error ? <span className="text-xs font-medium text-rose-300">{error}</span> : null}
      </div>
      {children}
      {description ? <p className="field-help">{description}</p> : null}
    </div>
  );
}

