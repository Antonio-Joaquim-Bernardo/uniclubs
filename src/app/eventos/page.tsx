import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationForm } from "@/components/forms/registration-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCompactNumber, formatDateTime } from "@/lib/format";
import { listClubChoices, listEventChoices, listEvents } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eventos",
  description: "Lista de eventos por clube com filtros, capacidade e inscricao rapida.",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os estados" },
  { value: "ativo", label: "Activos" },
  { value: "finalizado", label: "Finalizados" },
  { value: "cancelado", label: "Cancelados" },
] as const;

function getStringValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function eventTone(status: string) {
  if (status === "cancelado") {
    return "danger";
  }

  if (status === "finalizado") {
    return "neutral";
  }

  return "success";
}

function capacityTone(filledPercent: number | null) {
  if (filledPercent === null) {
    return "neutral";
  }

  if (filledPercent >= 100) {
    return "danger";
  }

  if (filledPercent >= 80) {
    return "warning";
  }

  return "success";
}

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; clube?: string; evento?: string }>;
}) {
  const params = await searchParams;
  const search = getStringValue(params.q).trim();
  const status = getStringValue(params.estado) || "all";
  const clubIdValue = getStringValue(params.clube);
  const eventIdValue = getStringValue(params.evento);
  const selectedClubId = clubIdValue ? Number(clubIdValue) : null;
  const selectedEventId = eventIdValue ? Number(eventIdValue) : null;
  const clubFilterId =
    typeof selectedClubId === "number" && Number.isInteger(selectedClubId)
      ? selectedClubId
      : null;

  // Os filtros ficam em GET para que esta vista possa ser partilhada sem perder contexto.
  const [events, clubs, registrationEvents] = await Promise.all([
    listEvents(search, status, clubFilterId, 48),
    listClubChoices(),
    listEventChoices(clubFilterId ?? undefined),
  ]);

  const defaultEventId =
    Number.isInteger(selectedEventId) && registrationEvents.some((item) => item.id === selectedEventId)
      ? selectedEventId
      : registrationEvents[0]?.id ?? null;
  const totalCapacity = events.reduce((sum, event) => sum + (event.capacity ?? 0), 0);
  const confirmedRegistrations = events.reduce((sum, event) => sum + event.registrationCount, 0);
  const filledEvents = events.filter((event) => event.filledPercent === 100).length;
  const activeEvents = events.filter((event) => event.status === "ativo").length;

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="surface-card-strong p-6 sm:p-8">
            <SectionHeading
              kicker="Eventos"
              title="Agenda da universidade"
              description="Filtra por clube, acompanha a lotacao e abre rapidamente a pagina do clube certo."
              action={
                <Link href="/clubes" className="button-secondary">
                  Gerir clubes
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Eventos listados"
                value={formatCompactNumber(events.length)}
                helper="Resultados visiveis para os filtros actuais"
              />
              <StatCard
                label="Eventos activos"
                value={formatCompactNumber(activeEvents)}
                helper="Disponiveis para inscricao"
              />
              <StatCard
                label="Inscricoes confirmadas"
                value={formatCompactNumber(confirmedRegistrations)}
                helper="Participacao total nos eventos filtrados"
              />
              <StatCard
                label="Lotaçao completa"
                value={formatCompactNumber(filledEvents)}
                helper="Eventos que atingiram a capacidade maxima"
              />
            </div>

            <form method="get" className="mt-6 grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              <div className="space-y-2">
                <label htmlFor="q" className="text-sm font-semibold text-slate-100">
                  Pesquisar
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={search}
                  placeholder="Titulo, descricao, categoria ou clube"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="estado" className="text-sm font-semibold text-slate-100">
                  Estado
                </label>
                <select id="estado" name="estado" defaultValue={status} className="select-field">
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="clube" className="text-sm font-semibold text-slate-100">
                  Clube
                </label>
                <select
                  id="clube"
                  name="clube"
                  defaultValue={clubIdValue || "all"}
                  className="select-field"
                >
                  <option value="all">Todos</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 self-end">
                <button type="submit" className="button-primary w-full">
                  Filtrar
                </button>
                <Link href="/eventos" className="button-secondary w-full">
                  Limpar
                </Link>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {clubs.slice(0, 6).map((club) => (
                <span key={club.id} className="chip">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: club.accentColor }}
                  />
                  {club.name}
                </span>
              ))}
            </div>
          </div>

          {events.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {events.map((event) => {
                return (
                  <article key={event.id} className="surface-card p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-12 w-2.5 rounded-full"
                          style={{ backgroundColor: event.clubColor }}
                        />
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {event.clubName}
                          </p>
                          <h2 className="mt-1 font-display text-xl font-semibold text-white">
                            {event.title}
                          </h2>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <StatusBadge tone={eventTone(event.status)}>{event.status}</StatusBadge>
                        {event.isHighlighted ? <StatusBadge tone="accent">Destaque</StatusBadge> : null}
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      {event.description ?? "Sem descricao disponivel."}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inicio</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {formatDateTime(event.startsAt)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.endsAt ? `Termina em ${formatDateTime(event.endsAt)}` : "Sem hora de fim"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lotacao</p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            {formatCompactNumber(event.registrationCount)}
                            {event.capacity ? ` / ${formatCompactNumber(event.capacity)}` : " inscricoes"}
                          </p>
                          <StatusBadge tone={capacityTone(event.filledPercent)}>
                            {event.filledPercent === null ? "aberto" : `${event.filledPercent}%`}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.location ?? "Local por definir"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${event.filledPercent ?? 0}%`,
                          backgroundColor: event.clubColor,
                        }}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Criado em {formatDateTime(event.createdAt)}
                      </p>
                      <Link href={`/clubes/${event.clubId}`} className="button-secondary px-4 py-2 text-xs">
                        Abrir clube
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Nenhum evento encontrado"
              description="Ajusta os filtros ou abre um clube para criar o proximo evento da comunidade."
              action={
                <Link href="/clubes" className="button-secondary">
                  Ver clubes
                </Link>
              }
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          {registrationEvents.length > 0 ? (
            <RegistrationForm events={registrationEvents} defaultEventId={defaultEventId} />
          ) : (
            <EmptyState
              title="Sem eventos activos"
              description="Quando existir um evento activo, este painel de inscricao passa a ficar disponivel aqui."
            />
          )}

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Ajuda"
              title="Fluxo de eventos"
              description="Este painel junta a agenda com a inscricao rapida para evitar cliques desnecessarios."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                1. Filtra por clube ou estado para encontrar o evento certo.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                2. Usa o formulario lateral para confirmar uma inscricao sem sair da pagina.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                3. Abre o clube quando precisares de criar um novo evento com contexto completo.
              </p>
            </div>
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Resumo"
              title="Sinais rapidos"
              description="Leitura imediata do estado actual da agenda que esta a ser mostrada."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Clubes filtrados</span>
                <strong className="text-white">{formatCompactNumber(clubs.length)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Eventos activos para inscricao</span>
                <strong className="text-white">{formatCompactNumber(registrationEvents.length)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Lotacao total estimada</span>
                <strong className="text-white">{formatCompactNumber(totalCapacity)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
