import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/forms/event-form";
import { JoinClubForm } from "@/components/forms/join-club-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatCompactNumber, getInitials } from "@/lib/format";
import { getClubDetail } from "@/lib/repository";

export const dynamic = "force-dynamic";

function eventTone(status: string) {
  if (status === "cancelado") {
    return "danger";
  }

  if (status === "finalizado") {
    return "neutral";
  }

  return "success";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const clubId = Number(id);

  if (!Number.isInteger(clubId)) {
    return {
      title: "Clube",
    };
  }

  const detail = await getClubDetail(clubId);

  if (!detail) {
    return {
      title: "Clube nao encontrado",
    };
  }

  return {
    title: detail.club.name,
    description: detail.club.description,
  };
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clubId = Number(id);

  if (!Number.isInteger(clubId)) {
    notFound();
  }

  const detail = await getClubDetail(clubId);

  if (!detail) {
    notFound();
  }

  const { club, members, events, registrations } = detail;
  const eventRegistrations = registrations.length;

  return (
    <div className="section-shell section-spacing">
      <div
        className="surface-card-strong p-8 sm:p-10"
        style={{
          borderColor: `${club.accentColor}55`,
          boxShadow: `0 30px 80px ${club.accentColor}14`,
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone="info">{club.category}</StatusBadge>
          <StatusBadge tone={club.status === "ativo" ? "success" : "warning"}>
            {club.status}
          </StatusBadge>
          {club.location ? <StatusBadge tone="accent">{club.location}</StatusBadge> : null}
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="hero-title">{club.name}</h1>
            <p className="hero-copy mt-5">{club.description}</p>

            {club.objective ? (
              <p className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                {club.objective}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/clubes" className="button-secondary">
                Voltar aos clubes
              </Link>
              <Link href="/eventos" className="button-primary">
                Ver eventos
              </Link>
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">Resumo</p>
                <p className="panel-title mt-2">Indicadores do clube</p>
              </div>
              <div
                className="h-4 w-16 rounded-full"
                style={{ backgroundColor: club.accentColor }}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Membros"
                value={formatCompactNumber(club.memberCount)}
                helper="Membros activos no clube"
              />
              <StatCard
                label="Eventos"
                value={formatCompactNumber(club.eventCount)}
                helper="Agenda associada ao clube"
              />
              <StatCard
                label="Inscrições"
                value={formatCompactNumber(eventRegistrations)}
                helper="Participações registadas"
              />
              <StatCard
                label="Próximo evento"
                value={club.nextEventAt ? formatDateTime(club.nextEventAt) : "Sem data"}
                helper="Agenda planeada"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <SectionHeading
              kicker="Membros"
              title="Membros do clube"
              description="Lista os membros ligados ao clube e o papel de cada um."
            />

            {members.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {members.map((member) => (
                  <article
                    key={member.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {member.course ?? member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge tone={member.role === "admin_clube" ? "accent" : "success"}>
                        {member.role}
                      </StatusBadge>
                      <span className="text-xs text-slate-500">
                        Entrou em {formatDateTime(member.joinedAt)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem membros ainda"
                  description="Adiciona o primeiro membro pelo painel lateral para começar a construir a comunidade do clube."
                />
              </div>
            )}
          </section>

          <section className="surface-card p-6">
            <SectionHeading
              kicker="Eventos"
              title="Eventos do clube"
              description="Agenda, capacidade e estado de cada actividade ligada ao clube."
            />

            {events.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {events.map((event) => (
                  <article key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                          <StatusBadge tone={eventTone(event.status)}>{event.status}</StatusBadge>
                          {event.isHighlighted ? <StatusBadge tone="accent">Destaque</StatusBadge> : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {event.description ?? "Sem descrição disponível."}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          {formatDateTime(event.startsAt)}
                          {event.endsAt ? ` - ${formatDateTime(event.endsAt)}` : ""}
                        </p>
                      </div>

                      <div className="min-w-40 text-sm text-slate-300">
                        <p>{event.location ?? "Local por definir"}</p>
                        <p className="mt-1 text-slate-500">
                          {formatCompactNumber(event.registrationCount)}
                          {event.capacity ? ` / ${formatCompactNumber(event.capacity)}` : " inscritos"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${event.filledPercent ?? 0}%`,
                          backgroundColor: club.accentColor,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem eventos"
                  description="Quando criares o primeiro evento ele aparecerá aqui com capacidade, data e estado."
                />
              </div>
            )}
          </section>

          <section className="surface-card p-6">
            <SectionHeading
              kicker="Inscricoes"
              title="Inscrições recentes"
              description="Histórico dos membros que já se inscreveram em eventos do clube."
            />

            {registrations.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
                <div className="table-shell">
                  <div className="table-head grid grid-cols-[1.2fr_1fr_0.7fr]">
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Membro
                    </div>
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Evento
                    </div>
                    <div className="table-cell text-xs font-semibold uppercase tracking-[0.2em]">
                      Estado
                    </div>
                  </div>

                  {registrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="table-row grid grid-cols-[1.2fr_1fr_0.7fr]"
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
                        <StatusBadge tone={registrationTone(registration.status)}>
                          {registration.status}
                        </StatusBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem inscrições"
                  description="À medida que os membros se inscrevem, o histórico aparecerá nesta secção."
                />
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <JoinClubForm clubId={club.id} clubName={club.name} />
          <EventForm clubId={club.id} clubName={club.name} />

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Ajuda"
              title="Como usar este painel"
              description="Este detalhe junta o cadastro do clube com as funções mais usadas pela equipa."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                1. Adiciona um membro no formulário lateral para o ligar ao clube.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                2. Cria eventos com datas e capacidade para manter a agenda organizada.
              </p>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                3. As listas deste painel reflectem a mesma base usada nos outros ecrãs.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

