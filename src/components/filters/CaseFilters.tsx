"use client";

import type { CaseActorDTO } from "@/components/graph/CaseExplorer";
import { EVIDENCE_LEVEL_LABELS } from "@/lib/labels";

export type FilterState = {
  actorKinds: string[];
  factStatuses: string[];
  evidenceLevels: string[];
  hiddenTypes: string[];
  query: string;
};

type Props = {
  actors: CaseActorDTO[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  factStatusLabels: Record<string, string>;
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CaseFilters({
  actors,
  filters,
  onChange,
  factStatusLabels,
}: Props) {
  const types = Array.from(new Set(actors.map((a) => a.primaryType)));

  return (
    <div className="border-b border-[var(--line)] px-4 sm:px-6 py-2 flex flex-wrap items-center gap-2 bg-[var(--bg)]">
      <input
        className="input py-1.5 text-sm max-w-[200px]"
        placeholder="Filtrar ator…"
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />

      <select
        className="input py-1.5 text-sm w-auto"
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          onChange({
            ...filters,
            actorKinds: toggle(filters.actorKinds, e.target.value),
          });
        }}
        aria-label="Filtrar por tipo de ator"
      >
        <option value="">Tipo de ator</option>
        <option value="person">Pessoa</option>
        <option value="organization">Organização</option>
      </select>

      <select
        className="input py-1.5 text-sm w-auto max-w-[180px]"
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          onChange({
            ...filters,
            factStatuses: toggle(filters.factStatuses, e.target.value),
          });
        }}
        aria-label="Filtrar por status"
      >
        <option value="">Status do fato</option>
        {Object.entries(factStatusLabels).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      <select
        className="input py-1.5 text-sm w-auto max-w-[200px]"
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          onChange({
            ...filters,
            evidenceLevels: toggle(filters.evidenceLevels, e.target.value),
          });
        }}
        aria-label="Filtrar por evidência"
      >
        <option value="">Nível de evidência</option>
        {Object.entries(EVIDENCE_LEVEL_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-1">
        {types.map((t) => {
          const hidden = filters.hiddenTypes.includes(t);
          return (
            <button
              key={t}
              type="button"
              className="chip"
              style={{
                opacity: hidden ? 0.4 : 1,
                borderColor: hidden ? "var(--line)" : "var(--accent)",
              }}
              onClick={() =>
                onChange({
                  ...filters,
                  hiddenTypes: toggle(filters.hiddenTypes, t),
                })
              }
            >
              {hidden ? "oculto · " : ""}
              {t.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {(filters.actorKinds.length > 0 ||
        filters.factStatuses.length > 0 ||
        filters.evidenceLevels.length > 0 ||
        filters.hiddenTypes.length > 0 ||
        filters.query) && (
        <button
          type="button"
          className="text-xs text-[var(--accent)] ml-auto"
          onClick={() =>
            onChange({
              actorKinds: [],
              factStatuses: [],
              evidenceLevels: [],
              hiddenTypes: [],
              query: "",
            })
          }
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
