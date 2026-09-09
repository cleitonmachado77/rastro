import Link from "next/link";
import { getFeaturedCases } from "@/lib/queries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const cases = await getFeaturedCases();

  return (
    <main className="flex-1">
      <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <svg
            className="absolute inset-0 w-full h-full opacity-40"
            viewBox="0 0 1200 800"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="620" cy="340" r="18" stroke="#7f9e8a" strokeWidth="1.2" className="animate-fade-up" />
            <circle cx="480" cy="280" r="12" stroke="#8fa3b0" strokeWidth="1" className="animate-fade-up-delay" />
            <circle cx="760" cy="260" r="10" stroke="#9aa5b1" strokeWidth="1" className="animate-fade-up-delay" />
            <circle cx="520" cy="420" r="14" stroke="#8fa3b0" strokeWidth="1" className="animate-fade-up-delay-2" />
            <circle cx="700" cy="430" r="22" stroke="#7f9e8a" strokeWidth="1.4" className="animate-fade-up-delay-2" />
            <circle cx="840" cy="380" r="11" stroke="#9aa5b1" strokeWidth="1" />
            <path
              d="M480 280 L620 340 L760 260 M620 340 L520 420 M620 340 L700 430 L840 380"
              stroke="#7f9e8a"
              strokeWidth="1"
              strokeOpacity="0.55"
              className="hero-trace"
            />
          </svg>
        </div>

        <div className="relative mx-auto w-full max-w-[1100px] px-6 py-20">
          <p className="brand-mark text-4xl sm:text-6xl md:text-7xl text-[var(--fg)] animate-fade-up">
            Rastro
          </p>
          <h1 className="display mt-6 max-w-2xl text-2xl sm:text-3xl md:text-4xl text-[var(--fg)] leading-tight animate-fade-up-delay">
            Cada fato deixa um rastro.
            <br />
            Nós conectamos os fatos.
          </h1>
          <p className="mt-5 max-w-xl text-[var(--fg-muted)] text-base sm:text-lg leading-relaxed animate-fade-up-delay-2">
            Explore pessoas, empresas, instituições, acontecimentos e relações ao
            longo do tempo — com fontes e níveis de evidência visíveis.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 animate-fade-up-delay-2">
            <Link href="/casos/banco-aurora" className="btn btn-primary">
              Explorar o mapa
            </Link>
            <Link href="/buscar" className="btn">
              Pesquisar
            </Link>
          </div>
          <p className="mt-8 mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)] animate-fade-up-delay-2">
            Presença no mapa ≠ culpa · Toda afirmação exige fonte
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
                Casos
              </p>
              <h2 className="display text-2xl mt-2">Casos em destaque</h2>
            </div>
            <Link href="/casos" className="text-sm text-[var(--accent)] hover:underline">
              Ver todos
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/casos/${c.slug}`}
                className="group block border border-[var(--line)] p-6 transition-colors hover:border-[var(--accent)] hover:bg-[rgba(127,158,138,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="display text-xl group-hover:text-[var(--accent)] transition-colors">
                    {c.name}
                  </h3>
                  {c.featured && (
                    <span className="chip shrink-0">Destaque</span>
                  )}
                </div>
                <p className="mt-3 text-sm text-[var(--fg-muted)] line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 mono text-[11px] text-[var(--fg-faint)]">
                  <span>{c._count.caseActors} atores</span>
                  <span>{c._count.events} eventos</span>
                  <span>{c._count.sources} fontes</span>
                  <span>
                    Atualizado{" "}
                    {format(c.updatedAt, "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
