import { ref, computed, watch, inject, type Ref, type InjectionKey } from "vue";
import { SphereType } from "@/domain/grid/SphereType";
import type { SphereNode } from "@/domain/grid/SphereNode";
import type { SphereGridData } from "@/domain/grid/SphereGridData";
import { GridType } from "@/domain/grid/GridType";
import { generateSphereGrid } from "@/utils/gridGenerator";
import type { GridStorage, NodeDeltas } from "@/composables/useGridStorage";
import { useAnalytics } from "@/composables/useAnalytics";

export interface GridState {
  sphereData: Ref<SphereGridData>;
  defaultNodes: Ref<SphereNode[]>;
  updateNode: (nodeId: string, type: SphereType, value: number) => void;
  updateNodes: (nodeIds: string[], type: SphereType, value: number) => void;
  resetGrid: (updateCallback?: (nodes: SphereNode[]) => void) => void;
  clearGrid: (updateCallback?: (nodes: SphereNode[]) => void) => void;
  isSharedView: boolean;
}

export const gridStateKey: InjectionKey<GridState> = Symbol("gridState");

function applyDeltasToNodes(nodes: SphereNode[], deltas: NodeDeltas): SphereNode[] {
  return nodes.map((node) => {
    const delta = deltas[node.id];
    if (delta && !node.abilityId) {
      return {
        ...node,
        type: delta.type,
        value: delta.value,
        locked: false,
      };
    }
    return node;
  });
}

export function useGridState(
  gridType: Ref<GridType>,
  storage: GridStorage,
  isSharedView: boolean,
  sharedNodes?: Ref<SphereNode[] | null>,
): GridState {
  const { trackSphereModification, trackGridReset } = useAnalytics();

  const defaultGrid = computed(() => generateSphereGrid(gridType.value));
  const defaultNodes = computed(() => defaultGrid.value.nodes);

  function buildNodes(): SphereNode[] {
    if (isSharedView && sharedNodes?.value) {
      return sharedNodes.value;
    }
    return applyDeltasToNodes(defaultNodes.value, storage.deltas.value);
  }

  const nodes = ref<SphereNode[]>(buildNodes());

  watch(
    [gridType, () => storage.deltas.value],
    () => {
      if (!isSharedView) {
        nodes.value = buildNodes();
      }
    },
    { deep: true },
  );

  watch(
    () => sharedNodes?.value,
    () => {
      if (isSharedView && sharedNodes?.value) {
        nodes.value = sharedNodes.value;
      }
    },
    { deep: true },
  );

  const sphereData = computed<SphereGridData>(() => ({
    nodes: nodes.value,
    edges: defaultGrid.value.edges,
    positions: defaultGrid.value.positions,
  }));

  function updateNode(nodeId: string, type: SphereType, value: number) {
    const nodeIndex = nodes.value.findIndex((n) => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = nodes.value[nodeIndex];
    if (!node || node.abilityId) return;

    nodes.value[nodeIndex] = {
      id: node.id,
      type,
      value,
      locked: false,
      abilityId: node.abilityId,
      abilityName: node.abilityName,
    };

    if (!isSharedView) {
      const defaultNode = defaultNodes.value[nodeIndex];
      if (defaultNode && (type !== defaultNode.type || value !== defaultNode.value)) {
        storage.saveNode(nodeId, type, value);
      } else {
        storage.removeNode(nodeId);
      }
    }

    trackSphereModification(type, value);
  }

  function updateNodes(nodeIds: string[], type: SphereType, value: number) {
    const updates: Array<{ nodeId: string; type: SphereType; value: number }> = [];
    const removals: string[] = [];

    nodeIds.forEach((nodeId) => {
      const nodeIndex = nodes.value.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;

      const node = nodes.value[nodeIndex];
      if (!node || node.abilityId) return;

      nodes.value[nodeIndex] = {
        id: node.id,
        type,
        value,
        locked: false,
        abilityId: node.abilityId,
        abilityName: node.abilityName,
      };

      if (!isSharedView) {
        const defaultNode = defaultNodes.value[nodeIndex];
        if (defaultNode && (type !== defaultNode.type || value !== defaultNode.value)) {
          updates.push({ nodeId, type, value });
        } else {
          removals.push(nodeId);
        }
      }
    });

    if (!isSharedView && updates.length > 0) {
      storage.saveNodes(updates);
    }
    removals.forEach((nodeId) => storage.removeNode(nodeId));

    trackSphereModification(type, value);
  }

  function resetGrid(updateCallback?: (nodes: SphereNode[]) => void) {
    storage.clearDeltas();
    nodes.value = [...defaultNodes.value];

    if (updateCallback) {
      updateCallback(nodes.value);
    }

    trackGridReset();
  }

  function clearGrid(updateCallback?: (nodes: SphereNode[]) => void) {
    const clearedNodes = defaultNodes.value.map((node) => {
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

    nodes.value = clearedNodes;

    const updates = clearedNodes
      .filter((node) => !node.abilityId)
      .map((node) => ({
        nodeId: node.id,
        type: SphereType.Empty,
        value: 0,
      }));

    if (!isSharedView) {
      storage.saveNodes(updates);
    }

    if (updateCallback) {
      updateCallback(clearedNodes);
    }
  }

  return {
    sphereData,
    defaultNodes,
    updateNode,
    updateNodes,
    resetGrid,
    clearGrid,
    isSharedView,
  };
}

export function injectGridState(): GridState {
  const state = inject(gridStateKey);
  if (!state) {
    throw new Error("useGridState must be used within a SphereGridProvider");
  }
  return state;
}
