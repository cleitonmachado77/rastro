import Link from "next/link";
import { searchAll } from "@/lib/queries";
import { FACT_STATUS_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function BuscarPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = await searchAll(q);

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 py-12 flex-1">
      <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
        Busca global
      </p>
      <h1 className="display text-3xl mt-2">Buscar</h1>
      <p className="mt-3 text-[var(--fg-muted)] max-w-xl">
        Pessoas, empresas, instituições, eventos, casos e fontes — por nome,
        alias ou trecho.
      </p>

      <form className="mt-8 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          className="input"
          placeholder="Ex.: Empresário A, Contrato, Aurora…"
          autoFocus
        />
        <button type="submit" className="btn btn-primary shrink-0">
          Buscar
        </button>
      </form>

      {!q.trim() ? (
        <p className="mt-10 text-sm text-[var(--fg-faint)]">
          Digite um termo para começar.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          <ResultGroup title="Casos" empty={results.cases.length === 0}>
            {results.cases.map((c) => (
              <Link
                key={c.id}
                href={`/casos/${c.slug}`}
                className="block border border-[var(--line)] px-4 py-3 hover:border-[var(--accent)]"
              >
                <span className="display text-lg">{c.name}</span>
                <span className="block text-sm text-[var(--fg-muted)] mt-1 line-clamp-2">
                  {c.description}
                </span>
              </Link>
            ))}
          </ResultGroup>

          <ResultGroup title="Atores" empty={results.actors.length === 0}>
            {results.actors.map((a) => (
              <div
                key={a.id}
                className="border border-[var(--line)] px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="display text-lg">{a.name}</span>
                  <span className="chip">{a.primaryType.replace(/_/g, " ")}</span>
                </div>
                {a.aliases.length > 0 && (
                  <p className="mono text-[11px] text-[var(--fg-faint)] mt-1">
                    aliases: {a.aliases.map((x) => x.alias).join(", ")}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {a.caseActors.map((ca) => (
                    <Link
                      key={ca.caseId}
                      href={`/casos/${ca.case.slug}`}
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      {ca.case.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </ResultGroup>

          <ResultGroup title="Eventos" empty={results.events.length === 0}>
            {results.events.map((e) => (
              <Link
                key={e.id}
                href={`/casos/${e.case.slug}`}
                className="block border border-[var(--line)] px-4 py-3 hover:border-[var(--accent)]"
              >
                <span className="display">{e.title}</span>
                <span className="block chip mt-2 w-fit">
                  {FACT_STATUS_LABELS[e.factStatus] ?? e.factStatus}
                </span>
                <span className="block text-sm text-[var(--fg-muted)] mt-2">
                  {e.case.name}
                </span>
              </Link>
            ))}
          </ResultGroup>

          <ResultGroup title="Fontes" empty={results.sources.length === 0}>
            {results.sources.map((s) => (
              <div key={s.id} className="border border-[var(--line)] px-4 py-3">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
                <p className="mono text-[11px] text-[var(--fg-faint)] mt-1">
                  {s.outlet}
                </p>
              </div>
            ))}
          </ResultGroup>
        </div>
      )}
    </main>
  );
}

function ResultGroup({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="label mb-3">{title}</h2>
      {empty ? (
        <p className="text-sm text-[var(--fg-faint)]">Nenhum resultado.</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}
