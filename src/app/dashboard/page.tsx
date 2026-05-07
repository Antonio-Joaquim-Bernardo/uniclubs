import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Portal central para escolher entre o painel administrativo, de clube e de membro.",
};

function dashboardHref(viewer: Awaited<ReturnType<typeof getViewer>>) {
  if (viewer.status === "pendente") {
    return "/pendente";
  }

  if (viewer.role === "admin_sistema") {
    return "/dashboard/dashboard_admin";
  }

  if (viewer.role === "admin_clube") {
    return "/dashboard/dashboard_admin_clube";
  }

  return "/dashboard/dashboard_membro";
}

export default async function DashboardHubPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(dashboardHref(viewer));
  }

  return (
    <div className="section-shell section-spacing">
      <section className="surface-card-strong p-8 sm:p-10">
        <StatusBadge tone="info">Portal de dashboards</StatusBadge>
        <h1 className="hero-title mt-5">Escolhe o ponto de entrada certo</h1>
        <p className="hero-copy mt-5">
          A UniClubs organiza os perfis por papel. Entra com a tua conta ou pede acesso se ainda
          nao tens credenciais.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="button-primary">
            Login
          </Link>
          <Link href="/cadastro" className="button-secondary">
            Criar conta
          </Link>
          <Link href="/clubes" className="button-secondary">
            Explorar clubes
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Administracao global"
            value="3"
            helper="Visao geral da plataforma e dos indicadores principais"
          />
          <StatCard
            label="Clube seleccionado"
            value="3"
            helper="Painel focado na rotina de um clube especifico"
          />
          <StatCard
            label="Perfil pessoal"
            value="3"
            helper="Experiencia do membro com clubes, eventos e inscricoes"
          />
        </div>
      </section>

      <section className="section-spacing">
        <SectionHeading
          kicker="Guias"
          title="O que cada painel faz"
          description="Mantemos os tres acessos separados para a experiencia ficar limpa e previsivel."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="surface-card p-6">
            <StatusBadge tone="info">Global</StatusBadge>
            <h2 className="font-display mt-4 text-2xl font-semibold text-white">
              Operacao da universidade
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Acompanha clubes, eventos, categorias e inscricoes numa unica vista.
            </p>
          </article>

          <article className="surface-card p-6">
            <StatusBadge tone="accent">Clube</StatusBadge>
            <h2 className="font-display mt-4 text-2xl font-semibold text-white">
              Gestao da comunidade
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Junta membros, eventos e inscricoes de um clube com formularios de acao rapida.
            </p>
          </article>

          <article className="surface-card p-6">
            <StatusBadge tone="success">Membro</StatusBadge>
            <h2 className="font-display mt-4 text-2xl font-semibold text-white">
              Perfil individual
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Mostra a ligacao do membro aos clubes, aos eventos e ao historico de participacao.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
