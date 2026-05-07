import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationForm } from "@/components/forms/registration-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCompactNumber, formatDateTime } from "@/lib/format";
import { listClubChoices, listEventChoices, listRegistrations } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscricoes",
  description: "Lista de inscricoes em eventos com filtros, historico e confirmacao rapida.",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os estados" },
  { value: "confirmado", label: "Confirmadas" },
  { value: "pendente", label: "Pendentes" },
  { value: "cancelado", label: "Canceladas" },
] as const;

function getStringValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function registrationTone(status: string) {
  if (status === "cancelado") {
    return "danger";
  }

  if (status === "pendente") {
    return "warning";
  }

  return "success";
}

export default async function InscricoesPage({
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

  // Mantemos a inscricao como um fluxo rapido, por isso o formulario lateral usa o mesmo filtro por clube.
  const [registrations, clubs, eventChoices] = await Promise.all([
    listRegistrations(search, status, clubFilterId, 50),
    listClubChoices(),
    listEventChoices(clubFilterId ?? undefined),
  ]);

  const defaultEventId =
    Number.isInteger(selectedEventId) && eventChoices.some((item) => item.id === selectedEventId)
      ? selectedEventId
      : eventChoices[0]?.id ?? null;
  const confirmedCount = registrations.filter((item) => item.status === "confirmado").length;
  const pendingCount = registrations.filter((item) => item.status === "pendente").length;
  const uniqueMembers = new Set(registrations.map((item) => item.memberId)).size;
  const uniqueEvents = new Set(registrations.map((item) => item.eventId)).size;

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="surface-card-strong p-6 sm:p-8">
            <SectionHeading
              kicker="Inscricoes"
              title="Controlo das participacoes"
              description="Pesquisa por membro, evento ou clube e acompanha o estado de cada registo em tempo real."
              action={
                <Link href="/eventos" className="button-secondary">
                  Ir para eventos
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <StatCard
                label="Inscricoes encontradas"
                value={formatCompactNumber(registrations.length)}
                helper="Resultados visiveis para os filtros actuais"
              />
              <StatCard
                label="Confirmadas"
                value={formatCompactNumber(confirmedCount)}
                helper="Participantes aprovados"
              />
              <StatCard
                label="Pendentes"
                value={formatCompactNumber(pendingCount)}
                helper="Aguardam validacao ou confirmacao"
              />
              <StatCard
                label="Membros distintos"
                value={formatCompactNumber(uniqueMembers)}
                helper="Pessoas com inscricao nesta lista"
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
                  placeholder="Membro, email, clube ou evento"
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
                <Link href="/inscricoes" className="button-secondary w-full">
                  Limpar
                </Link>
              </div>
            </form>
          </div>

          {registrations.length > 0 ? (
            <div className="surface-card p-6">
              <SectionHeading
                kicker="Historico"
                title="Tabela de inscricoes"
                description="O registo mais recente aparece no topo para facilitar o acompanhamento diario."
              />

              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
                <div className="table-shell">
                  <div className="table-head grid grid-cols-[1.1fr_1fr_1fr_0.7fr]">
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Membro
                    </div>
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Evento
                    </div>
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Clube
                    </div>
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Estado
                    </div>
                  </div>

                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="table-row grid grid-cols-[1.1fr_1fr_1fr_0.7fr]"
                    >
                      <div className="table-cell">
                        <p className="font-semibold text-white">{registration.memberName}</p>
                        <p className="mt-1 text-xs text-slate-500">{registration.email}</p>
                      </div>
                      <div className="table-cell">
                        <p className="font-medium text-slate-200">{registration.eventTitle}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(registration.registeredAt)}
                        </p>
                      </div>
                      <div className="table-cell">
                        <p className="font-medium text-slate-200">{registration.clubName}</p>
                        <p className="mt-1 text-xs text-slate-500">{registration.eventStatus}</p>
                      </div>
                      <div className="table-cell">
                        <StatusBadge tone={registrationTone(registration.status)}>
                          {registration.status}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Nenhuma inscricao encontrada"
              description="Muda os filtros ou cria um evento activo para começar a registar participacoes."
              action={
                <Link href="/eventos" className="button-secondary">
                  Ver eventos
                </Link>
              }
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          {eventChoices.length > 0 ? (
            <RegistrationForm events={eventChoices} defaultEventId={defaultEventId} />
          ) : (
            <EmptyState
              title="Sem eventos activos"
              description="Assim que existir um evento activo, o formulario lateral passa a permitir novas inscricoes."
            />
          )}

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Ligacao"
              title="Resumo da actividade"
              description="Os numeros abaixo ajudam a perceber rapidamente como esta a correr a plataforma."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Eventos disponiveis</span>
                <strong className="text-white">{formatCompactNumber(uniqueEvents)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Clubes carregados</span>
                <strong className="text-white">{formatCompactNumber(clubs.length)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Estado dominante</span>
                <strong className="text-white">
                  {confirmedCount >= pendingCount ? "confirmadas" : "pendentes"}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
