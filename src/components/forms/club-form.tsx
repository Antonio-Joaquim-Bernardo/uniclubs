"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClubAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function ClubForm() {
  const [state, formAction] = useActionState(createClubAction, initialActionState);
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
          <p className="section-kicker">Novo clube</p>
          <h3 className="panel-title mt-2">Criar clube</h3>
          <p className="panel-subtitle mt-3">
            Regista a identidade do clube, a categoria e o ponto de encontro.
          </p>
        </div>
        <StatusBadge tone="info">Cadastro</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4">
        <FormField
          htmlFor="name"
          label="Nome do clube"
          required
          error={state.fieldErrors?.name}
        >
          <input
            id="name"
            name="name"
            autoComplete="organization"
            placeholder="Ex.: Clube de Tecnologia Orion"
            className="input-field"
            required
            minLength={3}
          />
        </FormField>

        <FormField
          htmlFor="category"
          label="Categoria"
          required
          error={state.fieldErrors?.category}
          description="Ex.: Tecnologia, Cultura, Desporto, Inovação."
        >
          <input
            id="category"
            name="category"
            placeholder="Tecnologia"
            className="input-field"
            required
            minLength={2}
          />
        </FormField>

        <FormField
          htmlFor="location"
          label="Local base"
          error={state.fieldErrors?.location}
          description="Onde os membros costumam reunir-se."
        >
          <input
            id="location"
            name="location"
            placeholder="Laboratório 3"
            className="input-field"
          />
        </FormField>

        <FormField
          htmlFor="accentColor"
          label="Cor principal"
          error={state.fieldErrors?.accentColor}
          description="Usada para destacar o clube nos cartões e no detalhe."
        >
          <input
            id="accentColor"
            name="accentColor"
            type="color"
            defaultValue="#22c55e"
            className="input-field h-14 px-2 py-2"
          />
        </FormField>

        <FormField
          htmlFor="objective"
          label="Objetivo"
          error={state.fieldErrors?.objective}
          description="Uma frase curta a resumir o impacto do clube."
        >
          <textarea
            id="objective"
            name="objective"
            placeholder="Ex.: Desenvolver competências e projectos colaborativos."
            className="textarea-field"
          />
        </FormField>

        <FormField
          htmlFor="description"
          label="Descrição"
          required
          error={state.fieldErrors?.description}
          description="Mostra o que o clube faz e porque um estudante deveria aderir."
        >
          <textarea
            id="description"
            name="description"
            placeholder="Descreve o clube, as actividades e os benefícios para a comunidade académica."
            className="textarea-field"
            required
            minLength={20}
          />
        </FormField>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          Os campos obrigatórios estao assinalados com *.
        </p>
        <SubmitButton>Salvar clube</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}

