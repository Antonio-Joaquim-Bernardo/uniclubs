import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth/register-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { getViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Pedir uma conta UniClubs e aguardar aprovacao.",
};

function dashboardHref(viewer?: Awaited<ReturnType<typeof getViewer>> | null) {
  if (!viewer) {
    return "/cadastro";
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

export default async function CadastroPage() {
  const viewer = await getViewer();

  if (viewer) {
    redirect(dashboardHref(viewer));
  }

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <aside className="surface-card-strong p-8 sm:p-10">
          <StatusBadge tone="accent">Nova conta</StatusBadge>
          <h1 className="hero-title mt-5">Pedir acesso ao UniClubs</h1>
          <p className="hero-copy mt-5">
            O pedido fica pendente ate o administrador aprovar a tua conta. Depois disso, o
            acesso entra automaticamente no painel correcto.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fluxo</p>
              <p className="mt-2 font-semibold text-white">Pedido -> aprovacao -> acesso</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Seguranca</p>
              <p className="mt-2 font-semibold text-white">Cookie HTTP-only e password protegida</p>
            </div>
          </div>

          <div className="mt-8 space-y-3 text-sm text-slate-300">
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              A conta pode ser aprovada por administracao antes de ficar activa.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Depois de aprovada, a plataforma mostra o dashboard certo para o teu papel.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="button-secondary">
              Ja tenho conta
            </Link>
            <Link href="/clubes" className="button-primary">
              Ver clubes
            </Link>
          </div>
        </aside>

        <div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
