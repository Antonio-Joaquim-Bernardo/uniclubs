import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { approveAccountAction, rejectAccountAction } from "@/lib/actions";
import { requireRole, listPendingAccounts } from "@/lib/auth";
import { formatCompactNumber, formatDateTime, getInitials } from "@/lib/format";
import { getAdminDashboardData, getStorageLabel } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard administrativo",
  description: "Painel central da UniClubs com indicadores globais, clubes, eventos e inscricoes.",
};

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

export default async function DashboardAdminPage() {
  const viewer = await requireRole(["admin_sistema"]);
  const [data, pendingAccounts] = await Promise.all([getAdminDashboardData(), listPendingAccounts()]);
  const storageLabel = getStorageLabel();

  return (
    <div className="section-shell section-spacing">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="surface-card-strong p-8 sm:p-10">
          <StatusBadge tone="info">Admin global</StatusBadge>
          <h1 className="hero-title mt-5">Dashboard administrativo</h1>
          <p className="hero-copy mt-5">
            Este painel junta os indicadores principais para acompanhar a universidade inteira sem
            perder o foco na operacao do dia a dia.
          </p>

          <p className="mt-4 text-sm text-slate-400">
            Sessao activa: <span className="text-white">{viewer.name}</span>
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/clubes" className="button-primary">
              Gerir clubes
            </Link>
            <Link href="/eventos" className="button-secondary">
              Ver eventos
            </Link>
            <Link href="/inscricoes" className="button-secondary">
              Inscricoes
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Clubes"
              value={formatCompactNumber(data.stats.clubCount)}
              helper="Total registado na plataforma"
            />
            <StatCard
              label="Clubes activos"
              value={formatCompactNumber(data.stats.activeClubCount)}
              helper="Comunidades em funcionamento"
            />
            <StatCard
              label="Membros"
              value={formatCompactNumber(data.stats.memberCount)}
              helper="Perfis da base de dados"
            />
            <StatCard
              label="Eventos futuros"
              value={formatCompactNumber(data.stats.upcomingEventCount)}
              helper="Agenda ainda por acontecer"
            />
          </div>
        </div>

        <div className="surface-card p-6">
          <SectionHeading
            kicker="Estado"
            title="Leitura rapida"
            description="Um resumo operacional para perceber se a plataforma esta saudavel."
          />

          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Armazenamento</span>
              <StatusBadge tone={storageLabel === "PostgreSQL" ? "success" : "warning"}>
                {storageLabel}
              </StatusBadge>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Inscricoes confirmadas</span>
              <strong className="text-white">{formatCompactNumber(data.stats.registrationCount)}</strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Eventos cheios</span>
              <strong className="text-white">
                {formatCompactNumber(data.stats.fullyBookedEventCount)}
              </strong>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Clubes com actividade</span>
              <strong className="text-white">{formatCompactNumber(data.topClubs.length)}</strong>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Categorias</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {data.categories.map((category) => (
                <span key={category.category} className="chip">
                  {category.category}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
                    {category.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <SectionHeading
          kicker="Aprovacoes"
          title="Contas pendentes"
          description="Aprova ou elimina pedidos de acesso antes de darem entrada no sistema."
        />

        {pendingAccounts.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {pendingAccounts.map((account) => (
              <article key={account.id} className="surface-card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                      {getInitials(account.name)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                        <StatusBadge tone="warning">{account.status}</StatusBadge>
                        <StatusBadge tone={account.role === "admin_clube" ? "accent" : "info"}>
                          {account.role}
                        </StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{account.email}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {account.course ?? "Sem curso"} {account.phone ? `- ${account.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <form action={approveAccountAction}>
                      <input type="hidden" name="memberId" value={account.id} />
                      <input type="hidden" name="role" value={account.role} />
                      <input
                        type="hidden"
                        name="clubAdminId"
                        value={account.clubAdminId ?? ""}
                      />
                      <button type="submit" className="button-primary px-4 py-2">
                        Aprovar
                      </button>
                    </form>
                    <form action={rejectAccountAction}>
                      <input type="hidden" name="memberId" value={account.id} />
                      <button type="submit" className="button-secondary px-4 py-2">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Pedido enviado em {formatDateTime(account.createdAt)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Sem contas pendentes"
              description="Quando chegarem novos pedidos de acesso, eles surgem aqui para aprovacao rapida."
            />
          </div>
        )}
      </section>

      <section className="section-spacing">
        <SectionHeading
          kicker="Clubes"
          title="Destaques da comunidade"
          description="Os clubes abaixo mostram onde a actividade esta mais forte neste momento."
          action={
            <Link href="/clubes" className="button-secondary">
              Ver todos os clubes
            </Link>
          }
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {data.topClubs.map((club) => (
            <article key={club.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="h-3 w-16 rounded-full"
                  style={{ backgroundColor: club.accentColor }}
                />
                <StatusBadge tone="info">{club.category}</StatusBadge>
              </div>

              <h2 className="font-display mt-4 text-xl font-semibold text-white">{club.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{club.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-500">Membros</p>
                  <p className="mt-1 font-semibold text-white">{club.memberCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-500">Eventos</p>
                  <p className="mt-1 font-semibold text-white">{club.eventCount}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card p-6">
          <SectionHeading
            kicker="Agenda"
            title="Proximos eventos"
            description="Eventos activos e futuros com lotacao e clube associados."
            action={
              <Link href="/eventos" className="button-secondary">
                Ver todos
              </Link>
            }
          />

          {data.upcomingEvents.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {data.upcomingEvents.map((event) => (
                <article key={event.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 h-11 w-2.5 rounded-full"
                        style={{ backgroundColor: event.clubColor }}
                      />
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {event.clubName}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                          <StatusBadge tone={eventTone(event.status)}>{event.status}</StatusBadge>
                          {event.isHighlighted ? <StatusBadge tone="accent">Destaque</StatusBadge> : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {event.description ?? "Sem descricao disponivel."}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-slate-300">
                      <p>{event.location ?? "Local por definir"}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(event.startsAt)}
                        {event.endsAt ? ` - ${formatDateTime(event.endsAt)}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inscricoes</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {formatCompactNumber(event.registrationCount)}
                        {event.capacity ? ` / ${formatCompactNumber(event.capacity)}` : " participantes"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lotacao</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {event.filledPercent === null ? "aberto" : `${event.filledPercent}%`}
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
            <EmptyState
              title="Sem eventos futuros"
              description="Quando houver agenda activa, os eventos aparecem aqui com o respectivo clube e capacidade."
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card p-6">
            <SectionHeading
              kicker="Membros"
              title="Registos recentes"
              description="Os membros mais recentes ajudam a validar a actividade da plataforma."
            />

            <div className="mt-6 space-y-3">
              {data.recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{member.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.course ?? member.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(member.joinedAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Inscricoes"
              title="Ultimos movimentos"
              description="Os registos mais recentes em eventos da comunidade."
            />

            <div className="mt-6 grid gap-3">
              {data.recentRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{registration.memberName}</p>
                      <p className="mt-1 text-sm text-slate-400">{registration.eventTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">{registration.clubName}</p>
                    </div>
                    <StatusBadge tone={registrationTone(registration.status)}>
                      {registration.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {formatDateTime(registration.registeredAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
