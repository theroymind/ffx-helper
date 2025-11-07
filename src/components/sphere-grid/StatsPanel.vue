<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Stats } from '@/types/sphere'
import { sphereColors } from '@/constants/sphere'

defineProps<{
  stats: Stats
}>()

const statDisplay = [
  { key: 'hp' as const, label: 'HP', color: sphereColors.hp },
  { key: 'mp' as const, label: 'MP', color: sphereColors.mp },
  { key: 'strength' as const, label: 'Strength', color: sphereColors.strength },
  { key: 'defense' as const, label: 'Defense', color: sphereColors.defense },
  { key: 'magic' as const, label: 'Magic', color: sphereColors.magic },
  { key: 'magicDef' as const, label: 'Magic Def', color: sphereColors.magicDef },
  { key: 'agility' as const, label: 'Agility', color: sphereColors.agility },
  { key: 'accuracy' as const, label: 'Accuracy', color: sphereColors.accuracy },
  { key: 'evasion' as const, label: 'Evasion', color: sphereColors.evasion },
  { key: 'luck' as const, label: 'Luck', color: sphereColors.luck },
]
</script>

<template>
  <Card class="bg-zinc-900/50 border-zinc-700 shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-amber-400 text-base font-semibold">Current Stats</CardTitle>
    </CardHeader>
    <CardContent class="space-y-1.5">
      <div
        v-for="stat in statDisplay"
        :key="stat.key"
        class="flex justify-between items-center roundedhover:bg-zinc-800 transition-colors"
      >
        <span class="font-semibold text-xs" :style="{ color: stat.color }">{{ stat.label }}</span>
        <span class="font-mono text-base font-bold text-white tabular-nums">{{
          stats[stat.key]
        }}</span>
      </div>
    </CardContent>
  </Card>
</template>
