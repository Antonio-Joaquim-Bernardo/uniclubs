import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireViewer } from "@/lib/auth";
import { formatCompactNumber, formatDateTime, getInitials } from "@/lib/format";
import { getMemberDashboardData, listMemberChoices } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard do membro",
  description: "Painel pessoal com clubes, eventos e inscricoes associadas a um membro.",
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

export default async function DashboardMembroPage({
  searchParams,
}: {
  searchParams: Promise<{ membro?: string }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const memberIdValue = getStringValue(params.membro);

  const memberChoices = await listMemberChoices();

  if (memberChoices.length === 0 && viewer.role === "admin_sistema") {
    return (
      <div className="section-shell section-spacing">
        <EmptyState
          title="Sem membros"
          description="Cria o primeiro membro na secao de membros para abrir este dashboard pessoal."
          action={
            <Link href="/membros" className="button-secondary">
              Criar membro
            </Link>
          }
        />
      </div>
      );
  }

  const selectedMember =
    viewer.role === "admin_sistema"
      ? memberChoices.find((member) => String(member.id) === memberIdValue) ?? memberChoices[0]
      : memberChoices.find((member) => member.id === viewer.id) ?? memberChoices[0];

  if (!selectedMember) {
    notFound();
  }

  const detail = await getMemberDashboardData(selectedMember.id);

  if (!detail) {
    notFound();
  }

  const { member, clubs, events, registrations, stats } = detail;

  return (
    <div className="section-shell section-spacing">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="surface-card-strong p-8 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone="info">Dashboard pessoal</StatusBadge>
            <StatusBadge tone={member.status === "ativo" ? "success" : "warning"}>
              {member.status}
            </StatusBadge>
            <StatusBadge tone="accent">{member.course ?? "Sem curso"}</StatusBadge>
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-lg font-semibold text-cyan-200">
              {getInitials(member.name)}
            </div>
            <div>
              <h1 className="hero-title">{member.name}</h1>
              <p className="hero-copy mt-4">
                {member.email}
                {member.phone ? `  -  ${member.phone}` : ""}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Sessao activa: <span className="text-white">{viewer.name}</span>
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Clubes"
              value={formatCompactNumber(member.clubCount)}
              helper="Comunidades em que participa"
            />
            <StatCard
              label="Eventos"
              value={formatCompactNumber(member.eventCount)}
              helper="Participacoes registadas"
            />
            <StatCard
              label="Inscricoes"
              value={formatCompactNumber(member.registrationCount)}
              helper="Historico de participacao"
            />
            <StatCard
              label="Eventos futuros"
              value={formatCompactNumber(stats.upcomingEventCount)}
              helper="Agenda activa da plataforma"
            />
          </div>
        </div>

        <div className="surface-card p-6">
          <SectionHeading
            kicker="Troca rapida"
            title="Escolher outro membro"
            description="A pagina funciona como um portal pessoal e permite alternar entre perfis."
          />

          <form method="get" className="mt-5 space-y-4">
            {viewer.role === "admin_sistema" ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="membro" className="text-sm font-semibold text-slate-100">
                    Membro
                  </label>
                  <select
                    id="membro"
                    name="membro"
                    defaultValue={selectedMember.id}
                    className="select-field"
                  >
                    {memberChoices.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.email}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="button-primary w-full">
                  Carregar membro
                </button>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Este painel mostra apenas a tua conta.
              </div>
            )}
          </form>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Data de entrada</span>
              <strong className="text-white">{formatDateTime(member.joinedAt)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Clubes activos na plataforma</span>
              <strong className="text-white">{formatCompactNumber(stats.activeClubCount)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Eventos da conta</span>
              <strong className="text-white">{formatCompactNumber(member.eventCount)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Estado</span>
              <strong className="text-white">{member.status}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="surface-card p-6">
            <SectionHeading
              kicker="Clubes"
              title="Clubes associados"
              description="Cada card abaixo resume a relacao do membro com a comunidade."
            />

            {clubs.length > 0 ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {clubs.map((club) => (
                  <article key={club.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-1 h-11 w-2.5 rounded-full"
                          style={{ backgroundColor: club.accentColor }}
                        />
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            {club.category}
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-white">{club.name}</h3>
                        </div>
                      </div>
                      <StatusBadge tone={club.status === "ativo" ? "success" : "warning"}>
                        {club.status}
                      </StatusBadge>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-400">{club.description}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-slate-500">Membros</p>
                        <p className="mt-1 font-semibold text-white">{club.memberCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-slate-500">Eventos</p>
                        <p className="mt-1 font-semibold text-white">{club.eventCount}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        {club.nextEventAt ? `Proximo ${formatDateTime(club.nextEventAt)}` : "Sem evento futuro"}
                      </p>
                      <Link href={`/clubes/${club.id}`} className="button-secondary px-4 py-2 text-xs">
                        Abrir
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem clubes associados"
                  description="Este membro ainda nao entrou em nenhum clube activo."
                />
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Eventos"
              title="Eventos ligados ao membro"
              description="A lista mostra em que momentos o membro esteve envolvido."
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
                        <p>{event.clubName}</p>
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
                          backgroundColor: event.clubColor,
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
                  description="Quando o membro participar em eventos, o historico aparece aqui."
                />
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Inscricoes"
              title="Movimento recente"
              description="Os registos mais recentes mostram o ritmo de participacao do membro."
            />

            {registrations.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
                <div className="table-shell">
                  <div className="table-head grid grid-cols-[1.1fr_1fr_0.7fr]">
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
                      className="table-row grid grid-cols-[1.1fr_1fr_0.7fr]"
                    >
                      <div className="table-cell">
                        <p className="font-semibold text-white">{registration.eventTitle}</p>
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
            ) : (
              <div className="mt-6">
                <EmptyState
                  title="Sem inscricoes"
                  description="Assim que o membro se inscrever em eventos, o historico aparece aqui."
                />
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <div className="surface-card p-6">
            <SectionHeading
              kicker="Acesso"
              title="Links uteis"
              description="Atalhos para continuar a gestao sem abandonar o fluxo."
            />

            <div className="mt-5 flex flex-col gap-3">
              <Link href="/membros" className="button-primary">
                Gerir membros
              </Link>
              <Link href="/clubes" className="button-secondary">
                Explorar clubes
              </Link>
              <Link href="/eventos" className="button-secondary">
                Ver eventos
              </Link>
              <Link href="/perfil" className="button-secondary">
                Editar perfil
              </Link>
            </div>
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Resumo"
              title="Perfil rapido"
              description="Dados essenciais do membro seleccionado no momento."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Email</span>
                <strong className="text-white">{member.email}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Telefone</span>
                <strong className="text-white">{member.phone ?? "Sem telefone"}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Curso</span>
                <strong className="text-white">{member.course ?? "Sem curso"}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Registado em</span>
                <strong className="text-white">{formatDateTime(member.joinedAt)}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
