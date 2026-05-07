"use client";

import { useActionState, useEffect, useRef } from "react";
import { registerEventAction } from "@/lib/actions";
import { initialActionState } from "@/lib/domain";
import type { EventChoice } from "@/lib/domain";
import { MemberFields } from "@/components/forms/member-fields";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegistrationForm({
  events,
  defaultEventId,
}: {
  events: EventChoice[];
  defaultEventId?: number | null;
}) {
  const [state, formAction] = useActionState(registerEventAction, initialActionState);
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
          <p className="section-kicker">Inscrição</p>
          <h3 className="panel-title mt-2">Inscrever em evento</h3>
          <p className="panel-subtitle mt-3">
            Escolhe um evento e preenche os dados do participante para concluir a inscrição.
          </p>
        </div>
        <StatusBadge tone="accent">Entrada</StatusBadge>
      </div>

      <div className="mt-6 grid gap-4">
        <FormField
          htmlFor="eventId"
          label="Evento"
          required
          error={state.fieldErrors?.eventId}
          description="Escolhe um evento activo para confirmar a inscrição."
        >
          <select
            id="eventId"
            name="eventId"
            className="select-field"
            defaultValue={defaultEventId ? String(defaultEventId) : events[0]?.id?.toString() ?? ""}
            required
          >
            <option value="" disabled>
              Seleciona um evento
            </option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {event.clubName}
              </option>
            ))}
          </select>
        </FormField>

        <MemberFields
          errors={state.fieldErrors}
          includePassword
          passwordLabel="Password da conta"
          passwordDescription="Se ainda nao tens conta, cria-a antes de confirmar a inscricao."
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-400">
          As inscrições são confirmadas automaticamente quando o evento está activo.
        </p>
        <SubmitButton>Confirmar inscrição</SubmitButton>
      </div>

      <FormMessage state={state} />
    </form>
  );
}
