"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  type Node,
  type Edge,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import { ActorNode, type ActorNodeData } from "./ActorNode";
import {
  StraightRelEdge,
  type StraightRelEdgeData,
} from "./StraightRelEdge";
import { CaseTimeline } from "@/components/timeline/CaseTimeline";
import { CaseFilters, type FilterState } from "@/components/filters/CaseFilters";
import { ActorPanel } from "@/components/panels/ActorPanel";
import { RelationPanel } from "@/components/panels/RelationPanel";
import { ACTOR_TYPE_COLORS, FACT_STATUS_LABELS } from "@/lib/labels";
import { nodeRadiusFromScore } from "@/lib/relevance";
import { resolveActorShape, ACTOR_SHAPE_LABELS } from "@/lib/actor-shape";
import {
  layoutStraightGraph,
  parallelEdgeOffsets,
} from "@/lib/graph-layout";

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
const edgeTypes = { straightRel: StraightRelEdge };

/** Escolhe handles opostos à direção da aresta reta (evita feixe no mesmo ponto). */
function handlesForVector(dx: number, dy: number): {
  sourceHandle: string;
  targetHandle: string;
} {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0
      ? { sourceHandle: "r", targetHandle: "l-target" }
      : { sourceHandle: "l", targetHandle: "r-target" };
  }
  return dy >= 0
    ? { sourceHandle: "b", targetHandle: "t-target" }
    : { sourceHandle: "t", targetHandle: "b-target" };
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

  const filteredActors = useMemo(() => {
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
      });
  }, [actors, visibleActorIds, filters]);

  const filteredRels = useMemo(() => {
    const visible = new Set(filteredActors.map((a) => a.id));
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
      });
  }, [relationships, filteredActors, range, filters]);

  const layout = useMemo(() => {
    return layoutStraightGraph(
      filteredActors.map((a) => ({
        id: a.id,
        size: Math.round(nodeRadiusFromScore(a.normalizedScore)) * 2,
        score: a.normalizedScore,
        shape: resolveActorShape(a.actorKind, a.primaryType),
      })),
      filteredRels.map((r) => ({
        source: r.fromActorId,
        target: r.toActorId,
      }))
    );
  }, [filteredActors, filteredRels]);

  const positions = layout.positions;
  const dominantId = layout.dominantId;

  const parallelOffsets = useMemo(
    () =>
      parallelEdgeOffsets(
        filteredRels.map((r) => ({
          id: r.id,
          source: r.fromActorId,
          target: r.toActorId,
        }))
      ),
    [filteredRels]
  );

  const initialNodes: Node<ActorNodeData>[] = useMemo(() => {
    return filteredActors.map((a) => {
      const color = ACTOR_TYPE_COLORS[a.primaryType] ?? ACTOR_TYPE_COLORS.default;
      const isDominant = a.id === dominantId;
      const r = Math.round(
        nodeRadiusFromScore(a.normalizedScore, { dominant: isDominant })
      );
      const pos = positions[a.id] ?? { x: 0, y: 0 };
      const shape = resolveActorShape(a.actorKind, a.primaryType);
      return {
        id: a.id,
        type: "actor",
        position: {
          // Compensa o tamanho maior do hub para o centro geométrico coincidir
          x: Math.round(pos.x - r),
          y: Math.round(pos.y - r),
        },
        data: {
          label: a.shortName || a.name,
          kind: a.actorKind,
          primaryType: a.primaryType,
          shape,
          score: Math.round(a.normalizedScore),
          color,
          radius: r,
          selected: false,
          dominant: isDominant,
        },
        style: { width: r * 2, height: r * 2 },
        zIndex: isDominant ? 10 : 1,
      };
    });
  }, [filteredActors, positions, dominantId]);

  const initialEdges: Edge<StraightRelEdgeData>[] = useMemo(() => {
    return filteredRels.map((r) => {
      const from = positions[r.fromActorId] ?? { x: 0, y: 0 };
      const to = positions[r.toActorId] ?? { x: 0, y: 0 };
      const handles = handlesForVector(to.x - from.x, to.y - from.y);
      const offset = parallelOffsets[r.id] ?? { index: 0, count: 1 };
      const touchesHub =
        r.fromActorId === dominantId || r.toActorId === dominantId;
      return {
        id: r.id,
        type: "straightRel",
        source: r.fromActorId,
        target: r.toActorId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        data: {
          offsetIndex: offset.index,
          offsetCount: offset.count,
          label: r.relationType.replace(/_/g, " "),
        },
        animated: false,
        style: {
          stroke:
            selectedRelId === r.id
              ? "#c4a574"
              : touchesHub
                ? "#8fa3b0"
                : ACTOR_TYPE_COLORS[r.relationType] ?? "#6b7682",
          strokeWidth: Math.max(
            touchesHub ? 1.75 : 1.25,
            Math.min(3.5, r.weight)
          ),
          strokeDasharray: dashForStatus(r.factStatus),
          opacity: selectedRelId && selectedRelId !== r.id ? 0.25 : 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: selectedRelId === r.id ? "#c4a574" : "#6b7682",
        },
      };
    });
  }, [filteredRels, positions, parallelOffsets, selectedRelId, dominantId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(
      initialNodes.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedActorId },
      }))
    );
    setEdges(initialEdges);
    // selectedActorId aplicado abaixo para não resetar o layout a cada clique
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedActorId },
      }))
    );
  }, [selectedActorId, setNodes]);

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
          <div className="flex-1 min-h-0 relative">
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
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: "straightRel" }}
                connectionLineType={ConnectionLineType.Straight}
                fitView
                fitViewOptions={{ padding: 0.25 }}
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
            <div className="pointer-events-none absolute left-3 top-3 z-10 border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] px-3 py-2 backdrop-blur-sm">
              <p className="mono text-[9px] tracking-widest uppercase text-[var(--fg-faint)] mb-1.5">
                Formas
              </p>
              <ul className="space-y-1 text-[11px] text-[var(--fg-muted)]">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--accent)]" />
                  {ACTOR_SHAPE_LABELS.circle}
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 border border-[var(--accent-2)]"
                    style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                  />
                  {ACTOR_SHAPE_LABELS.hexagon}
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="inline-block h-0 w-0 border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent border-b-[var(--accent)]"
                  />
                  {ACTOR_SHAPE_LABELS.triangle}
                </li>
              </ul>
              <p className="mono text-[9px] tracking-widest uppercase text-[var(--fg-faint)] mt-2.5 mb-1">
                Hierarquia
              </p>
              <p className="text-[11px] text-[var(--fg-muted)] leading-snug max-w-[140px]">
                O ator mais relevante fica no centro, maior, com as ligações partindo dele.
              </p>
            </div>
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
