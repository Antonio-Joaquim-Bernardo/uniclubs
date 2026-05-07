"use client";

import { useActionState, useEffect, useRef } from "react";
import { createMemberAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { MemberFields } from "@/components/forms/member-fields";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateMemberForm() {
  const [state, formAction] = useActionState(createMemberAction, initialActionState);
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
          <p className="section-kicker">Membros</p>
          <h3 className="panel-title mt-2">Cadastrar membro</h3>
          <p className="panel-subtitle mt-3">
            Um membro pode depois entrar num clube ou inscrever-se em eventos.
          </p>
        </div>
        <StatusBadge tone="accent">Pessoal</StatusBadge>
      </div>

      <div className="mt-6">
        <MemberFields errors={state.fieldErrors} includePassword />
      </div>

      <div className="mt-4 grid gap-4">
        <FormField
          htmlFor="role"
          label="Papel global"
          error={state.fieldErrors?.role}
          description="Define se a conta entra como membro normal ou administrador de clube."
        >
          <select id="role" name="role" className="select-field" defaultValue="membro">
            <option value="membro">Membro</option>
            <option value="admin_clube">Admin do clube</option>
          </select>
        </FormField>

        <FormField
          htmlFor="clubAdminId"
          label="Clube do admin"
          error={state.fieldErrors?.clubAdminId}
          description="Obrigatorio apenas quando o papel for admin de clube."
        >
          <input
            id="clubAdminId"
            name="clubAdminId"
            type="number"
            min={1}
            placeholder="1"
            className="input-field"
          />
        </FormField>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          O email e usado como identificador principal do membro.
        </p>
        <SubmitButton>Salvar membro</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
