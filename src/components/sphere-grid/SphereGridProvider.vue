<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, computed, toRef, type Ref } from "vue";
import { GridType } from "@/domain/grid/GridType.ts";
import type { SphereNode } from "@/domain/grid/SphereNode.ts";
import { useGridSharingStore } from "@/stores/gridSharing.ts";
import { useGridStorage, gridStorageKey } from "@/composables/useGridStorage.ts";
import { useGridState, gridStateKey } from "@/composables/useGridState.ts";
import { useGridStats, gridStatsKey } from "@/composables/useGridStats.ts";
import { useGridFileOps, gridFileOpsKey } from "@/composables/useGridFileOps.ts";
import { useUndoRedo, undoRedoKey } from "@/composables/useUndoRedo.ts";
import { generateSphereGrid } from "@/utils/gridGenerator.ts";

const props = defineProps<{
  gridType: GridType;
}>();

const gridSharingStore = useGridSharingStore();
const isSharedView = gridSharingStore.isSharedView;

const gridTypeRef = toRef(props, "gridType");

const sharedNodes = computed<SphereNode[] | null>(() => {
  if (!isSharedView) return null;
  const defaultGrid = generateSphereGrid(gridTypeRef.value);
  return gridSharingStore.loadSharedGrid(defaultGrid.nodes);
});

const storage = useGridStorage(gridTypeRef);
const gridState = useGridState(gridTypeRef, storage, isSharedView, sharedNodes as Ref<SphereNode[] | null>);
const gridStats = useGridStats(gridState);
const gridFileOps = useGridFileOps(gridTypeRef, gridState, storage);
const undoRedo = useUndoRedo(storage);

provide(gridStorageKey, storage);
provide(gridStateKey, gridState);
provide(gridStatsKey, gridStats);
provide(gridFileOpsKey, gridFileOps);
provide(undoRedoKey, undoRedo);
</script>
