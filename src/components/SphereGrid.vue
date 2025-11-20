<template>
  <div class="h-screen p-6">
    <div class="flex flex-col gap-4 h-full">
      <StatsBar
        :stats="stats"
        :counts="sphereCounts"
        :total="sphereData.nodes.length"
        :highlighted-type="highlightedType"
        @highlight="highlightedType = $event"
        @open-details="showDetailsDialog = true"
        @open-help="showHelpDialog = true"
      />

      <StatsDetailsDialog
        v-model:open="showDetailsDialog"
        :stats="stats"
        :counts="overriddenSphereCounts.counts"
        :total="overriddenSphereCounts.total"
      />

      <HelpDialog v-model:open="showHelpDialog" :grid-type="gridType" @export="handleExport" @import="handleImport" />

      <div class="relative flex-1">
        <SphereGridCanvas ref="canvasRef" />
        <div class="absolute top-4 left-0 right-0 z-10 flex justify-center">
          <div class="flex flex-row gap-2">
            <SphereGridToolbar
              :grid-type="gridType"
              :display-mode="displayMode"
              @update:grid-type="gridType = $event"
              @update:display-mode="displayMode = $event"
              @export="handleExport"
              @import="handleImport"
            />
            <SphereToolbar v-model="selectedType" />
            <GridControlsToolbar v-model:selection-mode="selectionMode" @reset="handleReset" @clear="handleClear" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useSphereData, type GridType } from "@/composables/useSphereData";
import { useCytoscapeGrid } from "@/composables/useCytoscapeGrid";
import type { SphereType } from "@/types/sphere";
import StatsBar from "./sphere-grid/StatsBar.vue";
import StatsDetailsDialog from "./sphere-grid/StatsDetailsDialog.vue";
import HelpDialog from "./sphere-grid/HelpDialog.vue";
import SphereGridCanvas from "./sphere-grid/SphereGridCanvas.vue";
import SphereGridToolbar from "./sphere-grid/SphereGridToolbar.vue";
import SphereToolbar from "./sphere-grid/SphereToolbar.vue";
import GridControlsToolbar from "./sphere-grid/GridControlsToolbar.vue";

// State
const selectedType = useLocalStorage<SphereType>("ffx-sphere-grid-selected-type", "hp");
const displayMode = ref<"icons" | "numbers">("icons");
const gridType = ref<GridType>("standard");
const showIcons = computed(() => displayMode.value === "icons");
const selectionMode = useLocalStorage("ffx-sphere-grid-selection-mode", false);
const selectedNodeIds = ref<string[]>([]);
const highlightedType = ref<SphereType | null>(null);
const showDetailsDialog = ref(false);
const showHelpDialog = ref(false);

const lowestValues: Record<SphereType, number> = {
  hp: 300,
  mp: 40,
  strength: 4,
  defense: 4,
  magic: 4,
  magicDef: 4,
  agility: 4,
  accuracy: 4,
  evasion: 4,
  luck: 4,
  empty: 0,
  locked: 0,
};

// Composables
const {
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
} = useSphereData(gridType);

// Canvas ref
const canvasRef = ref<InstanceType<typeof SphereGridCanvas> | null>(null);
const cyContainer = computed(() => canvasRef.value?.container ?? null);

// Selection change handler - automatically apply selected type
function handleSelectionChange(nodeIds: string[]) {
  selectedNodeIds.value = nodeIds;

  if (nodeIds.length > 0) {
    const value = lowestValues[selectedType.value];
    updateNodes(nodeIds, selectedType.value, value);
    updateSelectedNodes(nodeIds, selectedType.value, value);
    clearSelection();
    selectedNodeIds.value = [];
  }
}

// Cytoscape grid
const { initializeCytoscape, resetNodes, clearSelection, updateSelectedNodes } = useCytoscapeGrid(
  cyContainer,
  sphereData,
  selectedType,
  updateNode,
  showIcons,
  selectionMode,
  highlightedType,
  handleSelectionChange,
);

// Initialize Cytoscape on mount
onMounted(() => {
  initializeCytoscape();
});

// Reinitialize when grid type changes
watch(gridType, () => {
  initializeCytoscape();
});

// Reset handler
const handleReset = () => {
  resetGrid(resetNodes);
};

// Clear handler
const handleClear = () => {
  clearGrid(resetNodes);
};

// Clear selection when switching modes
watch(selectionMode, (isSelectionMode) => {
  if (!isSelectionMode) {
    clearSelection();
    selectedNodeIds.value = [];
  }
});

// Handle export
function handleExport() {
  exportGrid();
}

// Handle import
async function handleImport(file: File) {
  try {
    await importGrid(file, resetNodes);
    showHelpDialog.value = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import grid";
    alert(message);
  }
}
</script>
