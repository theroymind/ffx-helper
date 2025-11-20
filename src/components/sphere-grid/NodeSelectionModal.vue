<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Change Selected Nodes</DialogTitle>
        <DialogDescription>
          {{ selectedCount }} {{ selectedCount === 1 ? "node" : "nodes" }} selected. Choose a sphere type to apply
          (highest value will be used).
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-6 py-4">
        <div>
          <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Stat Spheres</h3>
          <div class="grid grid-cols-2 gap-2">
            <StatButton v-for="type in statTypes" :key="type" :stat-type="type" @click="handleSelectType(type)" />
          </div>
        </div>

        <div>
          <h3 class="m-0 mb-3 text-sm font-semibold text-foreground uppercase tracking-wide">Special Types</h3>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            <Button @click="handleSelectType(SphereType.Empty)" variant="secondary"> Empty </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { SphereType } from "@/domain/grid/SphereType";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatButton } from ".";
import { Button } from "@/components/ui/button";

defineProps<{
  open: boolean;
  selectedCount: number;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  apply: [type: SphereType, value: number];
}>();

const statTypes: SphereType[] = [
  SphereType.Hp,
  SphereType.Mp,
  SphereType.Strength,
  SphereType.Defense,
  SphereType.Magic,
  SphereType.MagicDef,
  SphereType.Agility,
  SphereType.Accuracy,
  SphereType.Evasion,
  SphereType.Luck,
];

const highestValues: Record<SphereType, number> = {
  [SphereType.Hp]: 300,
  [SphereType.Mp]: 40,
  [SphereType.Strength]: 4,
  [SphereType.Defense]: 4,
  [SphereType.Magic]: 4,
  [SphereType.MagicDef]: 4,
  [SphereType.Agility]: 4,
  [SphereType.Accuracy]: 4,
  [SphereType.Evasion]: 4,
  [SphereType.Luck]: 4,
  [SphereType.Empty]: 0,
  [SphereType.Locked]: 0,
};

function handleSelectType(type: SphereType) {
  emit("apply", type, highestValues[type]);
  emit("update:open", false);
}
</script>
