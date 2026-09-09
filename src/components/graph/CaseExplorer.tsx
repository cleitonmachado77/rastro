"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import { ActorNode, type ActorNodeData } from "./ActorNode";
import { CaseTimeline } from "@/components/timeline/CaseTimeline";
import { CaseFilters, type FilterState } from "@/components/filters/CaseFilters";
import { ActorPanel } from "@/components/panels/ActorPanel";
import { RelationPanel } from "@/components/panels/RelationPanel";
import { ACTOR_TYPE_COLORS, FACT_STATUS_LABELS } from "@/lib/labels";
import { nodeRadiusFromScore } from "@/lib/relevance";

export type CaseActorDTO = {
  id: string;
  slug: string;
  name: string;
  shortName: string | null;
  actorKind: string;
  primaryType: string;
  description: string | null;
  roles: Array<{ role: string; startDate: string | null; endDate: string | null }>;
  aliases: string[];
  documents: Array<{
    id: string;
    title: string;
    url: string | null;
    documentType: string;
  }>;
  normalizedScore: number;
  score: number;
  breakdownJson: string;
};

export type CaseEventDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  eventType: string;
  factStatus: string;
  evidenceLevel: string;
  startDate: string;
  endDate: string | null;
  locationLabel: string | null;
  importance: number;
  actorIds: string[];
  actorRoles: Array<{ actorId: string; role: string | null; name: string }>;
  sources: Array<{
    id: string;
    title: string;
    url: string | null;
    outlet: string | null;
    evidenceLevel: string;
    excerpt: string | null;
  }>;
};

export type CaseRelDTO = {
  id: string;
  fromActorId: string;
  toActorId: string;
  fromName: string;
  toName: string;
  relationType: string;
  description: string | null;
  weight: number;
  startDate: string | null;
  endDate: string | null;
  factStatus: string;
  evidenceLevel: string;
  relatedEventId: string | null;
  sources: CaseEventDTO["sources"];
};

type Props = {
  caseMeta: {
    id: string;
    slug: string;
    name: string;
    description: string;
    currentSituation: string | null;
    counts: {
      caseActors: number;
      events: number;
      sources: number;
      relationships: number;
    };
  };
  actors: CaseActorDTO[];
  events: CaseEventDTO[];
  relationships: CaseRelDTO[];
};

const nodeTypes = { actor: ActorNode };

