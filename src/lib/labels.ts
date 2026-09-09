export const FACT_STATUS_LABELS: Record<string, string> = {
  DOCUMENTED_FACT: "Fato documentado",
  REPORTAGE: "Reportagem",
  ALLEGATION: "Alegação",
  INVESTIGATION: "Investigação",
  DENUNCIATION: "Denúncia",
  PROCESS: "Processo",
  DECISION: "Decisão",
  CONVICTION: "Condenação",
  ACQUITTAL: "Absolvição",
  ARCHIVAL: "Arquivamento",
  CONTESTATION: "Contestação",
  CORRECTION: "Correção",
};

export const EVIDENCE_LEVEL_LABELS: Record<string, string> = {
  JOURNALISTIC: "Nível 1 — Jornalística",
  INSTITUTIONAL: "Nível 2 — Institucional",
  OFFICIAL_DOCUMENT: "Nível 3 — Documento oficial",
  PRIMARY_EVIDENCE: "Nível 4 — Evidência primária",
};

export const ACTOR_KIND_LABELS: Record<string, string> = {
  person: "Pessoa",
  organization: "Organização",
  other: "Outro",
};

/** Cores neutras por tipo — sem conotação política ou de culpa */
export const ACTOR_TYPE_COLORS: Record<string, string> = {
  empresario: "#8B9A7D",
  empresa: "#6B8F9E",
  banco: "#5C7A8A",
  deputado: "#9A8B7D",
  orgao: "#7D8B9A",
  ministerio_publico: "#8A7D9A",
  tribunal: "#7A8A7D",
  juiz: "#9A8A7D",
  default: "#8A8A8A",
};

export const RELATION_TYPE_LABELS: Record<string, string> = {
  sociedade: "Sociedade",
  contrato: "Contrato",
  investigacao: "Investigação",
  fiscalizacao: "Fiscalização",
  decisao: "Decisão",
  representacao_juridica: "Representação jurídica",
  cargo: "Cargo",
  nomeacao: "Nomeação",
  parentesco: "Parentesco",
  financiamento: "Financiamento",
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
