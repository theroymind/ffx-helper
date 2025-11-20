<template>
  <div class="bg-card border rounded-lg px-3 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 min-w-0">
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 flex-1 min-w-0">
      <div
        v-for="stat in statDisplay"
        :key="stat.key"
        class="flex items-center gap-1 border rounded-md p-1.5 cursor-pointer transition-all min-w-0"
        :class="{
          'ring-2 ring-ring shadow-lg': highlightedType === stat.key,
          'opacity-50': highlightedType && highlightedType !== stat.key,
        }"
        @click="handleStatClick(stat.key)"
      >
        <span class="font-semibold text-xs whitespace-nowrap" :class="stat.colorClass">{{ stat.label }}</span>
        <div class="font-mono text-sm font-bold tabular-nums flex items-center gap-1 min-w-0">
          <template v-if="stat.isCapped">
            <span class="text-success">{{ stat.cappedValue }}</span>
            <span class="text-destructive text-xs">({{ stat.actualValue }})</span>
          </template>
          <span v-else class="text-foreground">{{ stat.value }}</span>
        </div>
        <Badge v-if="stat.count > 0" :variant="stat.badgeVariant" class="font-mono text-xs">
          {{ stat.count }}
        </Badge>
      </div>
    </div>

    <div class="flex items-center gap-3 md:pl-3 md:border-l flex-shrink-0">
      <div class="grid grid-cols-[auto_auto] gap-x-2 gap-y-2 items-center">
        <span class="text-xs text-muted-foreground text-right">Overridden:</span>
        <Badge variant="secondary" class="font-mono font-bold">
          {{ totalOverridden }}
        </Badge>
        <span class="text-xs text-muted-foreground text-right">Total:</span>
        <Badge variant="secondary" class="font-mono font-bold">
          {{ total }}
        </Badge>
      </div>
      <div class="flex flex-col gap-2">
        <Button variant="outline" size="sm" @click="emit('openDetails')">Details</Button>
        <Button variant="outline" size="sm" @click="emit('openHelp')">Help</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Stats, SphereType } from "@/types/sphere";

const props = defineProps<{
  stats: Stats;
  counts: Record<string, number>;
  total: number;
  highlightedType: SphereType | null;
}>();

const emit = defineEmits<{
  highlight: [type: SphereType | null];
  openDetails: [];
  openHelp: [];
}>();

function handleStatClick(type: SphereType) {
  if (props.highlightedType === type) {
    emit("highlight", null);
  } else {
    emit("highlight", type);
  }
}

const statCaps = {
  hp: 9999,
  mp: 999,
  strength: 255,
  defense: 255,
  magic: 255,
  magicDef: 255,
  agility: 255,
  accuracy: 255,
  evasion: 255,
  luck: 255,
} as const;

const statDisplayConfig = [
  {
    key: "hp" as const,
    label: "HP",
    colorClass: "text-sphere-hp",
    badgeVariant: "hp" as const,
    cap: statCaps.hp,
    overCap: 99999,
  },
  { key: "mp" as const, label: "MP", colorClass: "text-sphere-mp", badgeVariant: "mp" as const, cap: statCaps.mp },
  {
    key: "strength" as const,
    label: "STR",
    colorClass: "text-sphere-strength",
    badgeVariant: "strength" as const,
    cap: statCaps.strength,
  },
  {
    key: "defense" as const,
    label: "DEF",
    colorClass: "text-sphere-defense",
    badgeVariant: "defense" as const,
    cap: statCaps.defense,
  },
  {
    key: "magic" as const,
    label: "MAG",
    colorClass: "text-sphere-magic",
    badgeVariant: "magic" as const,
    cap: statCaps.magic,
  },
  {
    key: "magicDef" as const,
    label: "MDF",
    colorClass: "text-sphere-magicDef",
    badgeVariant: "magicDef" as const,
    cap: statCaps.magicDef,
  },
  {
    key: "agility" as const,
    label: "AGI",
    colorClass: "text-sphere-agility",
    badgeVariant: "agility" as const,
    cap: statCaps.agility,
  },
  {
    key: "accuracy" as const,
    label: "ACC",
    colorClass: "text-sphere-accuracy",
    badgeVariant: "accuracy" as const,
    cap: statCaps.accuracy,
  },
  {
    key: "evasion" as const,
    label: "EVA",
    colorClass: "text-sphere-evasion",
    badgeVariant: "evasion" as const,
    cap: statCaps.evasion,
  },
  {
    key: "luck" as const,
    label: "LCK",
    colorClass: "text-sphere-luck",
    badgeVariant: "luck" as const,
    cap: statCaps.luck,
  },
];

const totalOverridden = computed(() => {
  return Object.values(props.counts).reduce((sum, count) => sum + count, 0);
});

const statDisplay = computed(() => {
  return statDisplayConfig.map((config) => {
    const value = props.stats[config.key];
    const isCapped = value > config.cap;
    const isOverCap = config.overCap && value > config.overCap;
    const count = props.counts[config.key] || 0;

    return {
      ...config,
      value,
      isCapped,
      isOverCap,
      cappedValue: Math.min(value, config.cap),
      actualValue: value,
      count,
    };
  });
});
</script>
