"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import type { CaseEventDTO } from "@/components/graph/CaseExplorer";
import { FACT_STATUS_LABELS } from "@/lib/labels";

type Props = {
  events: CaseEventDTO[];
  minTs: number;
  maxTs: number;
  range: { start: number; end: number };
  onChangeRange: (r: { start: number; end: number }) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
};

export function CaseTimeline({
  events,
  minTs,
  maxTs,
  range,
  onChangeRange,
  playing,
  onTogglePlay,
  onReset,
}: Props) {
  const span = Math.max(maxTs - minTs, 1);
  const startYear = new Date(minTs).getFullYear();
  const endYear = new Date(maxTs).getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const endPct = ((range.end - minTs) / span) * 100;

  return (
    <div className="border-t border-[var(--line)] bg-[var(--bg-elevated)] px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3 mb-2">
        <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
          Linha do tempo
        </p>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="btn py-1 px-2 text-xs"
            aria-label={playing ? "Pausar" : "Reproduzir evolução"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{playing ? "Pausar" : "Reproduzir"}</span>
          </button>
          <button
            type="button"
            onClick={onReset}
            className="btn py-1 px-2 text-xs"
            aria-label="Resetar período"
          >
            <RotateCcw size={14} />
          </button>
          <span className="mono text-[11px] text-[var(--fg-muted)]">
            até {new Date(range.end).getFullYear()}
          </span>
        </div>
      </div>

      <div className="relative h-10">
        <div className="absolute inset-x-0 top-4 h-px bg-[var(--line-strong)]" />
        <div
          className="absolute top-4 h-px bg-[var(--accent)] transition-[width] duration-150"
          style={{ width: `${endPct}%`, left: 0 }}
        />
        {years.map((y) => {
          const ts = new Date(`${y}-01-01`).getTime();
          const left = ((ts - minTs) / span) * 100;
          return (
            <button
              key={y}
              type="button"
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${Math.max(0, Math.min(100, left))}%` }}
              onClick={() =>
                onChangeRange({
                  start: minTs,
                  end: Math.min(maxTs, new Date(`${y}-12-31`).getTime()),
                })
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fg-faint)] mb-1" />
              <span className="mono text-[10px] text-[var(--fg-faint)]">{y}</span>
            </button>
          );
        })}
        {events.map((e) => {
          const left = ((new Date(e.startDate).getTime() - minTs) / span) * 100;
          const active = new Date(e.startDate).getTime() <= range.end;
          return (
            <div
              key={e.id}
              title={`${e.title} · ${FACT_STATUS_LABELS[e.factStatus] ?? e.factStatus}`}
              className="absolute top-[14px] w-2 h-2 -translate-x-1/2 rotate-45 border"
              style={{
                left: `${left}%`,
                borderColor: active ? "var(--accent)" : "var(--fg-faint)",
                background: active ? "var(--accent-soft)" : "transparent",
                opacity: active ? 1 : 0.35,
              }}
            />
          );
        })}
        <input
          type="range"
          min={minTs}
          max={maxTs}
          value={range.end}
          onChange={(e) =>
            onChangeRange({ start: minTs, end: Number(e.target.value) })
          }
          className="absolute inset-x-0 top-2 w-full opacity-0 cursor-pointer h-6"
          aria-label="Ajustar período da timeline"
        />
      </div>
    </div>
  );
}
