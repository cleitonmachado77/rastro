/**
 * Layout radial: o ator dominante (maior relevância) fica no centro.
 * Demais atores ao redor; arestas retas; ordem na circunferência
 * minimiza cruzamentos entre ligações periféricas.
 */

export type LayoutNode = {
  id: string;
  size: number;
  score?: number;
  shape?: "circle" | "hexagon" | "triangle";
};
export type LayoutEdge = { source: string; target: string };

export type LayoutResult = {
  positions: Record<string, { x: number; y: number }>;
  dominantId: string | null;
};

function segmentsCross(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number }
): boolean {
  const shareVertex =
    (a1.x === b1.x && a1.y === b1.y) ||
    (a1.x === b2.x && a1.y === b2.y) ||
    (a2.x === b1.x && a2.y === b1.y) ||
    (a2.x === b2.x && a2.y === b2.y);
  if (shareVertex) return false;

  const orient = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    r: { x: number; y: number }
  ) => {
    const v = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (Math.abs(v) < 1e-9) return 0;
    return Math.sign(v);
  };

  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4;
}

function countCrossings(
  edges: LayoutEdge[],
  positions: Record<string, { x: number; y: number }>
): number {
  const segs = edges
    .filter((e) => positions[e.source] && positions[e.target])
    .map((e) => ({ a: positions[e.source], b: positions[e.target] }));

  let crossings = 0;
  for (let i = 0; i < segs.length; i++) {
    for (let j = i + 1; j < segs.length; j++) {
      if (segmentsCross(segs[i].a, segs[i].b, segs[j].a, segs[j].b)) {
        crossings += 1;
      }
    }
  }
  return crossings;
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function placeHubAndRing(
  hubId: string,
  ringOrder: string[],
  cx: number,
  cy: number,
  radius: number
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {
    [hubId]: { x: Math.round(cx), y: Math.round(cy) },
  };
  const n = Math.max(ringOrder.length, 1);
  ringOrder.forEach((id, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    positions[id] = {
      x: Math.round(cx + Math.cos(angle) * radius),
      y: Math.round(cy + Math.sin(angle) * radius),
    };
  });
  return positions;
}

/** Escolhe o ator dominante: maior score; empate por grau. */
export function pickDominantActor(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): string | null {
  if (!nodes.length) return null;

  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const e of edges) {
    if (degree.has(e.source)) degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    if (degree.has(e.target)) degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  return [...nodes].sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    return (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0);
  })[0].id;
}

/**
 * Hub no centro; demais em anel. Arestas do hub são radiais (não se cruzam).
 * Ordem do anel minimiza cruzamentos das demais retas.
 */
export function layoutStraightGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options?: { cx?: number; cy?: number; radius?: number }
): LayoutResult {
  const cx = options?.cx ?? 520;
  const cy = options?.cy ?? 340;
  const n = nodes.length;

  if (n === 0) return { positions: {}, dominantId: null };

  const dominantId = pickDominantActor(nodes, edges)!;
  if (n === 1) {
    return {
      positions: { [dominantId]: { x: Math.round(cx), y: Math.round(cy) } },
      dominantId,
    };
  }

  const hubSize = nodes.find((x) => x.id === dominantId)?.size ?? 80;
  const radius =
    options?.radius ??
    Math.max(260, hubSize * 1.6 + 120 + (n - 1) * 26);

  const neighbors = new Set<string>();
  for (const e of edges) {
    if (e.source === dominantId) neighbors.add(e.target);
    if (e.target === dominantId) neighbors.add(e.source);
  }

  const ringNodes = nodes.filter((x) => x.id !== dominantId);
  // Vizinhos do hub primeiro (ligações partem do centro), depois os demais por score
  const ringSeed = [
    ...ringNodes
      .filter((x) => neighbors.has(x.id))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    ...ringNodes
      .filter((x) => !neighbors.has(x.id))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
  ].map((x) => x.id);

  const rand = mulberry32(n * 997 + edges.length * 131 + dominantId.length * 17);

  let bestOrder = [...ringSeed];
  let best = placeHubAndRing(dominantId, bestOrder, cx, cy, radius);
  let bestScore = countCrossings(edges, best);

  const samples = Math.min(2000, Math.max(300, (n - 1) * (n - 1) * 30));
  let order = [...bestOrder];
  for (let s = 0; s < samples && bestScore > 0; s++) {
    order = shuffle(order, rand);
    const cand = placeHubAndRing(dominantId, order, cx, cy, radius);
    const score = countCrossings(edges, cand);
    if (score < bestScore) {
      bestScore = score;
      bestOrder = order;
      best = cand;
    }
  }

  // Hill-climbing: só troca nós do anel; hub permanece no centro
  for (let round = 0; round < 500 && bestScore > 0; round++) {
    const i = Math.floor(rand() * bestOrder.length);
    const j = Math.floor(rand() * bestOrder.length);
    if (i === j) continue;
    const nextOrder = [...bestOrder];
    [nextOrder[i], nextOrder[j]] = [nextOrder[j], nextOrder[i]];
    const cand = placeHubAndRing(dominantId, nextOrder, cx, cy, radius);
    const score = countCrossings(edges, cand);
    if (score <= bestScore) {
      bestScore = score;
      bestOrder = nextOrder;
      best = cand;
    }
  }

  return { positions: best, dominantId };
}

/**
 * Para arestas paralelas entre o mesmo par, calcula índice de offset
 * para traçar retas paralelas sem coincidir.
 */
export function parallelEdgeOffsets(
  edges: Array<{ id: string; source: string; target: string }>
): Record<string, { index: number; count: number }> {
  const groups = new Map<string, string[]>();
  for (const e of edges) {
    const key = [e.source, e.target].sort().join("::");
    const list = groups.get(key) ?? [];
    list.push(e.id);
    groups.set(key, list);
  }
  const result: Record<string, { index: number; count: number }> = {};
  for (const list of groups.values()) {
    list.forEach((id, index) => {
      result[id] = { index, count: list.length };
    });
  }
  return result;
}
