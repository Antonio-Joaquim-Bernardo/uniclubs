"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions";
import type { Viewer } from "@/lib/domain";
import { initialActionState } from "@/lib/domain";
import { MemberFields } from "@/components/forms/member-fields";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ viewer }: { viewer: Viewer }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);

  return (
    <form action={formAction} className="surface-card-strong p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Perfil</p>
          <h1 className="panel-title mt-2 text-3xl">Os teus dados</h1>
          <p className="panel-subtitle mt-3">
            Mantem o teu perfil actualizado para o sistema identificar a tua conta e as tuas permissoes.
          </p>
        </div>
        <StatusBadge tone={viewer.role === "admin_sistema" ? "accent" : viewer.role === "admin_clube" ? "info" : "success"}>
          {viewer.role}
        </StatusBadge>
      </div>

      <div className="mt-6">
        <MemberFields
          errors={state.fieldErrors}
          includePassword
          passwordLabel="Nova password"
          passwordDescription="Preenche apenas se quiseres alterar a password actual."
          defaults={{
            name: viewer.name,
            email: viewer.email,
            course: viewer.course,
            phone: viewer.phone,
          }}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          O teu estado actual e {viewer.status}. Se estiver pendente, fala com a administracao.
        </p>
        <SubmitButton>Guardar alteracoes</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
