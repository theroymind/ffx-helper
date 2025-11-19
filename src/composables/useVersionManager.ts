import { ref, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { GridNode } from "@/composables/useGridMapperContext";

export interface GridMapperVersion {
  id: string;
  name: string;
  dateCreated: string;
  nodes: GridNode[];
}

export function useGridMapperVersionManager() {
  const versions = useLocalStorage<GridMapperVersion[]>("ffx-grid-mapper-versions", []);

  const sortedVersions = computed(() => {
    return [...versions.value].sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  });

  function saveVersion(name: string, nodes: GridNode[]) {
    const newVersion: GridMapperVersion = {
      id: crypto.randomUUID(),
      name,
      dateCreated: new Date().toISOString(),
      nodes: JSON.parse(JSON.stringify(nodes)),
    };

    versions.value = [...versions.value, newVersion];
    return newVersion;
  }

  function loadVersion(versionId: string): GridNode[] | null {
    const version = versions.value.find((v) => v.id === versionId);
    return version ? JSON.parse(JSON.stringify(version.nodes)) : null;
  }

  function deleteVersion(versionId: string) {
    versions.value = versions.value.filter((v) => v.id !== versionId);
  }

  function renameVersion(versionId: string, newName: string) {
    const version = versions.value.find((v) => v.id === versionId);
    if (version) {
      version.name = newName;
    }
  }

  return {
    versions: sortedVersions,
    saveVersion,
    loadVersion,
    deleteVersion,
    renameVersion,
  };
}
