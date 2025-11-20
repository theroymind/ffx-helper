import type { SphereNode } from "./SphereNode";

export interface SphereGridData {
  nodes: SphereNode[];
  edges: Array<{ source: string; target: string }>;
  positions: Record<string, { x: number; y: number }>;
}
