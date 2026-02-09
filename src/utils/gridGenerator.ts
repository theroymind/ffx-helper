import standardGridData from "@/assets/standard_grid_nodes.json";
import expertGridData from "@/assets/expert_grid_nodes.json";
import abilitiesData from "@/assets/abilities.json";
import { SphereType } from "@/domain/grid/SphereType";
import type { SphereNode } from "@/domain/grid/SphereNode";
import type { SphereGridData } from "@/domain/grid/SphereGridData";
import { mapAttributeToType } from "@/constants/sphere";
import { GridType } from "@/domain/grid/GridType";

interface AbilityData {
  id: number;
  name: string;
  ability_type: string;
  number: number;
}

interface NodeData {
  id: number;
  x: number;
  y: number;
  connections: Array<[number, number]>;
  attribute_name: string | null;
  value: number | null;
  lock_level: number | null;
  ability_id: number | null;
}

const abilityNames: Record<number, string> = {};
abilitiesData.forEach((ability: AbilityData) => {
  abilityNames[ability.id] = ability.name;
});

export function generateSphereGrid(gridType: GridType = GridType.Standard): SphereGridData {
  const sphereGridData = (gridType === GridType.Expert ? expertGridData : standardGridData) as NodeData[];
  const nodes: SphereNode[] = [];
  const edges: Array<{ source: string; target: string }> = [];
  const positions: Record<string, { x: number; y: number }> = {};

  const coordToNodeId = new Map<string, string>();

  sphereGridData.forEach((nodeData: NodeData) => {
    const nodeId = `node-${nodeData.id}`;
    const sphereType = mapAttributeToType(nodeData.attribute_name, nodeData.ability_id, nodeData.lock_level);

    const displayValue = sphereType === SphereType.Empty ? 0 : nodeData.value || 0;

    nodes.push({
      id: nodeId,
      type: sphereType,
      value: displayValue,
      locked: sphereType === SphereType.Locked || nodeData.ability_id !== null,
      abilityId: nodeData.ability_id,
      abilityName: nodeData.ability_id
        ? abilityNames[nodeData.ability_id] || `Ability ${nodeData.ability_id}`
        : undefined,
    });

    const spacingMultiplier = 3.0;
    positions[nodeId] = {
      x: nodeData.x * spacingMultiplier,
      y: nodeData.y * spacingMultiplier,
    };

    coordToNodeId.set(`${nodeData.x},${nodeData.y}`, nodeId);
  });

  sphereGridData.forEach((nodeData: NodeData) => {
    const sourceId = `node-${nodeData.id}`;

    if (nodeData.connections && Array.isArray(nodeData.connections)) {
      nodeData.connections.forEach((conn: [number, number]) => {
        const targetCoord = `${conn[0]},${conn[1]}`;
        const targetId = coordToNodeId.get(targetCoord);

        if (targetId && targetId !== sourceId) {
          const edgeExists = edges.some(
            (edge) =>
              (edge.source === sourceId && edge.target === targetId) ||
              (edge.source === targetId && edge.target === sourceId),
          );

          if (!edgeExists) {
            edges.push({ source: sourceId, target: targetId });
          }
        }
      });
    }
  });

  return { nodes, edges, positions };
}

export function getAbilityName(abilityId: number): string {
  return abilityNames[abilityId] || `Ability ${abilityId}`;
}
