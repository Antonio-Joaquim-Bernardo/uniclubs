"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAccountAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { MemberFields } from "@/components/forms/member-fields";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAccountAction, initialActionState);

  return (
    <form action={formAction} className="surface-card-strong p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Conta</p>
          <h1 className="panel-title mt-2 text-3xl">Criar uma conta</h1>
          <p className="panel-subtitle mt-3">
            O pedido entra em estado pendente e pode ser aprovado pelo administrador.
          </p>
        </div>
        <StatusBadge tone="accent">Pendente</StatusBadge>
      </div>

      <div className="mt-6">
        <MemberFields
          errors={state.fieldErrors}
          includePassword
          passwordLabel="Password da conta"
          passwordDescription="Depois da aprovacao, esta password sera usada para entrar na plataforma."
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          <p>A conta fica a aguardar aprovacao antes de ficar activa.</p>
          <Link href="/login" className="mt-1 inline-flex text-cyan-300 hover:text-cyan-200">
            Ja tenho conta
          </Link>
        </div>
        <SubmitButton>Solicitar acesso</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
