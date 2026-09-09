/**
 * Índice de Relevância RASTRO v1
 *
 * NÃO representa culpa, suspeita ou importância moral.
 * Representa apenas relevância estrutural dentro de um caso/grafo.
 */

export type RelevanceWeights = {
  events: number;
  relationships: number;
  sources: number;
  officialEvidence: number;
  decisions: number;
  recency: number;
  degree: number;
  importance: number;
};

export const DEFAULT_WEIGHTS: RelevanceWeights = {
  events: 3,
  relationships: 2.5,
  sources: 1.5,
  officialEvidence: 4,
  decisions: 3,
  recency: 2,
  degree: 2,
  importance: 2,
};

export type RelevanceInput = {
  eventCount: number;
  relationshipCount: number;
  sourceCount: number;
  independentSourceOutlets: number;
  officialEvidenceCount: number;
  decisionCount: number;
  recentEventCount: number; // últimos 24 meses no dataset
  connectedActors: number;
  totalImportance: number;
};

export type RelevanceBreakdown = {
  components: Record<keyof RelevanceWeights, number>;
  raw: number;
  normalized: number;
  explanation: string[];
};

export function computeRawScore(
  input: RelevanceInput,
  weights: RelevanceWeights = DEFAULT_WEIGHTS
): { raw: number; components: Record<keyof RelevanceWeights, number> } {
  const components = {
    events: input.eventCount * weights.events,
    relationships: input.relationshipCount * weights.relationships,
    sources:
      (input.sourceCount * 0.6 + input.independentSourceOutlets * 0.4) *
      weights.sources,
    officialEvidence: input.officialEvidenceCount * weights.officialEvidence,
    decisions: input.decisionCount * weights.decisions,
    recency: input.recentEventCount * weights.recency,
    degree: input.connectedActors * weights.degree,
    importance: input.totalImportance * weights.importance,
  };

  const raw = Object.values(components).reduce((a, b) => a + b, 0);
  return { raw, components };
}

/** Normalização logarítmica para evitar domínio absoluto de hubs. */
export function normalizeScores(rawScores: number[]): number[] {
  const max = Math.max(...rawScores, 1);
  return rawScores.map((r) => (100 * Math.log1p(r)) / Math.log1p(max));
}

export function buildBreakdown(
  input: RelevanceInput,
  raw: number,
  components: Record<keyof RelevanceWeights, number>,
  normalized: number
): RelevanceBreakdown {
  const explanation: string[] = [
    `Participa de ${input.eventCount} evento(s) neste caso.`,
    `Possui ${input.relationshipCount} relação(ões) documentada(s).`,
    `${input.sourceCount} fonte(s); ${input.independentSourceOutlets} veículo(s)/instituição(ões) distintas.`,
    `${input.officialEvidenceCount} evidência(s) de nível documental/oficial.`,
    `${input.decisionCount} evento(s) de decisão judicial ou equivalente.`,
    `${input.recentEventCount} evento(s) recentes (janela de recência).`,
    `Conectado a ${input.connectedActors} outro(s) ator(es) no grafo.`,
    `Score bruto ${raw.toFixed(1)} → normalizado ${normalized.toFixed(0)}/100 (escala log).`,
  ];

  return { components, raw, normalized, explanation };
}

export function nodeRadiusFromScore(normalized: number): number {
  const min = 22;
  const max = 56;
  return min + (Math.max(0, Math.min(100, normalized)) / 100) * (max - min);
}
