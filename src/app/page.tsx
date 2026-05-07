import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getHomeData } from "@/lib/repository";
import { formatDateTime, formatCompactNumber, formatNumber, getInitials } from "@/lib/format";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Painel principal da UniClubs com visao geral dos clubes, membros, eventos e inscricoes.",
};

function toneForEvent(status: string) {
  if (status === "cancelado") {
    return "danger";
  }

  if (status === "finalizado") {
    return "neutral";
  }

  return "success";
}

export default async function Home() {
  const data = await getHomeData();

  return (
    <div>
      <section className="section-shell section-spacing pt-8 lg:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="surface-card-strong p-8 sm:p-10">
            <StatusBadge tone="info">Sistema universitario completo</StatusBadge>
            <h1 className="hero-title mt-6">Gestao moderna para clubes universitarios</h1>
            <p className="hero-copy mt-5">
              A UniClubs organiza clubes, membros, eventos e inscricoes num unico fluxo de
              trabalho. A plataforma foi pensada para parecer um produto institucional serio,
              rapido e facil de operar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/clubes" className="button-primary">
                Explorar clubes
              </Link>
              <Link href="/dashboard" className="button-secondary">
                Ver dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Clubes activos"
                value={formatCompactNumber(data.stats.activeClubCount)}
                helper={`${formatNumber(data.stats.clubCount)} no total`}
              />
              <StatCard
                label="Membros registados"
                value={formatCompactNumber(data.stats.memberCount)}
                helper="Perfis prontos para adesao e inscricoes"
              />
              <StatCard
                label="Eventos futuros"
                value={formatCompactNumber(data.stats.upcomingEventCount)}
                helper="Agenda actualizada em tempo real"
              />
            </div>
          </div>

          <div className="surface-card p-6">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(103,232,249,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.14),_transparent_30%)]" />
              <div className="relative grid gap-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Campus</p>
                    <p className="mt-2 font-display text-xl font-semibold text-white">
                      Hub de clubes da universidade
                    </p>
                  </div>
                  <StatusBadge tone="success">Online</StatusBadge>
                </div>

                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
                  <Image
                    src="/logo_quoruncode.jpg"
                    alt="Logotipo da UniClubs"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                <div className="grid gap-3">
                  {data.upcomingEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {event.clubName}
                          </p>
                          <p className="mt-1 font-semibold text-white">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {event.location ?? "Local a definir"}
                          </p>
                        </div>
                        <StatusBadge tone={toneForEvent(event.status)}>
                          {event.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{formatDateTime(event.startsAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell section-spacing">
        <SectionHeading
          kicker="Visao geral"
          title="Métricas do sistema"
          description="Os principais indicadores sao actualizados a partir da base de dados ou do modo demo."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Inscrições confirmadas"
            value={formatCompactNumber(data.stats.registrationCount)}
            helper="Participantes já aprovados nos eventos"
          />
          <StatCard
            label="Eventos registados"
            value={formatCompactNumber(
              data.topClubs.reduce((total, club) => total + club.eventCount, 0),
            )}
            helper="Somando a actividade visivel dos clubes"
          />
          <StatCard
            label="Clubes activos"
            value={formatCompactNumber(data.stats.activeClubCount)}
            helper="Clubes prontos para captar novos membros"
          />
          <StatCard
            label="Eventos cheios"
            value={formatCompactNumber(data.stats.fullyBookedEventCount)}
            helper="Eventos que atingiram a capacidade"
          />
        </div>
      </section>

      <section className="section-shell section-spacing">
        <SectionHeading
          kicker="Clubes"
          title="Destaques da comunidade"
          description="Alguns dos clubes mais activos da plataforma, com detalhes que ajudam a perceber o ritmo do campus."
          action={<Link href="/clubes" className="button-secondary">Ver todos os clubes</Link>}
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

              <h3 className="font-display mt-4 text-xl font-semibold text-white">{club.name}</h3>
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

              <Link href={`/clubes/${club.id}`} className="button-secondary mt-5 w-full">
                Ver detalhes
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell section-spacing">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card p-6">
            <SectionHeading
              kicker="Fluxo"
              title="Como a UniClubs trabalha"
              description="Do cadastro ao acompanhamento, o sistema foi desenhado para evitar passos desnecessarios."
            />

            <div className="mt-6 space-y-4">
              {[
                {
                  title: "1. Criar clube",
                  text: "Regista a categoria, a identidade visual e o objectivo do grupo.",
                },
                {
                  title: "2. Entrar e organizar membros",
                  text: "Atribui papéis, acompanha adesões e mantém o quadro do clube actualizado.",
                },
                {
                  title: "3. Publicar eventos e inscrições",
                  text: "Agenda actividades, controla a capacidade e acompanha o nível de participação.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Actividade"
              title="Últimos movimentos"
              description="Uma leitura rápida do que está a acontecer no sistema neste momento."
            />

            <div className="mt-6 grid gap-4">
              {data.recentRegistrations.slice(0, 3).map((registration) => (
                <div key={registration.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{registration.memberName}</p>
                      <p className="mt-1 text-sm text-slate-400">{registration.eventTitle}</p>
                    </div>
                    <StatusBadge tone={registration.status === "confirmado" ? "success" : "warning"}>
                      {registration.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{formatDateTime(registration.registeredAt)}</p>
                </div>
              ))}

              {data.recentMembers.slice(0, 3).map((member) => (
                <div key={member.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{member.course ?? member.email}</p>
                      </div>
                    </div>
                    <StatusBadge tone={member.status === "ativo" ? "success" : "warning"}>
                      {member.status}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell section-spacing">
        <div className="surface-card p-6">
          <SectionHeading
            kicker="Categorias"
            title="Mapa rápido dos clubes"
            description="Cada categoria mostra quantos clubes existem e ajuda a perceber a distribuição da comunidade."
          />

          <div className="mt-6 flex flex-wrap gap-3">
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
      </section>
    </div>
  );
}
