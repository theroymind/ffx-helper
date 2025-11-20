<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-gold text-base font-semibold">Current Stats</CardTitle>
    </CardHeader>
    <CardContent>
      <div
        v-for="stat in statDisplay"
        :key="stat.key"
        class="flex justify-between items-center rounded transition-colors"
      >
        <span class="font-semibold text-xs" :class="stat.colorClass">{{ stat.label }}</span>
        <div class="font-mono text-base font-bold tabular-nums flex items-center gap-2">
          <template v-if="stat.isCapped">
            <span class="text-success">{{ stat.cappedValue }}</span>
            <span class="text-destructive">({{ stat.actualValue }})</span>
            <span v-if="stat.isOverCap" class="text-xs text-destructive">!</span>
          </template>
          <span v-else class="text-foreground">{{ stat.value }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Stats } from "@/domain/grid/Stats";

const props = defineProps<{
  stats: Stats;
}>();

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
  { key: "hp" as const, label: "HP", colorClass: "text-sphere-hp", cap: statCaps.hp, overCap: 99999 },
  { key: "mp" as const, label: "MP", colorClass: "text-sphere-mp", cap: statCaps.mp },
  { key: "strength" as const, label: "Strength", colorClass: "text-sphere-strength", cap: statCaps.strength },
  { key: "defense" as const, label: "Defense", colorClass: "text-sphere-defense", cap: statCaps.defense },
  { key: "magic" as const, label: "Magic", colorClass: "text-sphere-magic", cap: statCaps.magic },
  { key: "magicDef" as const, label: "Magic Def", colorClass: "text-sphere-magicDef", cap: statCaps.magicDef },
  { key: "agility" as const, label: "Agility", colorClass: "text-sphere-agility", cap: statCaps.agility },
  { key: "accuracy" as const, label: "Accuracy", colorClass: "text-sphere-accuracy", cap: statCaps.accuracy },
  { key: "evasion" as const, label: "Evasion", colorClass: "text-sphere-evasion", cap: statCaps.evasion },
  { key: "luck" as const, label: "Luck", colorClass: "text-sphere-luck", cap: statCaps.luck },
];

const statDisplay = computed(() => {
  return statDisplayConfig.map((config) => {
    const value = props.stats[config.key];
    const isCapped = value > config.cap;
    const isOverCap = config.overCap && value > config.overCap;

    return {
      ...config,
      value,
      isCapped,
      isOverCap,
      cappedValue: Math.min(value, config.cap),
      actualValue: value,
    };
  });
});
</script>
