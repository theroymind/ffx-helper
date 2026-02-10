<template>
  <div data-test-id="sphere-grid" class="h-screen p-2 md:p-6">
    <div class="flex flex-col gap-2 md:gap-4 h-full">
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
        class="hidden md:block"
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

      <div class="relative flex-1 overflow-hidden">
        <SphereGridCanvas ref="canvasRef" />
        <div
          class="absolute top-2 md:top-4 left-0 right-0 z-10 flex flex-col items-center gap-2 px-2 md:px-0 overflow-hidden"
        >
          <div
            data-test-id="toolbar-row"
            class="flex flex-row gap-2 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            <FileActionsToolbar @export="handleExport" @import="handleImport" @share="handleShare" />
            <SphereGridToolbar
              data-tour="grid-toolbar"
              :grid-type="gridType"
              :display-mode="displayMode"
              @update:grid-type="handleGridTypeChange"
              @update:display-mode="displayMode = $event"
            />
            <GridControlsToolbar
              v-if="!isSharedView"
              data-tour="controls-toolbar"
              @reset="handleReset"
              @clear="handleClear"
            />
            <Card class="p-2 md:hidden">
              <div class="flex gap-1">
                <Button
                  data-test-id="mobile-stats-button"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click="showDetailsDialog = true"
                >
                  <BarChart3 class="h-4 w-4" />
                </Button>
                <Button
                  data-test-id="mobile-help-button"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click="showHelpDialog = true"
                >
                  <HelpCircle class="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
          <SphereToolbar v-if="!isSharedView" data-tour="sphere-toolbar" v-model="selectedType" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, toRef } from "vue";
import { useLocalStorage, useEventListener } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { GridType } from "@/domain/grid/GridType";
import { useCytoscapeGrid } from "@/composables/useCytoscapeGrid";
import { useSphereGridTour } from "@/composables/useSphereGridTour";
import { useGridSharingStore } from "@/stores/gridSharing";
import { SphereType } from "@/domain/grid/SphereType";
import { injectGridState } from "@/composables/useGridState";
import { injectGridStats } from "@/composables/useGridStats";
import { injectGridFileOps } from "@/composables/useGridFileOps";
import { injectUndoRedo } from "@/composables/useUndoRedo";
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
import { Info, Save, X, BarChart3, HelpCircle } from "lucide-vue-next";
import { Card } from "@/components/ui/card";

const props = defineProps<{
  gridType: GridType;
}>();

const emit = defineEmits<{
  "update:grid-type": [value: GridType];
}>();

const gridType = toRef(props, "gridType");

const gridSharingStore = useGridSharingStore();
const { isSharedView } = storeToRefs(gridSharingStore);

const { sphereData, defaultNodes, updateNode, updateNodes, resetGrid, clearGrid } = injectGridState();
const { stats, sphereCounts, overriddenSphereCounts } = injectGridStats();
const { exportGrid, importGrid, saveSharedGridToLocal } = injectGridFileOps();
const undoRedo = injectUndoRedo();

const selectedType = useLocalStorage<SphereType>("ffx-sphere-grid-selected-type", SphereType.Hp);
const displayMode = useLocalStorage<"icons" | "numbers">("ffx-sphere-grid-display-mode", "icons");

const showIcons = computed(() => displayMode.value === "icons");
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

function handleGridTypeChange(newType: GridType) {
  emit("update:grid-type", newType);
}

const canvasRef = ref<InstanceType<typeof SphereGridCanvas> | null>(null);
const cyContainer = computed(() => canvasRef.value?.container ?? null);

function handleSelectionChange(nodeIds: string[]) {
  selectedNodeIds.value = nodeIds;

  if (nodeIds.length > 0) {
    undoRedo.beginAction();
    const value = lowestValues[selectedType.value];
    updateNodes(nodeIds, selectedType.value, value);
    updateSelectedNodes(nodeIds, selectedType.value, value);
    clearSelection();
    selectedNodeIds.value = [];
    undoRedo.commitAction();
  }
}

const { initializeCytoscape, resetNodes, clearSelection, updateSelectedNodes } = useCytoscapeGrid(
  cyContainer,
  sphereData,
  selectedType,
  updateNode,
  showIcons,
  highlightedType,
  handleSelectionChange,
  () => undoRedo.beginAction(),
  () => undoRedo.commitAction(),
);

function syncVisuals() {
  resetNodes(sphereData.value.nodes);
}

useEventListener(document, "keydown", (event: KeyboardEvent) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key === "z" && !event.shiftKey) {
    event.preventDefault();
    undoRedo.undo(syncVisuals);
  }
  if (mod && event.key === "z" && event.shiftKey) {
    event.preventDefault();
    undoRedo.redo(syncVisuals);
  }
});

const { startTour, shouldAutoStart } = useSphereGridTour();

onMounted(() => {
  initializeCytoscape();
  if (shouldAutoStart() && !isSharedView.value) {
    setTimeout(() => startTour(), 500);
  }
});

watch(gridType, () => {
  undoRedo.clearHistory();
  initializeCytoscape();
});

const handleReset = () => {
  resetGrid(resetNodes);
};

const handleClear = () => {
  clearGrid(resetNodes);
};

function handleExport() {
  exportGrid();
}

async function handleImport(file: File) {
  try {
    undoRedo.beginAction();
    await importGrid(file, resetNodes);
    undoRedo.commitAction();
    showHelpDialog.value = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import grid";
    alert(message);
  }
}

function handleShare() {
  const shareUrl = gridSharingStore.generateShareUrl(sphereData.value.nodes, defaultNodes.value, gridType.value);
  navigator.clipboard.writeText(shareUrl).then(() => {
    toast.success("Copied!", {
      description: "Share URL copied to clipboard",
      duration: 2500,
    });
  });
}

function handleSaveSharedGrid() {
  saveSharedGridToLocal();
  gridSharingStore.clearShareParams();
  toast.success("Grid saved!", {
    description: "Grid saved to your local storage",
    duration: 2500,
  });
}

function handleBackToMyGrid() {
  gridSharingStore.clearShareParams();
}
</script>
