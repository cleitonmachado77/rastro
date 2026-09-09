"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CaseRelDTO } from "@/components/graph/CaseExplorer";
import {
  EVIDENCE_LEVEL_LABELS,
  FACT_STATUS_LABELS,
  RELATION_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  relationship: CaseRelDTO;
  onClose: () => void;
};

export function RelationPanel({ relationship, onClose }: Props) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="chip mb-2">
            {RELATION_TYPE_LABELS[relationship.relationType] ??
              relationship.relationType}
          </p>
          <h2 className="display text-xl leading-tight">
            {relationship.fromName}
            <span className="text-[var(--fg-faint)] mx-2">→</span>
            {relationship.toName}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--fg-faint)] hover:text-[var(--fg)] p-1"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {relationship.description && (
        <p className="mt-4 text-sm text-[var(--fg-muted)] leading-relaxed">
          {relationship.description}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="chip">
          {FACT_STATUS_LABELS[relationship.factStatus] ?? relationship.factStatus}
        </span>
        <span className="chip">
          {EVIDENCE_LEVEL_LABELS[relationship.evidenceLevel]}
        </span>
        <span className="chip">peso {relationship.weight}</span>
      </div>

      <div className="mt-4 mono text-[11px] text-[var(--fg-faint)]">
        {relationship.startDate
          ? format(new Date(relationship.startDate), "dd MMM yyyy", {
              locale: ptBR,
            })
          : "início indeterminado"}
        {" — "}
        {relationship.endDate
          ? format(new Date(relationship.endDate), "dd MMM yyyy", {
              locale: ptBR,
            })
          : "vigente / sem fim registrado"}
      </div>

      <section className="mt-6">
        <p className="label">Evidências e fontes</p>
        {relationship.sources.length === 0 ? (
          <p className="text-sm text-[var(--fg-faint)]">
            Nenhuma fonte vinculada a esta relação.
          </p>
        ) : (
          <ul className="space-y-3">
            {relationship.sources.map((s) => (
              <li key={s.id} className="border border-[var(--line)] p-3">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--accent-2)] hover:underline"
                  >
                    {s.title}
                  </a>
                ) : (
                  <p className="text-sm">{s.title}</p>
                )}
                <p className="mono text-[10px] text-[var(--fg-faint)] mt-1">
                  {s.outlet} · {EVIDENCE_LEVEL_LABELS[s.evidenceLevel]}
                </p>
                {s.excerpt && (
                  <p className="mt-2 text-xs text-[var(--fg-muted)] italic leading-relaxed">
                    “{s.excerpt}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-[11px] text-[var(--fg-faint)] leading-relaxed">
        Uma relação documentada não implica responsabilidade criminal ou moral.
        Consulte o status do fato e o nível de evidência antes de interpretar.
      </p>
    </div>
  );
}
