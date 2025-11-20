import { ref, computed, watch, type Ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import standardGridData from "@/assets/standard_grid_nodes.json";
import expertGridData from "@/assets/expert_grid_nodes.json";
import abilitiesData from "@/assets/abilities.json";
import { SphereType } from "@/domain/grid/SphereType";
import type { SphereNode } from "@/domain/grid/SphereNode";
import type { SphereGridData } from "@/domain/grid/SphereGridData";
import type { Stats } from "@/domain/grid/Stats";
import { mapAttributeToType, sphereTypeInfo, baseStats } from "@/constants/sphere";
import { useGridSharingStore } from "@/stores/gridSharing";
import { useAnalytics } from "@/composables/useAnalytics";
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

export function useSphereData(gridType: Ref<GridType>, sharedNodes?: Ref<SphereNode[] | null>) {
  const gridSharingStore = useGridSharingStore();
  const isSharedView = gridSharingStore.isSharedView;
  const sharedNodesInternal = sharedNodes ?? ref(null);
  const { trackSphereModification, trackGridReset, trackGridImported, trackGridShared } = useAnalytics();

  // Separate localStorage for each grid type
  const standardNodes = useLocalStorage<SphereNode[]>(
    "ffx-sphere-grid-nodes-standard",
    generateSphereGrid(GridType.Standard).nodes,
    {
      mergeDefaults: true,
    },
  );
  const expertNodes = useLocalStorage<SphereNode[]>(
    "ffx-sphere-grid-nodes-expert",
    generateSphereGrid(GridType.Expert).nodes,
    {
      mergeDefaults: true,
    },
  );

  function getCurrentGridData(): SphereGridData {
    const grid = generateSphereGrid(gridType.value);

    let nodes: SphereNode[];
    if (isSharedView && sharedNodesInternal.value) {
      nodes = sharedNodesInternal.value;
    } else {
      nodes = gridType.value === GridType.Expert ? expertNodes.value : standardNodes.value;
    }

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

  // Watch for shared nodes changes and reload
  watch(
    () => sharedNodesInternal.value,
    () => {
      if (isSharedView) {
        sphereData.value = getCurrentGridData();
      }
    },
    { deep: true },
  );

  // Watch for shared view changes and reload
  watch(
    () => isSharedView,
    () => {
      sphereData.value = getCurrentGridData();
    },
  );

  // Watch for changes to nodes and persist to localStorage only if not shared view
  watch(
    () => sphereData.value.nodes,
    (newNodes) => {
      if (!isSharedView) {
        if (gridType.value === GridType.Expert) {
          expertNodes.value = newNodes;
        } else {
          standardNodes.value = newNodes;
        }
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
      if (!node.abilityId && node.type !== SphereType.Empty) {
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

  function resetGrid(updateCallback?: (nodes: SphereNode[]) => void) {
    const freshDefaults = generateSphereGrid(gridType.value);
    sphereData.value.nodes = freshDefaults.nodes;

    if (gridType.value === GridType.Expert) {
      expertNodes.value = freshDefaults.nodes;
    } else {
      standardNodes.value = freshDefaults.nodes;
    }

    if (updateCallback) {
      updateCallback(freshDefaults.nodes);
    }

    trackGridReset();
  }

  function clearGrid(updateCallback?: (nodes: SphereNode[]) => void) {
    const clearedNodes = sphereData.value.nodes.map((node) => {
      if (node.abilityId) {
        return node;
      }
      return {
        ...node,
        type: SphereType.Empty,
        value: 0,
        locked: false,
      };
    });

    sphereData.value.nodes = clearedNodes;

    if (gridType.value === GridType.Expert) {
      expertNodes.value = clearedNodes;
    } else {
      standardNodes.value = clearedNodes;
    }

    if (updateCallback) {
      updateCallback(clearedNodes);
    }
  }

  function updateNode(nodeId: string, type: SphereType, value: number) {
    const node = sphereData.value.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.type = type;
      node.value = value;
      trackSphereModification(type, value);
    }
  }

  function updateNodes(nodeIds: string[], type: SphereType, value: number) {
    nodeIds.forEach((nodeId) => {
      updateNode(nodeId, type, value);
    });
  }

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

    trackGridShared("export");
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

          if (gridType.value === GridType.Expert) {
            expertNodes.value = importData.nodes;
          } else {
            standardNodes.value = importData.nodes;
          }

          if (updateCallback) {
            updateCallback(importData.nodes);
          }

          trackGridImported();
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

  function saveSharedGridToLocal() {
    if (!isSharedView) return;

    const nodes = sphereData.value.nodes;
    if (gridType.value === GridType.Expert) {
      expertNodes.value = nodes;
    } else {
      standardNodes.value = nodes;
    }
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
    saveSharedGridToLocal,
  };
}
