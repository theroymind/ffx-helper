import { computed, inject, type Ref, type InjectionKey } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { SphereType } from "@/domain/grid/SphereType";
import { GridType } from "@/domain/grid/GridType";

export interface NodeDelta {
  type: SphereType;
  value: number;
}

export type NodeDeltas = Record<string, NodeDelta>;

const STORAGE_KEY_STANDARD = "ffx-sphere-grid-deltas-standard";
const STORAGE_KEY_EXPERT = "ffx-sphere-grid-deltas-expert";

export interface GridStorage {
  deltas: Ref<NodeDeltas>;
  saveNode: (nodeId: string, type: SphereType, value: number) => void;
  saveNodes: (updates: Array<{ nodeId: string; type: SphereType; value: number }>) => void;
  removeNode: (nodeId: string) => void;
  clearDeltas: () => void;
  hasDeltas: Ref<boolean>;
}

export const gridStorageKey: InjectionKey<GridStorage> = Symbol("gridStorage");

export function useGridStorage(gridType: Ref<GridType>): GridStorage {
  const standardDeltas = useLocalStorage<NodeDeltas>(STORAGE_KEY_STANDARD, {});
  const expertDeltas = useLocalStorage<NodeDeltas>(STORAGE_KEY_EXPERT, {});

  const deltas = computed({
    get: () => (gridType.value === GridType.Expert ? expertDeltas.value : standardDeltas.value),
    set: (value: NodeDeltas) => {
      if (gridType.value === GridType.Expert) {
        expertDeltas.value = value;
      } else {
        standardDeltas.value = value;
      }
    },
  });

  function saveNode(nodeId: string, type: SphereType, value: number) {
    const currentDeltas = gridType.value === GridType.Expert ? expertDeltas : standardDeltas;
    currentDeltas.value = {
      ...currentDeltas.value,
      [nodeId]: { type, value },
    };
  }

  function saveNodes(updates: Array<{ nodeId: string; type: SphereType; value: number }>) {
    const currentDeltas = gridType.value === GridType.Expert ? expertDeltas : standardDeltas;
    const newDeltas = { ...currentDeltas.value };
    updates.forEach(({ nodeId, type, value }) => {
      newDeltas[nodeId] = { type, value };
    });
    currentDeltas.value = newDeltas;
  }

  function removeNode(nodeId: string) {
    const currentDeltas = gridType.value === GridType.Expert ? expertDeltas : standardDeltas;
    const newDeltas = { ...currentDeltas.value };
    delete newDeltas[nodeId];
    currentDeltas.value = newDeltas;
  }

  function clearDeltas() {
    if (gridType.value === GridType.Expert) {
      expertDeltas.value = {};
    } else {
      standardDeltas.value = {};
    }
  }

  const hasDeltas = computed(() => Object.keys(deltas.value).length > 0);

  return {
    deltas,
    saveNode,
    saveNodes,
    removeNode,
    clearDeltas,
    hasDeltas,
  };
}

export function injectGridStorage(): GridStorage {
  const storage = inject(gridStorageKey);
  if (!storage) {
    throw new Error("useGridStorage must be used within a SphereGridProvider");
  }
  return storage;
}
