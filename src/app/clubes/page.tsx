import type { Metadata } from "next";
import Link from "next/link";
import { ClubForm } from "@/components/forms/club-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCompactNumber, formatDateTime } from "@/lib/format";
import { getHomeData, listClubCategories, listClubs } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clubes",
  description: "Lista de clubes, filtro por categoria e formulário para criar novos clubes.",
};

function getStringValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function ClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const search = getStringValue(params.q).trim();
  const category = getStringValue(params.categoria) || "all";

  const [clubs, categories, homeData] = await Promise.all([
    listClubs(search, category, 24),
    listClubCategories(),
    getHomeData(),
  ]);

  const totalMembers = clubs.reduce((sum, club) => sum + club.memberCount, 0);
  const totalEvents = clubs.reduce((sum, club) => sum + club.eventCount, 0);

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="surface-card-strong p-6 sm:p-8">
            <SectionHeading
              kicker="Clubes"
              title="Explora a rede de clubes"
              description="Filtra por categoria, pesquisa por nome e acompanha o estado de cada comunidade."
              action={
                <Link href="/dashboard/dashboard_admin" className="button-secondary">
                  Dashboard administrativo
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Clubes listados"
                value={formatCompactNumber(clubs.length)}
                helper="Resultados visiveis para os filtros actuais"
              />
              <StatCard
                label="Membros somados"
                value={formatCompactNumber(totalMembers)}
                helper="Total agregado dos clubes carregados"
              />
              <StatCard
                label="Eventos somados"
                value={formatCompactNumber(totalEvents)}
                helper="Actividade dos clubes mostrados"
              />
            </div>

            <form method="get" className="mt-6 grid gap-4 md:grid-cols-[1.4fr_0.8fr_auto]">
              <div className="space-y-2">
                <label htmlFor="q" className="text-sm font-semibold text-slate-100">
                  Pesquisar
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={search}
                  placeholder="Procurar por nome, descrição ou categoria"
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="categoria" className="text-sm font-semibold text-slate-100">
                  Categoria
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  defaultValue={category}
                  className="select-field"
                >
                  <option value="all">Todas</option>
                  {categories.map((item) => (
                    <option key={item.category} value={item.category}>
                      {item.category} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 self-end">
                <button type="submit" className="button-primary w-full">
                  Filtrar
                </button>
                <Link href="/clubes" className="button-secondary w-full">
                  Limpar
                </Link>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((item) => (
                <span key={item.category} className="chip">
                  {item.category}
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-200">
                    {item.count}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {clubs.length > 0 ? (
            <div className="grid gap-4">
              {clubs.map((club) => (
                <article key={club.id} className="surface-card p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className="mt-1 h-14 w-2 rounded-full"
                        style={{ backgroundColor: club.accentColor }}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="font-display text-2xl font-semibold text-white">{club.name}</h2>
                          <StatusBadge tone="info">{club.category}</StatusBadge>
                        </div>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                          {club.description}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Criado em {formatDateTime(club.createdAt)}
                        </p>
                      </div>
                    </div>

                    <Link href={`/clubes/${club.id}`} className="button-secondary shrink-0">
                      Ver detalhes
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Membros</p>
                      <p className="mt-2 font-display text-2xl font-semibold text-white">
                        {club.memberCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Eventos</p>
                      <p className="mt-2 font-display text-2xl font-semibold text-white">
                        {club.eventCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Próximo</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {club.nextEventAt ? formatDateTime(club.nextEventAt) : "Sem evento futuro"}
                      </p>
                    </div>
                  </div>

                  {club.objective ? (
                    <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-6 text-slate-300">
                      {club.objective}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum clube encontrado"
              description="Experimenta outro termo de pesquisa ou uma categoria diferente. Se quiseres, podes criar um novo clube na lateral."
              action={
                <Link href="/clubes" className="button-secondary">
                  Limpar filtros
                </Link>
              }
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <ClubForm />

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Resumo"
              title="Leitura rápida"
              description="Os clubes listados aqui reflectem a mesma base usada no resto da aplicação."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Total no dashboard</span>
                <strong className="text-white">{homeData.stats.clubCount}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Base de dados</span>
                <strong className="text-white">PostgreSQL + demo fallback</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Layout</span>
                <strong className="text-white">Fluxo em cards e filtros</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

