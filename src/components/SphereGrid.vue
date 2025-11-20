<template>
  <div class="h-screen p-6">
    <div class="flex flex-col gap-4 h-full">
      <div
        v-if="isSharedView"
        class="bg-sphere-ability/20 border border-sphere-ability rounded-md p-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <Info class="h-4 w-4 text-sphere-ability" />
          <span class="text-sm font-medium">Viewing shared grid (read-only)</span>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="handleBackToMyGrid">
            <X class="h-4 w-4 mr-2" />
            Back to My Grid
          </Button>
          <Button variant="default" size="sm" @click="handleSaveSharedGrid">
            <Save class="h-4 w-4 mr-2" />
            Save to My Grids
          </Button>
        </div>
      </div>

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

      <HelpDialog
        v-model:open="showHelpDialog"
        :grid-type="gridType"
        @export="handleExport"
        @import="handleImport"
        @take-tour="startTour"
      />

      <div class="relative flex-1">
        <SphereGridCanvas ref="canvasRef" />
        <div class="absolute top-4 left-0 right-0 z-10 flex justify-center">
          <div class="flex flex-row gap-2">
            <FileActionsToolbar @export="handleExport" @import="handleImport" @share="handleShare" />
            <SphereGridToolbar
              data-tour="grid-toolbar"
              :grid-type="gridType"
              :display-mode="displayMode"
              @update:grid-type="gridType = $event"
              @update:display-mode="displayMode = $event"
            />
            <SphereToolbar v-if="!isSharedView" data-tour="sphere-toolbar" v-model="selectedType" />
            <GridControlsToolbar
              v-if="!isSharedView"
              data-tour="controls-toolbar"
              @reset="handleReset"
              @clear="handleClear"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useSphereData, generateSphereGrid } from "@/composables/useSphereData";
import { GridType } from "@/domain/grid/GridType";
import { useCytoscapeGrid } from "@/composables/useCytoscapeGrid";
import { useSphereGridTour } from "@/composables/useSphereGridTour";
import { useGridSharingStore } from "@/stores/gridSharing";
import { SphereType } from "@/domain/grid/SphereType";
import StatsBar from "./sphere-grid/StatsBar.vue";
import StatsDetailsDialog from "./sphere-grid/StatsDetailsDialog.vue";
import HelpDialog from "./sphere-grid/HelpDialog.vue";
import SphereGridCanvas from "./sphere-grid/SphereGridCanvas.vue";
import SphereGridToolbar from "./sphere-grid/SphereGridToolbar.vue";
import SphereToolbar from "./sphere-grid/SphereToolbar.vue";
import GridControlsToolbar from "./sphere-grid/GridControlsToolbar.vue";
import FileActionsToolbar from "./sphere-grid/FileActionsToolbar.vue";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";
import { Info, Save, X } from "lucide-vue-next";

// Grid sharing store
const gridSharingStore = useGridSharingStore();
const { isSharedView, sharedGridType } = storeToRefs(gridSharingStore);

// State
const selectedType = useLocalStorage<SphereType>("ffx-sphere-grid-selected-type", SphereType.Hp);
const displayMode = useLocalStorage<"icons" | "numbers">("ffx-sphere-grid-display-mode", "icons");

const storedGridType = useLocalStorage<GridType>("ffx-sphere-grid-type", GridType.Standard);
const gridType = ref<GridType>(sharedGridType.value || storedGridType.value);

const showIcons = computed(() => displayMode.value === "icons");
const selectedNodeIds = ref<string[]>([]);
const highlightedType = ref<SphereType | null>(null);
const showDetailsDialog = ref(false);
const showHelpDialog = ref(false);

watch(gridType, (newType) => {
  if (!isSharedView.value) {
    storedGridType.value = newType;
  }
});

watch(sharedGridType, (newType) => {
  if (newType) {
    gridType.value = newType;
  }
});

watch(isSharedView, (isShared) => {
  if (!isShared) {
    gridType.value = storedGridType.value;
  }
});

// Compute shared nodes for useSphereData
const sharedNodes = computed(() => {
  if (!isSharedView) return null;
  const defaultGrid = generateSphereGrid(gridType.value);
  return gridSharingStore.loadSharedGrid(defaultGrid.nodes);
});

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
  saveSharedGridToLocal,
} = useSphereData(gridType, sharedNodes);

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
  highlightedType,
  handleSelectionChange,
);

// Tour
const { startTour, shouldAutoStart } = useSphereGridTour();

// Initialize Cytoscape on mount
onMounted(() => {
  initializeCytoscape();
  if (shouldAutoStart() && !isSharedView.value) {
    setTimeout(() => startTour(), 500);
  }
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

// Handle share
function handleShare() {
  const defaultGrid = generateSphereGrid(gridType.value);
  const shareUrl = gridSharingStore.generateShareUrl(sphereData.value.nodes, defaultGrid.nodes, gridType.value);
  navigator.clipboard.writeText(shareUrl).then(() => {
    toast.success("Copied!", {
      description: "Share URL copied to clipboard",
      duration: 2500,
    });
  });
}

// Handle save shared grid to local
function handleSaveSharedGrid() {
  saveSharedGridToLocal();
  gridSharingStore.clearShareParams();
  toast.success("Grid saved!", {
    description: "Grid saved to your local storage",
    duration: 2500,
  });
}

// Handle back to my grid
function handleBackToMyGrid() {
  gridSharingStore.clearShareParams();
}
</script>
