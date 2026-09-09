import Link from "next/link";
import { getFeaturedCases } from "@/lib/queries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function CasosPage() {
  const cases = await getFeaturedCases();

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-12 flex-1">
      <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
        Índice
      </p>
      <h1 className="display text-3xl mt-2">Casos</h1>
      <p className="mt-3 max-w-2xl text-[var(--fg-muted)]">
        Cada caso é um mapa de atores, eventos, relações e fontes. Comece pelo
        caso fictício Banco Aurora para explorar o núcleo do produto.
      </p>

      <ul className="mt-10 space-y-3">
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/casos/${c.slug}`}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 border border-[var(--line)] px-5 py-4 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <h2 className="display text-lg">{c.name}</h2>
                <p className="text-sm text-[var(--fg-muted)] mt-1 line-clamp-1">
                  {c.currentSituation ?? c.description}
                </p>
              </div>
              <div className="mono text-[11px] text-[var(--fg-faint)] flex gap-4 shrink-0">
                <span>{c._count.caseActors} atores</span>
                <span>{c._count.events} eventos</span>
                <span>{c._count.sources} fontes</span>
                <span>
                  {format(c.updatedAt, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