function layoutPositions(actors: CaseActorDTO[]) {
  const sorted = [...actors].sort(
    (a, b) => b.normalizedScore - a.normalizedScore
  );
  const positions: Record<string, { x: number; y: number }> = {};
  const cx = 480;
  const cy = 320;

  sorted.forEach((actor, i) => {
    if (i === 0) {
      positions[actor.id] = { x: cx, y: cy };
      return;
    }
    const ring = Math.ceil(i / 5);
    const idxInRing = (i - 1) % 5;
    const angle = (idxInRing / 5) * Math.PI * 2 - Math.PI / 2 + ring * 0.35;
    const radius = 160 + ring * 130;
    positions[actor.id] = {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
  return positions;
}

function intersectsRange(
  start: string | null,
  end: string | null,
  rangeStart: number,
  rangeEnd: number
) {
  const s = start ? new Date(start).getTime() : Number.NEGATIVE_INFINITY;
  const e = end ? new Date(end).getTime() : Number.POSITIVE_INFINITY;
  return s <= rangeEnd && e >= rangeStart;
}

function dashForStatus(status: string) {
  if (status === "ALLEGATION" || status === "REPORTAGE") return "6 4";
  if (status === "INVESTIGATION" || status === "DENUNCIATION") return "4 3";
  if (status === "CONTESTATION" || status === "CORRECTION") return "2 2";
  return undefined;
}

export function CaseExplorer({ caseMeta, actors, events, relationships }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const years = useMemo(() => {
    const times = events.map((e) => new Date(e.startDate).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    return {
      minYear: new Date(min).getFullYear(),
      maxYear: new Date(max).getFullYear(),
      minTs: min,
      maxTs: max,
    };
  }, [events]);

  const [range, setRange] = useState({
    start: years.minTs,
    end: years.maxTs,
  });
  const [filters, setFilters] = useState<FilterState>({
    actorKinds: [],
    factStatuses: [],
    evidenceLevels: [],
    hiddenTypes: [],
    query: "",
  });
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedRelId, setSelectedRelId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const positions = useMemo(() => layoutPositions(actors), [actors]);

  const visibleActorIds = useMemo(() => {
    const fromEvents = new Set<string>();
    for (const e of events) {
      if (
        intersectsRange(e.startDate, e.endDate, range.start, range.end) &&
        (filters.factStatuses.length === 0 ||
          filters.factStatuses.includes(e.factStatus)) &&
        (filters.evidenceLevels.length === 0 ||
          filters.evidenceLevels.includes(e.evidenceLevel))
      ) {
        e.actorIds.forEach((id) => fromEvents.add(id));
      }
    }
    for (const r of relationships) {
      if (intersectsRange(r.startDate, r.endDate, range.start, range.end)) {
        fromEvents.add(r.fromActorId);
        fromEvents.add(r.toActorId);
      }
    }
    return fromEvents;
  }, [events, relationships, range, filters]);

  const initialNodes: Node<ActorNodeData>[] = useMemo(() => {
    return actors
      .filter((a) => visibleActorIds.has(a.id))
      .filter((a) => {
        if (filters.hiddenTypes.includes(a.primaryType)) return false;
        if (filters.actorKinds.length && !filters.actorKinds.includes(a.actorKind))
          return false;
        if (filters.query) {
          const q = filters.query.toLowerCase();
          return (
            a.name.toLowerCase().includes(q) ||
            a.aliases.some((al) => al.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map((a) => {
        const color = ACTOR_TYPE_COLORS[a.primaryType] ?? ACTOR_TYPE_COLORS.default;
        const r = Math.round(nodeRadiusFromScore(a.normalizedScore));
        const pos = positions[a.id] ?? { x: 0, y: 0 };
        return {
          id: a.id,
          type: "actor",
          position: { x: Math.round(pos.x), y: Math.round(pos.y) },
          data: {
            label: a.shortName || a.name,
            kind: a.actorKind,
            primaryType: a.primaryType,
            score: Math.round(a.normalizedScore),
            color,
            radius: r,
            selected: selectedActorId === a.id,
          },
          style: { width: r * 2, height: r * 2 },
        };
      });
  }, [actors, visibleActorIds, filters, positions, selectedActorId]);

  const initialEdges: Edge[] = useMemo(() => {
    const visible = new Set(initialNodes.map((n) => n.id));
    return relationships
      .filter((r) => visible.has(r.fromActorId) && visible.has(r.toActorId))
      .filter((r) => intersectsRange(r.startDate, r.endDate, range.start, range.end))
      .filter((r) => {
        if (filters.factStatuses.length && !filters.factStatuses.includes(r.factStatus))
          return false;
        if (
          filters.evidenceLevels.length &&
          !filters.evidenceLevels.includes(r.evidenceLevel)
        )
          return false;
        return true;
      })
      .map((r) => ({
        id: r.id,
        source: r.fromActorId,
        target: r.toActorId,
        label: r.relationType.replace(/_/g, " "),
        animated: r.factStatus === "INVESTIGATION",
        style: {
          stroke:
            selectedRelId === r.id
              ? "#c4a574"
              : ACTOR_TYPE_COLORS[r.relationType] ?? "#6b7682",
          strokeWidth: Math.max(1, Math.min(4, r.weight)),
          strokeDasharray: dashForStatus(r.factStatus),
          opacity: selectedRelId && selectedRelId !== r.id ? 0.25 : 0.85,
        },
        labelStyle: {
          fill: "#9aa5b1",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
        },
        labelBgStyle: { fill: "#161b20", fillOpacity: 0.85 },
        labelBgPadding: [4, 2] as [number, number],
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: "#6b7682",
        },
      }));
  }, [relationships, initialNodes, range, filters, selectedRelId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    if (!playing) return;
    const total = years.maxTs - years.minTs;
    if (total <= 0) return;
    const step = Math.max(total / 80, 1000 * 60 * 60 * 24 * 14);
    const id = window.setInterval(() => {
      setRange((prev) => {
        const nextEnd = prev.end + step;
        if (nextEnd >= years.maxTs) {
          setPlaying(false);
          return { start: years.minTs, end: years.maxTs };
        }
        return { start: years.minTs, end: nextEnd };
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [playing, years]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedActorId(node.id);
    setSelectedRelId(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedRelId(edge.id);
    setSelectedActorId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedActorId(null);
    setSelectedRelId(null);
  }, []);

  const selectedActor = actors.find((a) => a.id === selectedActorId) ?? null;
  const selectedRel = relationships.find((r) => r.id === selectedRelId) ?? null;

  const actorEvents = selectedActor
    ? events.filter((e) => e.actorIds.includes(selectedActor.id))
    : [];
  const actorRels = selectedActor
    ? relationships.filter(
        (r) =>
          r.fromActorId === selectedActor.id || r.toActorId === selectedActor.id
      )
    : [];

  return (
    <div className="flex-1 flex flex-col min-h-0 h-[calc(100vh-3.5rem)]">
      <div className="border-b border-[var(--line)] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 justify-between bg-[color-mix(in_srgb,var(--bg)_90%,transparent)]">
        <div className="min-w-0">
          <p className="mono text-[10px] tracking-widest uppercase text-[var(--fg-faint)]">
            Caso
          </p>
          <h1 className="display text-xl sm:text-2xl truncate">{caseMeta.name}</h1>
        </div>
        <div className="mono text-[11px] text-[var(--fg-faint)] flex flex-wrap gap-4">
          <span>{caseMeta.counts.caseActors} atores</span>
          <span>{caseMeta.counts.events} eventos</span>
          <span>{caseMeta.counts.relationships} relações</span>
          <span>{caseMeta.counts.sources} fontes</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <CaseFilters
            actors={actors}
            filters={filters}
            onChange={setFilters}
            factStatusLabels={FACT_STATUS_LABELS}
          />
          <div className="flex-1 min-h-0">
            {mounted ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={2}
                colorMode="dark"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={22}
                  size={1}
                  color="#2a323a"
                />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor={(n) =>
                    (n.data as ActorNodeData)?.color ?? "#6b7682"
                  }
                  maskColor="rgba(14,17,20,0.7)"
                />
              </ReactFlow>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--fg-faint)] mono text-xs">
                Carregando mapa…
              </div>
            )}
          </div>
          <CaseTimeline
            events={events}
            minTs={years.minTs}
            maxTs={years.maxTs}
            range={range}
            onChangeRange={setRange}
            playing={playing}
            onTogglePlay={() => {
              if (!playing) {
                setRange({ start: years.minTs, end: years.minTs });
              }
              setPlaying((p) => !p);
            }}
            onReset={() => {
              setPlaying(false);
              setRange({ start: years.minTs, end: years.maxTs });
            }}
          />
        </div>

        {(selectedActor || selectedRel) && (
          <aside className="panel w-full md:w-[360px] lg:w-[400px] absolute md:static inset-x-0 bottom-0 max-h-[55vh] md:max-h-none z-20 overflow-y-auto">
            {selectedActor && (
              <ActorPanel
                actor={selectedActor}
                events={actorEvents}
                relationships={actorRels}
                onClose={() => setSelectedActorId(null)}
                onSelectRelation={(id) => {
                  setSelectedRelId(id);
                  setSelectedActorId(null);
                }}
              />
            )}
            {selectedRel && (
              <RelationPanel
                relationship={selectedRel}
                onClose={() => setSelectedRelId(null)}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
