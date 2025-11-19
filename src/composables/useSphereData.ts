import { ref, computed, watch, type Ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import standardGridData from "@/assets/standard_grid_nodes.json";
import expertGridData from "@/assets/expert_grid_nodes.json";
import abilitiesData from "@/assets/abilities.json";
import type { SphereNode, SphereGridData, Stats } from "@/types/sphere";
import { mapAttributeToType, sphereTypeInfo, baseStats } from "@/constants/sphere";

export type GridType = "standard" | "expert";

// Build ability ID to name mapping from abilities.json
const abilityNames: Record<number, string> = {};
abilitiesData.forEach((ability: any) => {
  abilityNames[ability.id] = ability.name;
});

// Generate the sphere grid from the data file
export const generateSphereGrid = (gridType: GridType = "standard"): SphereGridData => {
  const sphereGridData = gridType === "expert" ? expertGridData : standardGridData;
  const nodes: SphereNode[] = [];
  const edges: Array<{ source: string; target: string }> = [];
  const positions: Record<string, { x: number; y: number }> = {};

  // Create a map of coordinates to node IDs for connection lookup
  const coordToNodeId = new Map<string, string>();

  // Parse the FFX sphere grid data
  sphereGridData.forEach((nodeData: any) => {
    const nodeId = `node-${nodeData.id}`;
    const sphereType = mapAttributeToType(nodeData.attribute_name, nodeData.ability_id, nodeData.lock_level);

    // For empty nodes, set value to 0 so no number displays
    const displayValue = sphereType === "empty" ? 0 : nodeData.value || 0;

    nodes.push({
      id: nodeId,
      type: sphereType,
      value: displayValue,
      locked: sphereType === "locked" || nodeData.ability_id !== null,
      abilityId: nodeData.ability_id,
      abilityName: nodeData.ability_id
        ? abilityNames[nodeData.ability_id] || `Ability ${nodeData.ability_id}`
        : undefined,
    });

    // Add spacing multiplier to spread nodes out more
    const spacingMultiplier = 3.0;
    positions[nodeId] = {
      x: nodeData.x * spacingMultiplier,
      y: nodeData.y * spacingMultiplier,
    };

    // Map coordinates to node ID for connection lookup
    coordToNodeId.set(`${nodeData.x},${nodeData.y}`, nodeId);
  });

  // Create edges based on connections
  sphereGridData.forEach((nodeData: any) => {
    const sourceId = `node-${nodeData.id}`;

    if (nodeData.connections && Array.isArray(nodeData.connections)) {
      nodeData.connections.forEach((conn: [number, number]) => {
        const targetCoord = `${conn[0]},${conn[1]}`;
        const targetId = coordToNodeId.get(targetCoord);

        if (targetId && targetId !== sourceId) {
          // Avoid duplicate edges by checking if reverse edge exists
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
};

export function useSphereData(gridType: Ref<GridType>) {
  // Separate localStorage for each grid type
  const standardNodes = useLocalStorage<SphereNode[]>(
    "ffx-sphere-grid-nodes-standard",
    generateSphereGrid("standard").nodes,
    {
      mergeDefaults: true,
    },
  );
  const expertNodes = useLocalStorage<SphereNode[]>(
    "ffx-sphere-grid-nodes-expert",
    generateSphereGrid("expert").nodes,
    {
      mergeDefaults: true,
    },
  );

  // Get current grid data based on type
  function getCurrentGridData() {
    const grid = generateSphereGrid(gridType.value);
    const nodes = gridType.value === "expert" ? expertNodes.value : standardNodes.value;
    return {
      nodes,
      edges: grid.edges,
      positions: grid.positions,
    };
  }

  // Create the reactive sphere data
  const sphereData = ref<SphereGridData>(getCurrentGridData());

  // Watch for grid type changes and reload data
  watch(gridType, () => {
    sphereData.value = getCurrentGridData();
  });

  // Watch for changes to nodes and persist to correct localStorage
  watch(
    () => sphereData.value.nodes,
    (newNodes) => {
      if (gridType.value === "expert") {
        expertNodes.value = newNodes;
      } else {
        standardNodes.value = newNodes;
      }
    },
    { deep: true },
  );

  // Calculate stats
  const stats = computed<Stats>(() => {
    const result: Stats = { ...baseStats };

    sphereData.value.nodes.forEach((node) => {
      const info = sphereTypeInfo[node.type];
      if (info && info.statKey && node.value) {
        result[info.statKey] += node.value;
      }
    });

    return result;
  });

  // Calculate total sphere counts by type (excluding ability nodes and empty)
  const sphereCounts = computed(() => {
    const counts = Object.fromEntries(Object.keys(sphereTypeInfo).map((type) => [type, 0])) as Record<string, number>;

    sphereData.value.nodes.forEach((node) => {
      if (!node.abilityId && node.type !== "empty") {
        const currentCount = counts[node.type] ?? 0;
        counts[node.type] = currentCount + 1;
      }
    });

    return counts;
  });

  // Calculate sphere counts for overridden nodes only
  const overriddenSphereCounts = computed(() => {
    const counts = Object.fromEntries(Object.keys(sphereTypeInfo).map((type) => [type, 0])) as Record<string, number>;

    let totalOverridden = 0;

    const defaultGrid = generateSphereGrid(gridType.value);
    sphereData.value.nodes.forEach((node, index) => {
      const defaultNode = defaultGrid.nodes[index];

      // Only count if the node has been changed from its default
      // Skip ability nodes as they can't be changed
      if (defaultNode && !node.abilityId) {
        const hasChanged = node.type !== defaultNode.type || node.value !== defaultNode.value;

        if (hasChanged) {
          const currentCount = counts[node.type] ?? 0;
          counts[node.type] = currentCount + 1;
          totalOverridden++;
        }
      }
    });

    return {
      counts,
      total: totalOverridden,
    };
  });

  // Reset grid to defaults
  const resetGrid = (updateCallback?: (nodes: SphereNode[]) => void) => {
    const freshDefaults = generateSphereGrid(gridType.value);
    sphereData.value.nodes = freshDefaults.nodes;

    if (gridType.value === "expert") {
      expertNodes.value = freshDefaults.nodes;
    } else {
      standardNodes.value = freshDefaults.nodes;
    }

    if (updateCallback) {
      updateCallback(freshDefaults.nodes);
    }
  };

  // Clear all nodes to empty (except ability nodes)
  const clearGrid = (updateCallback?: (nodes: SphereNode[]) => void) => {
    const clearedNodes = sphereData.value.nodes.map((node) => {
      if (node.abilityId) {
        return node;
      }
      return {
        ...node,
        type: "empty" as const,
        value: 0,
        locked: false,
      };
    });

    sphereData.value.nodes = clearedNodes;

    if (gridType.value === "expert") {
      expertNodes.value = clearedNodes;
    } else {
      standardNodes.value = clearedNodes;
    }

    if (updateCallback) {
      updateCallback(clearedNodes);
    }
  };

  // Update a node's type
  const updateNode = (nodeId: string, type: string, value: number) => {
    const node = sphereData.value.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.type = type as any;
      node.value = value;
    }
  };

  // Update multiple nodes at once
  const updateNodes = (nodeIds: string[], type: string, value: number) => {
    nodeIds.forEach((nodeId) => {
      updateNode(nodeId, type, value);
    });
  };

  // Export current grid to JSON file
  function exportGrid() {
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      gridType: gridType.value,
      nodes: sphereData.value.nodes,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ffx-sphere-grid-${gridType.value}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import grid from JSON file
  function importGrid(file: File, updateCallback?: (nodes: SphereNode[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);

          if (!importData.version || !importData.gridType || !importData.nodes) {
            reject(new Error("Invalid file format"));
            return;
          }

          if (importData.gridType !== gridType.value) {
            reject(
              new Error(
                `Grid type mismatch: file contains ${importData.gridType} grid but current grid is ${gridType.value}`,
              ),
            );
            return;
          }

          const defaultGrid = generateSphereGrid(gridType.value);
          if (importData.nodes.length !== defaultGrid.nodes.length) {
            reject(new Error("Node count mismatch"));
            return;
          }

          sphereData.value.nodes = importData.nodes;

          if (gridType.value === "expert") {
            expertNodes.value = importData.nodes;
          } else {
            standardNodes.value = importData.nodes;
          }

          if (updateCallback) {
            updateCallback(importData.nodes);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  return {
    sphereData,
    stats,
    sphereCounts,
    overriddenSphereCounts,
    resetGrid,
    clearGrid,
    updateNode,
    updateNodes,
    exportGrid,
    importGrid,
  };
}
