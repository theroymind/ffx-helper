<template>
  <div class="flex gap-6 h-screen p-6 bg-zinc-950 text-white">
    <!-- Sidebar Controls -->
    <div class="w-[320px] overflow-y-auto space-y-5 pr-2">
      <!-- Header -->
      <div class="space-y-1 pb-1">
        <h1 class="text-2xl font-bold text-amber-400">FFX Sphere Grid</h1>
        <p class="text-xs text-zinc-400">Plan your character progression</p>
      </div>

      <Separator class="bg-zinc-700/50" />

      <!-- Sphere Selector -->
      <SphereSelector v-model="selectedType" />

      <Separator class="bg-zinc-700/50" />

      <!-- Grid Controls -->
      <GridControls @reset="handleReset" />

      <Separator class="bg-zinc-700/50" />

      <!-- Stats Panel -->
      <StatsPanel :stats="stats" />

      <Separator class="bg-zinc-700/50" />

      <!-- Sphere Counts Panel -->
      <SphereCountsPanel
        :counts="overriddenSphereCounts.counts"
        :total="overriddenSphereCounts.total"
      />

      <Separator class="bg-zinc-700/50" />

      <!-- Instructions -->
      <InstructionsPanel />
    </div>

    <!-- Canvas with Toggle Overlay -->
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSphereData, type GridType } from '@/composables/useSphereData'
import { useCytoscapeGrid } from '@/composables/useCytoscapeGrid'
import type { SphereType } from '@/types/sphere'
import SphereSelector from './sphere-grid/SphereSelector.vue'
import StatsPanel from './sphere-grid/StatsPanel.vue'
import SphereCountsPanel from './sphere-grid/SphereCountsPanel.vue'
import GridControls from './sphere-grid/GridControls.vue'
import InstructionsPanel from './sphere-grid/InstructionsPanel.vue'
import SphereGridCanvas from './sphere-grid/SphereGridCanvas.vue'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Image, Hash } from 'lucide-vue-next'

// State
const selectedType = ref<SphereType>('hp')
const displayMode = ref<'icons' | 'numbers'>('icons')
const gridType = ref<GridType>('standard')
const showIcons = computed(() => displayMode.value === 'icons')

// Composables
const { sphereData, stats, overriddenSphereCounts, resetGrid, updateNode } = useSphereData(gridType)

// Canvas ref
const canvasRef = ref<InstanceType<typeof SphereGridCanvas> | null>(null)
const cyContainer = computed(() => canvasRef.value?.container ?? null)

// Cytoscape grid
const { initializeCytoscape, resetNodes } = useCytoscapeGrid(
  cyContainer,
  sphereData,
  selectedType,
  updateNode,
  showIcons,
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
</script>
