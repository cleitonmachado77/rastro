/**
 * Layout para arestas estritamente retas, minimizando cruzamentos
 * e evitando que ligações coincidam.
 */

export type LayoutNode = {
  id: string;
  size: number;
  shape?: "circle" | "hexagon" | "triangle";
};
export type LayoutEdge = { source: string; target: string };

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

function placeOnCircle(
  order: string[],
  cx: number,
  cy: number,
  radius: number
): Record<string, { x: number; y: number }> {
  const n = Math.max(order.length, 1);
  const positions: Record<string, { x: number; y: number }> = {};
  order.forEach((id, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    positions[id] = {
      x: Math.round(cx + Math.cos(angle) * radius),
      y: Math.round(cy + Math.sin(angle) * radius),
    };
  });
  return positions;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** PRNG determinístico (mulberry32) para layout estável entre renders. */
function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function layeredByShape(
  nodes: LayoutNode[],
  cx: number,
  cy: number
): Record<string, { x: number; y: number }> {
  const people = nodes.filter((n) => n.shape === "circle");
  const companies = nodes.filter((n) => n.shape === "triangle");
  const institutions = nodes.filter((n) => n.shape === "hexagon");
  const other = nodes.filter(
    (n) => n.shape !== "circle" && n.shape !== "triangle" && n.shape !== "hexagon"
  );

  const columns: LayoutNode[][] = [
    [...people, ...other],
    companies,
    institutions,
  ].map((col) => (col.length ? col : []));

  const positions: Record<string, { x: number; y: number }> = {};
  const colX = [cx - 280, cx, cx + 280];

  columns.forEach((col, ci) => {
    if (!col.length) return;
    const span = Math.max(160, (col.length - 1) * 150);
    col.forEach((node, i) => {
      const y =
        col.length === 1
          ? cy
          : cy - span / 2 + (i * span) / (col.length - 1);
      positions[node.id] = { x: Math.round(colX[ci]), y: Math.round(y) };
    });
  });

  return positions;
}

function separateNodes(
  positions: Record<string, { x: number; y: number }>,
  minDist = 150
) {
  const ids = Object.keys(positions);
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = positions[ids[i]];
        const b = positions[ids[j]];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < minDist) {
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.x = Math.round(a.x - ux * push);
          a.y = Math.round(a.y - uy * push);
          b.x = Math.round(b.x + ux * push);
          b.y = Math.round(b.y + uy * push);
        }
      }
    }
  }
}

/** Ordena nós para reduzir cruzamentos de retas. */
export function layoutStraightGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  options?: { cx?: number; cy?: number; radius?: number }
): Record<string, { x: number; y: number }> {
  const cx = options?.cx ?? 520;
  const cy = options?.cy ?? 340;
  const n = nodes.length;
  if (n === 0) return {};
  if (n === 1) return { [nodes[0].id]: { x: cx, y: cy } };

  const radius =
    options?.radius ??
    Math.max(240, 80 + n * 32 + Math.max(...nodes.map((x) => x.size), 40));

  const degree = new Map<string, number>();
  for (const node of nodes) degree.set(node.id, 0);
  for (const e of edges) {
    if (degree.has(e.source)) degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    if (degree.has(e.target)) degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }

  const rand = mulberry32(n * 997 + edges.length * 131);

  const candidates: Array<Record<string, { x: number; y: number }>> = [];

  // 1) layout por colunas (pessoa | empresa | instituição)
  candidates.push(layeredByShape(nodes, cx, cy));

  // 2) círculo por grau
  const byDegree = [...nodes]
    .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
    .map((x) => x.id);
  candidates.push(placeOnCircle(byDegree, cx, cy, radius));

  // 3) círculo por forma
  const byShape = [
    ...nodes.filter((n) => n.shape === "circle"),
    ...nodes.filter((n) => n.shape === "triangle"),
    ...nodes.filter((n) => n.shape === "hexagon"),
    ...nodes.filter(
      (n) =>
        n.shape !== "circle" && n.shape !== "triangle" && n.shape !== "hexagon"
    ),
  ].map((x) => x.id);
  candidates.push(placeOnCircle(byShape, cx, cy, radius));

  // 4) amostragem ampla de permutações no círculo
  const samples = Math.min(2500, Math.max(400, n * n * 40));
  let order = [...byDegree];
  for (let s = 0; s < samples; s++) {
    order = shuffle(order, rand);
    candidates.push(placeOnCircle(order, cx, cy, radius));
  }

  // 5) hill-climbing a partir dos melhores
  let best = candidates[0];
  let bestScore = countCrossings(edges, best);

  for (const cand of candidates) {
    separateNodes(cand);
    const score = countCrossings(edges, cand);
    if (score < bestScore) {
      bestScore = score;
      best = cand;
      if (bestScore === 0) break;
    }
  }

  if (bestScore > 0) {
    const ids = Object.keys(best);
    for (let round = 0; round < 400 && bestScore > 0; round++) {
      const i = Math.floor(rand() * ids.length);
      const j = Math.floor(rand() * ids.length);
      if (i === j) continue;
      const next: Record<string, { x: number; y: number }> = { ...best };
      next[ids[i]] = { ...best[ids[j]] };
      next[ids[j]] = { ...best[ids[i]] };
      const score = countCrossings(edges, next);
      if (score <= bestScore) {
        bestScore = score;
        best = next;
      }
    }
  }

  separateNodes(best);
  return best;
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
