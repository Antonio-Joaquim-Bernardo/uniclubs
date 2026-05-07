"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEventAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function EventForm({
  clubId,
  clubName,
}: {
  clubId: number;
  clubName: string;
}) {
  const [state, formAction] = useActionState(createEventAction, initialActionState);
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
          <p className="section-kicker">Eventos</p>
          <h3 className="panel-title mt-2">Criar evento em {clubName}</h3>
          <p className="panel-subtitle mt-3">
            Programa actividades com datas, capacidade e uma ligação clara ao clube.
          </p>
        </div>
        <StatusBadge tone="warning">Agenda</StatusBadge>
      </div>

      <input type="hidden" name="clubId" value={clubId} />

      <div className="mt-6 grid gap-4">
        <FormField htmlFor="title" label="Titulo" required error={state.fieldErrors?.title}>
          <input
            id="title"
            name="title"
            placeholder="Ex.: Hackathon UniClubs 2026"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            htmlFor="startsAt"
            label="Inicio"
            required
            error={state.fieldErrors?.startsAt}
            description="Use o fuso local do utilizador. O sistema converte para UTC."
          >
            <input id="startsAt" name="startsAt" type="datetime-local" className="input-field" required />
          </FormField>

          <FormField
            htmlFor="endsAt"
            label="Fim"
            error={state.fieldErrors?.endsAt}
            description="Campo opcional para definir a duração do evento."
          >
            <input id="endsAt" name="endsAt" type="datetime-local" className="input-field" />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField htmlFor="location" label="Local" error={state.fieldErrors?.location}>
            <input
              id="location"
              name="location"
              placeholder="Auditório B"
              className="input-field"
            />
          </FormField>

          <FormField
            htmlFor="capacity"
            label="Capacidade"
            error={state.fieldErrors?.capacity}
            description="Deixa em branco se o evento for aberto."
          >
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              placeholder="80"
              className="input-field"
            />
          </FormField>
        </div>

        <FormField
          htmlFor="description"
          label="Descrição"
          error={state.fieldErrors?.description}
          description="Explica o que o evento oferece e quem deve participar."
        >
          <textarea
            id="description"
            name="description"
            placeholder="Descreve o objectivo, a dinâmica e o público-alvo do evento."
            className="textarea-field"
          />
        </FormField>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-200">
          <input
            type="checkbox"
            name="highlighted"
            className="h-4 w-4 rounded border-white/20 bg-slate-950/70 text-cyan-400 focus:ring-cyan-400/20"
          />
          Destacar este evento no topo da lista
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          O evento será guardado como activo e disponível para inscrições.
        </p>
        <SubmitButton>Criar evento</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}

