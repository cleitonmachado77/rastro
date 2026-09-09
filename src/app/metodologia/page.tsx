import { DEFAULT_WEIGHTS } from "@/lib/relevance";
import Link from "next/link";

export default function MetodologiaPage() {
  return (
    <main className="mx-auto w-full max-w-[800px] px-6 py-12 flex-1">
      <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
        Transparência · algoritmo v1
      </p>
      <h1 className="display text-3xl mt-2">Metodologia de relevância</h1>
      <p className="mt-4 text-[var(--fg-muted)] text-lg leading-relaxed">
        O índice determina o tamanho dos nós no grafo. Ele{" "}
        <strong className="text-[var(--fg)] font-medium">não</strong> representa
        culpa, suspeita, importância moral ou criminalidade — apenas relevância
        estrutural dentro do caso.
      </p>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="display text-xl">Fórmula</h2>
        <pre className="mt-4 overflow-x-auto border border-[var(--line)] bg-[var(--bg-elevated)] p-4 text-sm mono text-[var(--fg-muted)] leading-relaxed">
{`raw =
  eventos × ${DEFAULT_WEIGHTS.events}
+ relações × ${DEFAULT_WEIGHTS.relationships}
+ fontes* × ${DEFAULT_WEIGHTS.sources}
+ evidências oficiais × ${DEFAULT_WEIGHTS.officialEvidence}
+ decisões × ${DEFAULT_WEIGHTS.decisions}
+ recência × ${DEFAULT_WEIGHTS.recency}
+ grau (atores conectados) × ${DEFAULT_WEIGHTS.degree}
+ importância dos eventos × ${DEFAULT_WEIGHTS.importance}

* fontes = 0,6×qtde + 0,4×veículos/instituições distintas
  (evita contar a mesma notícia republicada como 10 eventos)

normalized = 100 × log1p(raw) / log1p(maxRawNoCaso)`}
        </pre>
      </section>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="display text-xl">Pesos atuais (ajustáveis)</h2>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
          {Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => (
            <li
              key={k}
              className="flex justify-between border border-[var(--line)] px-3 py-2 text-sm"
            >
              <span className="mono text-[var(--fg-faint)]">{k}</span>
              <span className="mono text-[var(--accent)]">{v}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="display text-xl">Recência</h2>
        <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
          Eventos nos últimos 24 meses incrementam o componente de recência.
          Isso pode elevar temporariamente um ator quando novos desdobramentos
          ocorrem — sem confundir volume de cobertura jornalística com volume
          de acontecimentos independentes.
        </p>
      </section>

      <section className="mt-10 border-t border-[var(--line)] pt-8">
        <h2 className="display text-xl">Explicabilidade</h2>
        <p className="mt-3 text-[var(--fg-muted)] leading-relaxed">
          Ao selecionar um ator no mapa, o painel lateral responde “Por que este
          ator é grande?” com o breakdown do cálculo armazenado em{" "}
          <code className="mono text-[var(--fg)]">actor_relevance_scores</code>.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/como-funciona" className="text-[var(--accent)] hover:underline">
          ← Como o RASTRO funciona
        </Link>
      </p>
    </main>
  );
}
