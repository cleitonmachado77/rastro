import Link from "next/link";

export default function ComoFuncionaPage() {
  return (
    <main className="mx-auto w-full max-w-[800px] px-6 py-12 flex-1 prose-rastro">
      <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
        Transparência
      </p>
      <h1 className="display text-3xl mt-2">Como o RASTRO funciona</h1>
      <p className="mt-4 text-[var(--fg-muted)] text-lg leading-relaxed">
        O RASTRO é uma plataforma de mapeamento de fatos públicos. Não é um
        portal partidário, nem um tabloide. O mapa mostra relações documentadas
        — não culpados.
      </p>

      <Section title="Origem dos dados">
        No MVP, os dados são curados editorialmente e carregados no banco. O
        primeiro caso — <em>Banco Aurora</em> — é <strong>fictício</strong>,
        criado apenas para desenvolvimento e demonstração. Fontes reais devem
        ser vinculadas por URL, com metadados e trechos curtos quando permitido
        por lei — nunca cópia integral de matérias protegidas.
      </Section>

      <Section title="Metodologia editorial">
        Cada evento e relação carrega um <strong>status do fato</strong>{" "}
        (alegação, investigação, denúncia, decisão, condenação, absolvição,
        etc.) e um <strong>nível de evidência</strong> (jornalística →
        institucional → documento oficial → evidência primária). O sistema
        jamais transforma automaticamente “está sendo investigado” em “cometeu
        crime”.
      </Section>

      <Section title="Cálculo de relevância">
        O tamanho dos nós mede relevância estrutural no grafo do caso — número
        de eventos, relações, fontes independentes, evidências oficiais,
        recência e centralidade — com normalização logarítmica. Detalhes em{" "}
        <Link href="/metodologia" className="text-[var(--accent)] underline">
          Metodologia de relevância
        </Link>
        .
      </Section>

      <Section title="Alegações vs. fatos documentados">
        A interface diferencia visualmente alegações e reportagens (linhas
        tracejadas) de fatos documentados e decisões. Interpretação permanece
        com o usuário, salvo quando autoridade competente tiver estabelecido o
        fato.
      </Section>

      <Section title="Correções e histórico">
        Informações corrigidas ou contestadas não são apagadas em silêncio. O
        MVP registra auditoria (`audit_logs`) com ação, motivo e snapshot. Fluxos
        avançados de contestação entram em fases seguintes.
      </Section>

      <Section title="Limitações">
        O MVP não inclui IA automática, scraping, grafo global, mapa geográfico
        nem fluxo financeiro. Relações não são criadas só porque dois nomes
        aparecem na mesma matéria.
      </Section>

      <Section title="Uso de IA (futuro)">
        A IA poderá sugerir atores, eventos e relações a partir de textos
        públicos. Sugestões sensíveis passam por fila de revisão humana antes
        de publicação. A IA não publica acusações automaticamente.
      </Section>

      <p className="mt-10 mono text-[11px] text-[var(--fg-faint)]">
        RASTRO — Cada fato deixa um rastro. O RASTRO conecta tudo.
      </p>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-[var(--line)] pt-8">
      <h2 className="display text-xl">{title}</h2>
      <div className="mt-3 text-[var(--fg-muted)] leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}
