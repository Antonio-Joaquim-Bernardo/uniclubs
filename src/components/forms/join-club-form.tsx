"use client";

import { useActionState, useEffect, useRef } from "react";
import { joinClubAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { MemberFields } from "@/components/forms/member-fields";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function JoinClubForm({
  clubId,
  clubName,
}: {
  clubId: number;
  clubName: string;
}) {
  const [state, formAction] = useActionState(joinClubAction, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="surface-card-strong p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Adesão</p>
          <h3 className="panel-title mt-2">Entrar em {clubName}</h3>
          <p className="panel-subtitle mt-3">
            Se o email já existir, o perfil é reutilizado para manter o cadastro limpo.
          </p>
        </div>
        <StatusBadge tone="success">Membro</StatusBadge>
      </div>

      <input type="hidden" name="clubId" value={clubId} />

      <div className="mt-6">
        <MemberFields
          errors={state.fieldErrors}
          includePassword
          passwordLabel="Password da conta"
          passwordDescription="Se nao tiveres conta, cria-a aqui e entra no clube de seguida."
        />
      </div>

      <div className="mt-4 grid gap-4">
        <FormField
          htmlFor="role"
          label="Papel no clube"
          error={state.fieldErrors?.role}
          description="Define se o membro entra como participante ou administrador do clube."
        >
          <select id="role" name="role" className="select-field" defaultValue="membro">
            <option value="membro">Membro</option>
            <option value="admin_clube">Administrador do clube</option>
          </select>
        </FormField>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          O membro fica activo no clube imediatamente após a submissao.
        </p>
        <SubmitButton>Entrar no clube</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
