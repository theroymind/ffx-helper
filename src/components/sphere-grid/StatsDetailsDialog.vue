<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-gold text-xl font-bold">Character Details</DialogTitle>
      </DialogHeader>
      <div data-test-id="stats-details-dialog" class="space-y-4">
        <StatsPanel :stats="stats" />
        <SphereCountsPanel :counts="counts" :total="total" />
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatsPanel from "./StatsPanel.vue";
import SphereCountsPanel from "./SphereCountsPanel.vue";
import type { Stats } from "@/domain/grid/Stats";

const isOpen = defineModel<boolean>("open", { required: true });

defineProps<{
  stats: Stats;
  counts: Record<string, number>;
  total: number;
}>();
</script>
