import { inject, type Ref, type InjectionKey } from "vue";
import type { SphereNode } from "@/domain/grid/SphereNode";
import { GridType } from "@/domain/grid/GridType";
import type { GridState } from "@/composables/useGridState";
import type { GridStorage } from "@/composables/useGridStorage";
import { useAnalytics } from "@/composables/useAnalytics";

interface ExportData {
  version: string;
  timestamp: string;
  gridType: GridType;
  nodes: SphereNode[];
}

export interface GridFileOps {
  exportGrid: () => void;
  importGrid: (file: File, updateCallback?: (nodes: SphereNode[]) => void) => Promise<void>;
  saveSharedGridToLocal: () => void;
}

export const gridFileOpsKey: InjectionKey<GridFileOps> = Symbol("gridFileOps");

export function useGridFileOps(gridType: Ref<GridType>, gridState: GridState, storage: GridStorage): GridFileOps {
  const { trackGridImported, trackGridShared } = useAnalytics();

  function exportGrid() {
    const exportData: ExportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      gridType: gridType.value,
      nodes: gridState.sphereData.value.nodes,
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

  function importGrid(file: File, updateCallback?: (nodes: SphereNode[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content) as ExportData;

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

          const defaultNodes = gridState.defaultNodes.value;
          if (importData.nodes.length !== defaultNodes.length) {
            reject(new Error("Node count mismatch"));
            return;
          }

          const updates = importData.nodes
            .map((node, index) => {
              const defaultNode = defaultNodes[index];
              if (!defaultNode || node.abilityId) return null;

              const hasChanged = node.type !== defaultNode.type || node.value !== defaultNode.value;
              if (!hasChanged) return null;

              return {
                nodeId: node.id,
                type: node.type,
                value: node.value,
              };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null);

          storage.clearDeltas();
          if (updates.length > 0) {
            storage.saveNodes(updates);
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
    if (!gridState.isSharedView) return;

    const nodes = gridState.sphereData.value.nodes;
    const defaultNodes = gridState.defaultNodes.value;

    const updates = nodes
      .map((node, index) => {
        const defaultNode = defaultNodes[index];
        if (!defaultNode || node.abilityId) return null;

        const hasChanged = node.type !== defaultNode.type || node.value !== defaultNode.value;
        if (!hasChanged) return null;

        return {
          nodeId: node.id,
          type: node.type,
          value: node.value,
        };
      })
      .filter((u): u is NonNullable<typeof u> => u !== null);

    storage.clearDeltas();
    if (updates.length > 0) {
      storage.saveNodes(updates);
    }
  }

  return {
    exportGrid,
    importGrid,
    saveSharedGridToLocal,
  };
}

export function injectGridFileOps(): GridFileOps {
  const fileOps = inject(gridFileOpsKey);
  if (!fileOps) {
    throw new Error("useGridFileOps must be used within a SphereGridProvider");
  }
  return fileOps;
}
