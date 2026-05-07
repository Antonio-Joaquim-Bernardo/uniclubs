import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { getViewer } from "@/lib/auth";
import { getStorageLabel } from "@/lib/repository";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/Bahnschrift.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
});

const bodyFont = localFont({
  src: [
    {
      path: "./fonts/SegoeUI.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SegoeUI-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "UniClubs",
    template: "%s | UniClubs",
  },
  description:
    "Sistema web moderno para gerir clubes, membros, eventos e inscricoes da universidade.",
  openGraph: {
    title: "UniClubs",
    description:
      "Sistema web moderno para gerir clubes, membros, eventos e inscricoes da universidade.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();
  const storageLabel = getStorageLabel();

  return (
    <html lang="pt-BR">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {/* O header recebe o utilizador actual para trocar a navegacao consoante o role. */}
        <Header storageLabel={storageLabel} viewer={viewer} />
        <main className="relative z-10">{children}</main>
        <footer className="section-shell pb-10 pt-6 text-sm text-slate-500">
          <div className="surface-card px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                UniClubs foi pensado para a universidade, com foco em fluxo limpo, base de dados
                relacional e interface profissional.
              </p>
              <p className="text-slate-400">Feito com Next.js, PostgreSQL e GitHub.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
