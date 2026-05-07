"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialActionState);

  return (
    <form action={formAction} className="surface-card-strong p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Acesso</p>
          <h1 className="panel-title mt-2 text-3xl">Entrar na plataforma</h1>
          <p className="panel-subtitle mt-3">
            Usa a tua conta para aceder ao dashboard certo e manter os dados sincronizados.
          </p>
        </div>
        <StatusBadge tone="info">Seguranca</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4">
        <FormField
          htmlFor="email"
          label="Email"
          required
          error={state.fieldErrors?.email}
          description="O email precisa de estar ligado a uma conta aprovada."
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ana@uniclubs.edu"
            className="input-field"
            required
          />
        </FormField>

        <FormField
          htmlFor="password"
          label="Password"
          required
          error={state.fieldErrors?.password}
          description="A password e sempre guardada no servidor, nunca no navegador."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="input-field"
            minLength={6}
            required
          />
        </FormField>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-400">
          <p>Se ainda nao tens conta, podes pedir acesso em segundos.</p>
          <Link href="/cadastro" className="mt-1 inline-flex text-cyan-300 hover:text-cyan-200">
            Criar conta
          </Link>
        </div>
        <SubmitButton>Entrar</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
