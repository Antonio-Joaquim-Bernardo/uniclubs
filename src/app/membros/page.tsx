import type { Metadata } from "next";
import Link from "next/link";
import { CreateMemberForm } from "@/components/forms/create-member-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCompactNumber, formatDateTime, getInitials } from "@/lib/format";
import { listClubChoices, listMembers } from "@/lib/repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membros",
  description: "Lista de membros da UniClubs com cadastro rápido e filtros por clube.",
};

function getStringValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function MembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; clube?: string }>;
}) {
  const params = await searchParams;
  const search = getStringValue(params.q).trim();
  const clubIdValue = getStringValue(params.clube);
  const clubId = clubIdValue ? Number(clubIdValue) : null;

  const [members, clubs] = await Promise.all([
    listMembers(search, Number.isInteger(clubId) ? clubId : null, 40),
    listClubChoices(),
  ]);

  const clubCount = members.reduce((sum, member) => sum + member.clubCount, 0);
  const registrations = members.reduce((sum, member) => sum + member.registrationCount, 0);

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="surface-card-strong p-6 sm:p-8">
            <SectionHeading
              kicker="Membros"
              title="Gestao de membros"
              description="Pesquisa por nome, email ou curso e acompanha rapidamente o envolvimento de cada membro."
              action={
                <Link href="/dashboard/dashboard_membro" className="button-secondary">
                  Ver dashboard de membro
                </Link>
              }
            />

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Membros encontrados"
                value={formatCompactNumber(members.length)}
                helper="Resultados com os filtros actuais"
              />
              <StatCard
                label="Clubes ligados"
                value={formatCompactNumber(clubCount)}
                helper="Somatório das ligações activas"
              />
              <StatCard
                label="Inscrições"
                value={formatCompactNumber(registrations)}
                helper="Participações em eventos"
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
                  placeholder="Nome, email ou curso"
                  className="input-field"
                />
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
                <Link href="/membros" className="button-secondary w-full">
                  Limpar
                </Link>
              </div>
            </form>
          </div>

          {members.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {members.map((member) => (
                <article key={member.id} className="surface-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-semibold text-white">
                          {member.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {member.course ?? member.email}
                        </p>
                      </div>
                    </div>

                    <StatusBadge tone={member.status === "ativo" ? "success" : "warning"}>
                      {member.status}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-slate-500">Clubes</p>
                      <p className="mt-1 font-semibold text-white">{member.clubCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-slate-500">Eventos</p>
                      <p className="mt-1 font-semibold text-white">{member.eventCount}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-slate-500">Inscrições</p>
                      <p className="mt-1 font-semibold text-white">{member.registrationCount}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Registado em {formatDateTime(member.joinedAt)}
                    </p>
                    <Link
                      href={`/dashboard/dashboard_membro?membro=${member.id}`}
                      className="button-secondary px-4 py-2 text-xs"
                    >
                      Abrir dashboard
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhum membro encontrado"
              description="Ajusta os filtros ou cria um novo membro na lateral para começar a registar pessoas."
              action={
                <Link href="/membros" className="button-secondary">
                  Limpar filtros
                </Link>
              }
            />
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <CreateMemberForm />

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Sugestao"
              title="Organizacao por clube"
              description="Os filtros por clube ajudam a localizar membros ligados a uma comunidade específica."
            />

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {clubs.slice(0, 4).map((club) => (
                <div
                  key={club.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span>{club.name}</span>
                  <StatusBadge tone="info">{club.accentColor}</StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

