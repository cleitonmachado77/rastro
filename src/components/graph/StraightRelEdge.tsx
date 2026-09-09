"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";

export type StraightRelEdgeData = {
  offsetIndex: number;
  offsetCount: number;
  label?: string;
};

/** Aresta sempre reta; offsets paralelos evitam sobreposição entre ligações do mesmo par. */
function StraightRelEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
  label,
}: EdgeProps<Edge<StraightRelEdgeData>>) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const count = data?.offsetCount ?? 1;
  const index = data?.offsetIndex ?? 0;
  const spread = 14;
  const offset = count > 1 ? (index - (count - 1) / 2) * spread : 0;

  const sx = sourceX + nx * offset;
  const sy = sourceY + ny * offset;
  const tx = targetX + nx * offset;
  const ty = targetY + ny * offset;

  const [path, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const text = data?.label ?? (typeof label === "string" ? label : undefined);

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      {text && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "#9aa5b1",
              background: "rgba(22,27,32,0.9)",
              padding: "1px 4px",
              border: "1px solid rgba(232,236,239,0.08)",
            }}
          >
            {text}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const StraightRelEdge = memo(StraightRelEdgeComponent);
