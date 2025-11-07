<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { Stats } from "@/types/sphere"

defineProps<{
  stats: Stats
}>()

const statDisplay = [
  { key: "hp" as const, label: "HP", colorClass: "text-sphere-hp" },
  { key: "mp" as const, label: "MP", colorClass: "text-sphere-mp" },
  { key: "strength" as const, label: "Strength", colorClass: "text-sphere-strength" },
  { key: "defense" as const, label: "Defense", colorClass: "text-sphere-defense" },
  { key: "magic" as const, label: "Magic", colorClass: "text-sphere-magic" },
  { key: "magicDef" as const, label: "Magic Def", colorClass: "text-sphere-magicDef" },
  { key: "agility" as const, label: "Agility", colorClass: "text-sphere-agility" },
  { key: "accuracy" as const, label: "Accuracy", colorClass: "text-sphere-accuracy" },
  { key: "evasion" as const, label: "Evasion", colorClass: "text-sphere-evasion" },
  { key: "luck" as const, label: "Luck", colorClass: "text-sphere-luck" },
]
</script>

<template>
  <Card class="shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-gold text-base font-semibold">Current Stats</CardTitle>
    </CardHeader>
    <CardContent class="space-y-1.5">
      <div
        v-for="stat in statDisplay"
        :key="stat.key"
        class="flex justify-between items-center rounded transition-colors"
      >
        <span class="font-semibold text-xs" :class="stat.colorClass">{{ stat.label }}</span>
        <span class="font-mono text-base font-bold text-white tabular-nums">{{ stats[stat.key] }}</span>
      </div>
    </CardContent>
  </Card>
</template>
