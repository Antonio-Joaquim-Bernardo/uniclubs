import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/auth/login-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login",
  description: "Entrar na plataforma UniClubs com um perfil aprovado.",
};

function dashboardHref(viewer?: Awaited<ReturnType<typeof getViewer>> | null) {
  if (!viewer) {
    return "/login";
  }

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

export default async function LoginPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(dashboardHref(viewer));
  }

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="surface-card-strong p-8 sm:p-10">
          <StatusBadge tone="info">Acesso seguro</StatusBadge>
          <h1 className="hero-title mt-5">Entra com a tua conta</h1>
          <p className="hero-copy mt-5">
            O sistema reconhece o teu papel e mostra apenas as areas relevantes para
            administradores, administradores de clube e membros.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                title: "Admin do sistema",
                text: "Controla clubes, aprovacoes e visao global da universidade.",
              },
              {
                title: "Admin do clube",
                text: "Gere o seu clube, cria eventos e acompanha os membros associados.",
              },
              {
                title: "Membro",
                text: "Consulta clubes, participa em eventos e actualiza o proprio perfil.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cadastro" className="button-secondary">
              Pedir acesso
            </Link>
            <Link href="/clubes" className="button-primary">
              Explorar clubes
            </Link>
          </div>
        </aside>

        <div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
