<template>
  <div class="flex gap-8">
    <p class="font-semibold">Nodes placed: {{ ctx.nodes.value.length }}</p>
    <p class="font-semibold">Connections: {{ connectionsCount }}</p>
    <p class="font-semibold">Target: ~860 nodes</p>
    <p v-if="ctx.referenceNodes.value.length > 0" class="font-semibold">
      Reference nodes: {{ ctx.referenceNodes.value.length }}
    </p>
    <p class="font-semibold">Canvas: {{ ctx.canvasWidth.value }}x{{ ctx.canvasHeight.value }}</p>
    <p class="font-semibold">Zoom: {{ zoomPercentage }}%</p>
    <p v-if="ctx.imageScale.value !== 1.0" class="font-semibold">Image scale: {{ ctx.imageScale.value.toFixed(3) }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useGridMapperContext } from "@/composables/useGridMapperContext"

const ctx = useGridMapperContext()

const connectionsCount = computed(() => {
  return ctx.nodes.value.reduce((sum, node) => sum + node.connections.length, 0) / 2
})

const zoomPercentage = computed(() => (ctx.viewScale.value * 100).toFixed(0))
</script>
