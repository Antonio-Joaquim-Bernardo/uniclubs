import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/auth/profile-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatCompactNumber, getInitials } from "@/lib/format";
import { getMemberDetail } from "@/lib/repository";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perfil",
  description: "Editar dados pessoais e rever o resumo da conta UniClubs.",
};

function dashboardHref(role: string) {
  if (role === "admin_sistema") {
    return "/dashboard/dashboard_admin";
  }

  if (role === "admin_clube") {
    return "/dashboard/dashboard_admin_clube";
  }

  return "/dashboard/dashboard_membro";
}

export default async function PerfilPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.status === "pendente") {
    redirect("/pendente");
  }

  const detail = await getMemberDetail(viewer.id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <ProfileForm viewer={viewer} />

        <aside className="space-y-6">
          <div className="surface-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                  {getInitials(viewer.name)}
                </div>
                <div>
                  <p className="section-kicker">Conta actual</p>
                  <h2 className="panel-title mt-1">{viewer.name}</h2>
                </div>
              </div>
              <StatusBadge
                tone={viewer.role === "admin_sistema" ? "accent" : viewer.role === "admin_clube" ? "info" : "success"}
              >
                {viewer.role}
              </StatusBadge>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Email</span>
                <strong className="text-white">{viewer.email}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Estado</span>
                <strong className="text-white">{viewer.status}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Entrada</span>
                <strong className="text-white">{formatDateTime(detail.member.joinedAt)}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Telefone</span>
                <strong className="text-white">{viewer.phone ?? "Sem telefone"}</strong>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={dashboardHref(viewer.role)} className="button-secondary">
                Abrir dashboard
              </Link>
              <Link href="/logout" className="button-primary">
                Terminar sessao
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <StatCard
              label="Clubes ligados"
              value={formatCompactNumber(detail.member.clubCount)}
              helper="Ligacoes activas do perfil"
            />
            <StatCard
              label="Eventos"
              value={formatCompactNumber(detail.member.eventCount)}
              helper="Participacao acumulada"
            />
            <StatCard
              label="Inscricoes"
              value={formatCompactNumber(detail.member.registrationCount)}
              helper="Historico deste perfil"
            />
          </div>

          <div className="surface-card p-6">
            <SectionHeading
              kicker="Movimento"
              title="Ultimos clubes"
              description="Alguns dos clubes ligados ao teu perfil."
            />

            <div className="mt-5 space-y-3">
              {detail.clubs.slice(0, 3).map((club) => (
                <div
                  key={club.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="text-sm text-slate-200">{club.name}</span>
                  <StatusBadge tone={club.status === "ativo" ? "success" : "warning"}>
                    {club.status}
                  </StatusBadge>
                </div>
              ))}

              {detail.clubs.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                  Ainda nao tens clubes ligados a esta conta.
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
