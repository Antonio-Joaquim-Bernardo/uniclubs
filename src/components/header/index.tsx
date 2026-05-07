"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Viewer } from "@/lib/domain";
import { StatusBadge } from "@/components/ui/status-badge";

type NavItem = {
  href: string;
  label: string;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(viewer: Viewer) {
  if (viewer.status === "pendente") {
    return "Aguardar aprovacao";
  }

  if (viewer.role === "admin_sistema") {
    return "Admin do sistema";
  }

  if (viewer.role === "admin_clube") {
    return "Admin do clube";
  }

  return "Membro";
}

function roleTone(viewer: Viewer): "accent" | "info" | "success" | "warning" {
  if (viewer.status === "pendente") {
    return "warning";
  }

  if (viewer.role === "admin_sistema") {
    return "accent";
  }

  if (viewer.role === "admin_clube") {
    return "info";
  }

  return "success";
}

function getDashboardHref(viewer?: Viewer | null) {
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

function getNavItems(viewer?: Viewer | null): NavItem[] {
  const dashboardHref = getDashboardHref(viewer);

  if (!viewer) {
    return [
      { href: "/", label: "Home" },
      { href: "/clubes", label: "Clubes" },
      { href: "/eventos", label: "Eventos" },
      { href: "/login", label: "Login" },
      { href: "/cadastro", label: "Criar conta" },
    ];
  }

  return [
    { href: "/", label: "Home" },
    { href: "/clubes", label: "Clubes" },
    { href: "/eventos", label: "Eventos" },
    { href: "/membros", label: "Membros" },
    { href: dashboardHref, label: "Dashboard" },
    { href: "/perfil", label: "Perfil" },
  ];
}

function HeaderShell({
  pathname,
  storageLabel,
  viewer,
}: {
  pathname: string;
  storageLabel: string;
  viewer: Viewer | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavItems(viewer);
  const dashboardHref = getDashboardHref(viewer);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-cyan-500/10">
            <Image
              src="/logo_quoruncode.jpg"
              alt="UniClubs"
              fill
              priority
              className="object-cover"
            />
          </span>
          <span className="leading-tight">
            <span className="font-display block text-lg font-semibold text-white">UniClubs</span>
            <span className="block text-xs text-slate-400">
              {viewer ? roleLabel(viewer) : "Gestao de clubes universitarios"}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "chip chip-accent" : "chip"}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <StatusBadge tone={storageLabel === "PostgreSQL" ? "success" : "warning"}>
            {storageLabel}
          </StatusBadge>

          {viewer ? (
            <StatusBadge tone={roleTone(viewer)}>{roleLabel(viewer)}</StatusBadge>
          ) : null}

          {viewer ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/perfil" className="button-secondary px-4 py-2">
                {viewer.name}
              </Link>
              <Link href="/logout" className="button-primary px-4 py-2">
                Sair
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="button-secondary px-4 py-2">
                Login
              </Link>
              <Link href="/cadastro" className="button-primary px-4 py-2">
                Criar conta
              </Link>
            </div>
          )}

          <button
            type="button"
            className="button-secondary px-4 py-2 lg:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-expanded={mobileOpen}
            aria-label="Abrir menu de navegacao"
          >
            {mobileOpen ? "Fechar" : "Menu"}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="section-shell pb-4 lg:hidden">
          <div className="surface-card p-4">
            <nav className="grid gap-2">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "chip chip-accent justify-center" : "chip justify-center"}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 flex flex-col gap-3">
              {viewer ? (
                <>
                  <Link href="/perfil" className="button-secondary">
                    {viewer.name}
                  </Link>
                  <Link href="/logout" className="button-primary">
                    Sair
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="button-secondary">
                    Login
                  </Link>
                  <Link href="/cadastro" className="button-primary">
                    Criar conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {viewer ? (
        <div className="section-shell pb-4">
          <div className="surface-card px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white">{viewer.name}</p>
                <p className="text-xs text-slate-500">{viewer.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={roleTone(viewer)}>{roleLabel(viewer)}</StatusBadge>
                <Link href={dashboardHref} className="button-secondary px-4 py-2">
                  Ir para dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function Header({
  storageLabel,
  viewer,
}: {
  storageLabel: string;
  viewer: Viewer | null;
}) {
  const pathname = usePathname();

  return <HeaderShell key={pathname} pathname={pathname} storageLabel={storageLabel} viewer={viewer} />;
}
