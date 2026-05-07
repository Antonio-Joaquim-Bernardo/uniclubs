import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/forms/event-form";
import { JoinClubForm } from "@/components/forms/join-club-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireViewer } from "@/lib/auth";
import { formatCompactNumber, formatDateTime, getInitials } from "@/lib/format";
import { getClubDashboardData, listClubChoices } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard do clube",
  description: "Painel de um clube com membros, eventos, inscricoes e formularios de acao rapida.",
};

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

function registrationTone(status: string) {
  if (status === "cancelado") {
    return "danger";
  }

  if (status === "pendente") {
    return "warning";
  }

  return "success";
}

export default async function DashboardAdminClubePage({
  searchParams,
}: {
  searchParams: Promise<{ clube?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const clubIdValue = getStringValue(params.clube);

  const clubChoices = await listClubChoices();
  const accessibleClubs =
    viewer.role === "admin_sistema"
      ? clubChoices
      : clubChoices.filter((club) => club.id === viewer.clubAdminId);

  if (accessibleClubs.length === 0) {
    return (
      <div className="section-shell section-spacing">
        <EmptyState
          title="Sem clubes"
          description="Cria o primeiro clube na secao de clubes para desbloquear o dashboard por clube."
          action={
            <Link href="/clubes" className="button-secondary">
              Criar clube
            </Link>
          }
        />
      </div>
      );
  }

  const selectedClub =
    viewer.role === "admin_sistema"
      ? accessibleClubs.find((club) => String(club.id) === clubIdValue) ?? accessibleClubs[0]
      : accessibleClubs[0];

  if (!selectedClub) {
    notFound();
  }

  const detail = await getClubDashboardData(selectedClub.id);

  if (!detail) {
    notFound();
  }

  const { club, members, events, registrations, stats } = detail;

  return (
    <div className="section-shell section-spacing">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card-strong p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="info">Dashboard do clube</StatusBadge>
            <StatusBadge tone={club.status === "ativo" ? "success" : "warning"}>{club.status}</StatusBadge>
            <StatusBadge tone="accent">{club.category}</StatusBadge>
          </div>

          <h1 className="hero-title mt-5">{club.name}</h1>
          <p className="hero-copy mt-5">{club.description}</p>
          <p className="mt-4 text-sm text-slate-400">
            Sessao activa: <span className="text-white">{viewer.name}</span>
          </p>

          {club.objective ? (
            <p className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              {club.objective}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/clubes/${club.id}`} className="button-primary">
              Abrir detalhe do clube
            </Link>
            {viewer.role === "admin_sistema" ? (
              <Link href="/clubes" className="button-secondary">
                Mudar clube
              </Link>
            ) : null}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Membros"
              value={formatCompactNumber(club.memberCount)}
              helper="Ligados ao clube"
            />
            <StatCard
              label="Eventos"
              value={formatCompactNumber(club.eventCount)}
              helper="Agenda do clube"
            />
            <StatCard
              label="Inscricoes"
              value={formatCompactNumber(registrations.length)}
              helper="Historico do clube"
            />
            <StatCard
              label="Proximo evento"
              value={club.nextEventAt ? formatDateTime(club.nextEventAt) : "Sem data"}
              helper="Pronto para planear"
            />
          </div>
        </div>

        <div className="surface-card p-6">
          <SectionHeading
            kicker="Troca rapida"
            title="Escolher outro clube"
            description="A lista abaixo deixa o dashboard sempre ligado ao clube certo."
          />

          <form method="get" className="mt-5 space-y-4">
            {viewer.role === "admin_sistema" ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="clube" className="text-sm font-semibold text-slate-100">
                    Clube
                  </label>
                  <select
                    id="clube"
                    name="clube"
                    defaultValue={selectedClub.id}
                    className="select-field"
                  >
                    {accessibleClubs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="button-primary w-full">
                  Carregar clube
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                A tua sessao esta ligada ao clube {selectedClub.name}.
              </div>
            )}
          </form>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Cor principal</span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: club.accentColor }} />
                <strong className="text-white">{club.accentColor}</strong>
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Local</span>
              <strong className="text-white">{club.location ?? "Sem local"}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Clubes na plataforma</span>
              <strong className="text-white">{formatCompactNumber(stats.clubCount)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Membros totais</span>
              <strong className="text-white">{formatCompactNumber(stats.memberCount)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <SectionHeading
              kicker="Membros"
              title="Pessoas ligadas ao clube"
              description="Lista os membros com o respectivo papel e data de entrada."
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
                      <StatusBadge tone={member.status === "ativo" ? "success" : "warning"}>
                        {member.status}
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
                  description="Adiciona o primeiro membro no painel lateral para começar a construir a comunidade."
                />
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Eventos"
              title="Agenda do clube"
              description="Acompanhe lotacao, destaque e estado de cada evento ligado ao clube."
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
                          {event.description ?? "Sem descricao disponivel."}
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
                  description="Quando criares o primeiro evento ele vai aparecer aqui com capacidade e estado."
                />
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Inscricoes"
              title="Historico recente"
              description="Visao consolidada das inscricoes mais recentes dentro deste clube."
            />

            {registrations.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
                <div className="table-shell">
                  <div className="table-head grid grid-cols-[1.15fr_1fr_0.7fr]">
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
                      className="table-row grid grid-cols-[1.15fr_1fr_0.7fr]"
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
                  title="Sem inscricoes"
                  description="Assim que houver participacao nos eventos deste clube, o historico fica visivel aqui."
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <JoinClubForm clubId={club.id} clubName={club.name} />
          <EventForm clubId={club.id} clubName={club.name} />

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Resumo"
              title="Identidade do clube"
              description="Os detalhes abaixo ajudam a reconhecer rapidamente o clube actual."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Categoria</span>
                <strong className="text-white">{club.category}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Local</span>
                <strong className="text-white">{club.location ?? "Sem local"}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Cor principal</span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: club.accentColor }} />
                  <strong className="text-white">{club.accentColor}</strong>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Criado em</span>
                <strong className="text-white">{formatDateTime(club.createdAt)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
