"use client";

import { X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CaseActorDTO, CaseEventDTO, CaseRelDTO } from "@/components/graph/CaseExplorer";
import {
  ACTOR_KIND_LABELS,
  EVIDENCE_LEVEL_LABELS,
  FACT_STATUS_LABELS,
  RELATION_TYPE_LABELS,
} from "@/lib/labels";
import type { RelevanceBreakdown } from "@/lib/relevance";

type Props = {
  actor: CaseActorDTO;
  events: CaseEventDTO[];
  relationships: CaseRelDTO[];
  onClose: () => void;
  onSelectRelation: (id: string) => void;
};

export function ActorPanel({
  actor,
  events,
  relationships,
  onClose,
  onSelectRelation,
}: Props) {
  let breakdown: RelevanceBreakdown | null = null;
  try {
    breakdown = JSON.parse(actor.breakdownJson) as RelevanceBreakdown;
  } catch {
    breakdown = null;
  }

  const sourceCount = new Set(
    events.flatMap((e) => e.sources.map((s) => s.id))
  ).size;

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="chip mb-2">
            {ACTOR_KIND_LABELS[actor.actorKind] ?? actor.actorKind} ·{" "}
            {actor.primaryType.replace(/_/g, " ")}
          </p>
          <h2 className="display text-2xl leading-tight">{actor.name}</h2>
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

      {actor.description && (
        <p className="mt-3 text-sm text-[var(--fg-muted)] leading-relaxed">
          {actor.description}
        </p>
      )}

      <div className="mt-5">
        <p className="label">Relevância no caso</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[var(--line)]">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${Math.min(100, actor.normalizedScore)}%` }}
            />
          </div>
          <span className="mono text-sm">{Math.round(actor.normalizedScore)}</span>
        </div>
        <p className="mt-2 text-[11px] text-[var(--fg-faint)]">
          Índice estrutural — não indica culpa, suspeita ou julgamento moral.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 mono text-[11px] text-[var(--fg-muted)]">
        <div className="border border-[var(--line)] p-2">
          <div className="text-[var(--fg)] text-base">{events.length}</div>
          eventos
        </div>
        <div className="border border-[var(--line)] p-2">
          <div className="text-[var(--fg)] text-base">{relationships.length}</div>
          relações
        </div>
        <div className="border border-[var(--line)] p-2">
          <div className="text-[var(--fg)] text-base">{sourceCount}</div>
          fontes
        </div>
      </div>

      {actor.roles.length > 0 && (
        <section className="mt-6">
          <p className="label">Funções no tempo</p>
          <ul className="space-y-2">
            {actor.roles.map((r, i) => (
              <li key={i} className="text-sm text-[var(--fg-muted)]">
                <span className="text-[var(--fg)]">{r.role}</span>
                <span className="mono text-[11px] text-[var(--fg-faint)] ml-2">
                  {r.startDate
                    ? format(new Date(r.startDate), "yyyy", { locale: ptBR })
                    : "?"}
                  –
                  {r.endDate
                    ? format(new Date(r.endDate), "yyyy", { locale: ptBR })
                    : "atual"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <p className="label">Timeline</p>
        <ol className="relative border-l border-[var(--line-strong)] ml-1 space-y-4 pl-4">
          {events.map((e) => (
            <li key={e.id}>
              <span className="absolute -left-[5px] mt-1.5 w-2 h-2 bg-[var(--accent)]" />
              <p className="mono text-[10px] text-[var(--fg-faint)]">
                {format(new Date(e.startDate), "dd MMM yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-[var(--fg)] mt-0.5">{e.title}</p>
              <p className="chip mt-1">
                {FACT_STATUS_LABELS[e.factStatus] ?? e.factStatus}
              </p>
            </li>
          ))}
          {events.length === 0 && (
            <li className="text-sm text-[var(--fg-faint)]">Sem eventos no período.</li>
          )}
        </ol>
      </section>

      <section className="mt-6">
        <p className="label">Relações</p>
        <ul className="space-y-2">
          {relationships.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="text-left w-full text-sm border border-[var(--line)] px-3 py-2 hover:border-[var(--accent)] transition-colors"
                onClick={() => onSelectRelation(r.id)}
              >
                <span className="text-[var(--fg-muted)]">
                  {RELATION_TYPE_LABELS[r.relationType] ?? r.relationType}
                </span>
                <span className="block text-[var(--fg)] mt-0.5">
                  {r.fromName} → {r.toName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <p className="label">Fontes</p>
        <ul className="space-y-2">
          {events
            .flatMap((e) => e.sources)
            .filter(
              (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
            )
            .map((s) => (
              <li key={s.id} className="text-sm">
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
                <span className="block mono text-[10px] text-[var(--fg-faint)] mt-0.5">
                  {s.outlet} · {EVIDENCE_LEVEL_LABELS[s.evidenceLevel]}
                </span>
              </li>
            ))}
        </ul>
      </section>

      {breakdown && (
        <section className="mt-6 border-t border-[var(--line)] pt-5">
          <p className="label">Por que este ator é grande?</p>
          <ul className="space-y-1.5 text-sm text-[var(--fg-muted)]">
            {breakdown.explanation.map((line, i) => (
              <li key={i}>· {line}</li>
            ))}
          </ul>
        </section>
      )}

      {actor.documents.length > 0 && (
        <section className="mt-6">
          <p className="label">Documentos</p>
          <ul className="space-y-1 text-sm">
            {actor.documents.map((d) => (
              <li key={d.id}>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    {d.title}
                  </a>
                ) : (
                  d.title
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
