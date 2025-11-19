<template>
  <div class="flex gap-6 h-screen p-6 bg-zinc-950 text-white">
    <!-- Sidebar Controls -->
    <div class="w-[320px] overflow-y-auto space-y-5 pr-2">
      <!-- Header -->
      <div class="space-y-1 pb-1">
        <h1 class="text-2xl font-bold text-gold">FFX Sphere Grid</h1>
        <p class="text-xs text-muted-foreground">Plan your character progression</p>
      </div>
      <Separator />
      <SphereSelector v-model="selectedType" />
      <Separator />
      <GridControls v-model:selection-mode="selectionMode" @reset="handleReset" @clear="handleClear" />
      <Separator />
      <StatsPanel :stats="stats" />
      <Separator />
      <SphereCountsPanel :counts="overriddenSphereCounts.counts" :total="overriddenSphereCounts.total" />
      <Separator />
      <InstructionsPanel />
    </div>

    <!-- Canvas Area -->
    <div class="flex-1 flex flex-col gap-4">
      <StatsBar
        :stats="stats"
        :counts="sphereCounts"
        :total="sphereData.nodes.length"
        :highlighted-type="highlightedType"
        @highlight="highlightedType = $event"
      />

      <div class="relative flex-1">
        <SphereGridCanvas ref="canvasRef" />
        <div class="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <ToggleGroup v-model="gridType" variant="outline" size="lg" type="single">
            <ToggleGroupItem value="standard" aria-label="Standard Grid">
              <span class="text-xs px-2">Standard</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="expert" aria-label="Expert Grid">
              <span class="text-xs px-2">Expert</span>
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup v-model="displayMode" variant="outline" size="lg" type="single">
            <ToggleGroupItem value="icons" aria-label="Show icons">
              <Image class="size-4 min-w-12" />
            </ToggleGroupItem>
            <ToggleGroupItem value="numbers" aria-label="Show numbers">
              <Hash class="size-4 min-w-12" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useLocalStorage } from "@vueuse/core"
import { useSphereData, type GridType } from "@/composables/useSphereData"
import { useCytoscapeGrid } from "@/composables/useCytoscapeGrid"
import type { SphereType } from "@/types/sphere"
import SphereSelector from "./sphere-grid/SphereSelector.vue"
import StatsPanel from "./sphere-grid/StatsPanel.vue"
import StatsBar from "./sphere-grid/StatsBar.vue"
import SphereCountsPanel from "./sphere-grid/SphereCountsPanel.vue"
import GridControls from "./sphere-grid/GridControls.vue"
import InstructionsPanel from "./sphere-grid/InstructionsPanel.vue"
import SphereGridCanvas from "./sphere-grid/SphereGridCanvas.vue"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Image, Hash } from "lucide-vue-next"

// State
const selectedType = useLocalStorage<SphereType>("ffx-sphere-grid-selected-type", "hp")
const displayMode = ref<"icons" | "numbers">("icons")
const gridType = ref<GridType>("standard")
const showIcons = computed(() => displayMode.value === "icons")
const selectionMode = useLocalStorage("ffx-sphere-grid-selection-mode", false)
const selectedNodeIds = ref<string[]>([])
const highlightedType = ref<SphereType | null>(null)

// Highest values for each sphere type
const highestValues: Record<SphereType, number> = {
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
}

// Composables
const { sphereData, stats, sphereCounts, overriddenSphereCounts, resetGrid, clearGrid, updateNode, updateNodes } = useSphereData(gridType)

// Canvas ref
const canvasRef = ref<InstanceType<typeof SphereGridCanvas> | null>(null)
const cyContainer = computed(() => canvasRef.value?.container ?? null)

// Selection change handler - automatically apply selected type
function handleSelectionChange(nodeIds: string[]) {
  selectedNodeIds.value = nodeIds

  if (nodeIds.length > 0) {
    const value = highestValues[selectedType.value]
    updateNodes(nodeIds, selectedType.value, value)
    updateSelectedNodes(nodeIds, selectedType.value, value)
    clearSelection()
    selectedNodeIds.value = []
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
)

// Initialize Cytoscape on mount
onMounted(() => {
  initializeCytoscape()
})

// Reinitialize when grid type changes
watch(gridType, () => {
  initializeCytoscape()
})

// Reset handler
const handleReset = () => {
  resetGrid(resetNodes)
}

// Clear handler
const handleClear = () => {
  clearGrid(resetNodes)
}

// Clear selection when switching modes
watch(selectionMode, (isSelectionMode) => {
  if (!isSelectionMode) {
    clearSelection()
    selectedNodeIds.value = []
  }
})
</script>
