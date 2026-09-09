"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";

export type ActorNodeData = {
  label: string;
  kind: string;
  primaryType: string;
  score: number;
  color: string;
  radius: number;
  selected?: boolean;
};

function ActorNodeComponent({ data }: NodeProps<Node<ActorNodeData>>) {
  const size = data.radius * 2;
  const isOrg = data.kind === "organization";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      <div
        className="absolute inset-0 transition-shadow duration-300"
        style={{
          background: `${data.color}22`,
          border: `1.5px solid ${data.selected ? "#c4a574" : data.color}`,
          borderRadius: isOrg ? "4px" : "50%",
          boxShadow: data.selected
            ? `0 0 0 3px rgba(196,165,116,0.25)`
            : `0 0 24px ${data.color}22`,
        }}
      />
      <div className="relative z-10 px-2 text-center pointer-events-none">
        <div
          className="text-[11px] font-medium leading-tight"
          style={{ color: "var(--fg)", maxWidth: size - 8 }}
        >
          {data.label}
        </div>
        <div className="mono text-[9px] mt-0.5" style={{ color: "var(--fg-faint)" }}>
          {Math.round(data.score)}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
    </div>
  );
}

export const ActorNode = memo(ActorNodeComponent);
