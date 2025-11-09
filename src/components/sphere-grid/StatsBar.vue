<template>
  <div class="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 flex-wrap">
      <div v-for="stat in statDisplay" :key="stat.key" class="flex items-center gap-1.5 border rounded-md p-2">
        <span class="font-semibold text-xs" :class="stat.colorClass">{{ stat.label }}</span>
        <div class="font-mono text-sm font-bold tabular-nums flex items-center gap-1">
          <template v-if="stat.isCapped">
            <span class="text-success">{{ stat.cappedValue }}</span>
            <span class="text-destructive text-xs">({{ stat.actualValue }})</span>
          </template>
          <span v-else class="text-white">{{ stat.value }}</span>
        </div>
        <Badge v-if="stat.count > 0" :variant="stat.badgeVariant" class="font-mono text-xs">
          {{ stat.count }}
        </Badge>
      </div>
    </div>

    <div class="flex flex-col items-center gap-2 text-right pl-4 border-l">
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">Overridden:</span>
        <Badge variant="secondary" class="font-mono font-bold">
          {{ totalOverridden }}
        </Badge>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">Total:</span>
        <Badge variant="secondary" class="font-mono font-bold">
          {{ total }}
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Badge } from "@/components/ui/badge"
import type { Stats } from "@/types/sphere"

const props = defineProps<{
  stats: Stats
  counts: Record<string, number>
  total: number
}>()

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
} as const

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
    label: "MDEF",
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
]

const totalOverridden = computed(() => {
  return Object.values(props.counts).reduce((sum, count) => sum + count, 0)
})

const statDisplay = computed(() => {
  return statDisplayConfig.map((config) => {
    const value = props.stats[config.key]
    const isCapped = value > config.cap
    const isOverCap = config.overCap && value > config.overCap
    const count = props.counts[config.key] || 0

    return {
      ...config,
      value,
      isCapped,
      isOverCap,
      cappedValue: Math.min(value, config.cap),
      actualValue: value,
      count,
    }
  })
})
</script>
