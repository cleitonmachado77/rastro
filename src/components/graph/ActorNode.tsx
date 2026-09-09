"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { ActorShape } from "@/lib/actor-shape";

export type ActorNodeData = {
  label: string;
  kind: string;
  primaryType: string;
  shape: ActorShape;
  score: number;
  color: string;
  radius: number;
  selected?: boolean;
  dominant?: boolean;
};

function ShapeSvg({
  shape,
  color,
  selected,
  size,
}: {
  shape: ActorShape;
  color: string;
  selected?: boolean;
  size: number;
}) {
  const stroke = selected ? "#c4a574" : color;
  const fill = `${color}28`;
  const sw = 1.75;
  const pad = 2;
  const s = size - pad * 2;
  const c = size / 2;

  if (shape === "circle") {
    return (
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={c}
          cy={c}
          r={s / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      </svg>
    );
  }

  if (shape === "triangle") {
    const top = pad + 2;
    const bottom = size - pad;
    const left = pad + 2;
    const right = size - pad - 2;
    const points = `${c},${top} ${right},${bottom} ${left},${bottom}`;
    return (
      <svg width={size} height={size} className="absolute inset-0">
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="miter"
        />
      </svg>
    );
  }

  // hexagon (flat-top)
  const r = s / 2;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i);
    return `${c + r * Math.cos(angle)},${c + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg width={size} height={size} className="absolute inset-0">
      <polygon
        points={hex}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function ActorNodeComponent({ data }: NodeProps<Node<ActorNodeData>>) {
  const size = data.radius * 2;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        filter: data.selected
          ? "drop-shadow(0 0 6px rgba(196,165,116,0.45))"
          : undefined,
      }}
    >
      {/* Handles em 4 lados para arestas retas sem coincidir no mesmo ponto */}
      <Handle
        id="t"
        type="source"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="t-target"
        type="target"
        position={Position.Top}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="r"
        type="source"
        position={Position.Right}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="r-target"
        type="target"
        position={Position.Right}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="b"
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="b-target"
        type="target"
        position={Position.Bottom}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="l"
        type="source"
        position={Position.Left}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />
      <Handle
        id="l-target"
        type="target"
        position={Position.Left}
        className="!opacity-0 !w-1 !h-1 !min-w-0 !min-h-0"
      />

      <ShapeSvg
        shape={data.shape}
        color={data.color}
        selected={data.selected}
        size={size}
      />
      {data.dominant && (
        <div
          className="absolute inset-[-6px] pointer-events-none"
          style={{
            border: "1px solid rgba(196,165,116,0.35)",
            borderRadius: data.shape === "circle" ? "50%" : data.shape === "hexagon" ? "8px" : "2px",
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10 px-2 text-center pointer-events-none">
        <div
          className="text-[11px] font-medium leading-tight"
          style={{ color: "var(--fg)", maxWidth: size - 10 }}
        >
          {data.label}
        </div>
        <div className="mono text-[9px] mt-0.5" style={{ color: "var(--fg-faint)" }}>
          {Math.round(data.score)}
        </div>
      </div>
    </div>
  );
}

export const ActorNode = memo(ActorNodeComponent);
