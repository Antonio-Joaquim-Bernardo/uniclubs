import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { StatusBadge } from "@/components/ui/status-badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conta pendente",
  description: "Estado de aprovacao da conta UniClubs.",
};

export default async function PendendePage({
  searchParams,
}: {
  searchParams?: Promise<{ email?: string }>;
}) {
  const viewer = await getViewer();
  const params = searchParams ? await searchParams : {};
  const emailFromQuery = params.email?.trim() || null;

  return (
    <div className="section-shell section-spacing">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="surface-card-strong p-8 sm:p-10">
          <StatusBadge tone="warning">A aguardar aprovacao</StatusBadge>
          <h1 className="hero-title mt-5">A tua conta ainda esta pendente</h1>
          <p className="hero-copy mt-5">
            Assim que o administrador aprovar o registo, podes entrar e a plataforma vai abrir
            automaticamente o dashboard certo para o teu perfil.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-semibold text-white">Passo actual</p>
              <p className="mt-2 leading-6">
                Se acabaste de criar conta, espera pela confirmacao. Se ja foste aprovado, volta
                ao login para entrar novamente.
              </p>
            </div>

            {emailFromQuery ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Conta enviada</p>
                <p className="mt-2 leading-6">{emailFromQuery}</p>
              </div>
            ) : null}

            {viewer ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Sessao actual</p>
                <p className="mt-2 leading-6">
                  {viewer.name} - {viewer.email}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="button-primary">
              Voltar ao login
            </Link>
            <Link href="/clubes" className="button-secondary">
              Explorar clubes
            </Link>
          </div>
        </section>

        <aside className="surface-card p-6">
          <p className="section-kicker">O que vem a seguir</p>
          <h2 className="panel-title mt-2">Fluxo de aprovacao</h2>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              1. O pedido chega ao painel administrativo.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              2. O administrador revê os dados e aprova a conta.
            </p>
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              3. Depois da aprovacao, o login abre o dashboard correcto.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
