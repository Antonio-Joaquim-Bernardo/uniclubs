import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-shell section-spacing">
      <div className="surface-card-strong mx-auto max-w-3xl p-8 text-center">
        <p className="section-kicker">404</p>
        <h1 className="hero-title mt-4">Pagina nao encontrada</h1>
        <p className="hero-copy mx-auto mt-4">
          O endereço que procuras nao existe ou foi movido. Volta ao inicio ou segue para a
          lista de clubes.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="button-primary">
            Voltar ao inicio
          </Link>
          <Link href="/clubes" className="button-secondary">
            Ver clubes
          </Link>
        </div>
      </div>
    </div>
  );
}

