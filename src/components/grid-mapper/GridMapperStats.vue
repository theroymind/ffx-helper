<template>
  <div class="flex items-center gap-4 text-xs">
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground">Nodes:</span>
      <span class="font-semibold text-foreground">{{ ctx.nodes.value.length }}/860</span>
      <div class="w-20 h-1 bg-muted rounded-full overflow-hidden">
        <div
          class="h-full bg-gold transition-all duration-300"
          :style="{ width: `${Math.min(100, (ctx.nodes.value.length / 860) * 100)}%` }"
        ></div>
      </div>
    </div>
    <Separator orientation="vertical" class="h-4" />
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground">Connections:</span>
      <span class="font-semibold text-foreground">{{ connectionsCount }}</span>
    </div>
    <Separator v-if="ctx.referenceNodes.value.length > 0" orientation="vertical" class="h-4" />
    <div v-if="ctx.referenceNodes.value.length > 0" class="flex items-center gap-2">
      <span class="text-muted-foreground">Reference:</span>
      <span class="font-semibold text-foreground">{{ ctx.referenceNodes.value.length }}</span>
    </div>
    <Separator orientation="vertical" class="h-4" />
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground">Zoom:</span>
      <span class="font-semibold text-foreground">{{ zoomPercentage }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Separator } from "@/components/ui/separator";
import { useGridMapperContext } from "@/composables/useGridMapperContext";

const ctx = useGridMapperContext();

const connectionsCount = computed(() => {
  return ctx.nodes.value.reduce((sum, node) => sum + node.connections.length, 0) / 2;
});

const zoomPercentage = computed(() => (ctx.viewScale.value * 100).toFixed(0));
</script>
