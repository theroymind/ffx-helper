<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo } from '@/constants/sphere'

defineProps<{
  counts: Record<string, number>
  total: number
}>()

const getVisibleTypes = (counts: Record<string, number>) => {
  return Object.entries(sphereTypeInfo)
    .filter(([type]) => type !== 'locked' && counts[type] > 0)
    .map(([type, info]) => ({ type: type as SphereType, info, count: counts[type] }))
}

// Map sphere types to Tailwind color classes (uses CSS custom properties from styles.css)
const textColorClasses: Record<SphereType, string> = {
  empty: 'text-zinc-400',
  hp: 'text-sphere-hp',
  mp: 'text-sphere-mp',
  strength: 'text-sphere-strength',
  defense: 'text-sphere-defense',
  magic: 'text-sphere-magic',
  magicDef: 'text-sphere-magicDef',
  agility: 'text-sphere-agility',
  accuracy: 'text-sphere-accuracy',
  evasion: 'text-sphere-evasion',
  luck: 'text-sphere-luck',
  locked: 'text-zinc-500',
}

const badgeColorClasses: Record<SphereType, string> = {
  empty: 'bg-zinc-700 text-white',
  hp: 'bg-sphere-hp text-sphere-hp-foreground',
  mp: 'bg-sphere-mp text-sphere-mp-foreground',
  strength: 'bg-sphere-strength text-sphere-strength-foreground',
  defense: 'bg-sphere-defense text-sphere-defense-foreground',
  magic: 'bg-sphere-magic text-sphere-magic-foreground',
  magicDef: 'bg-sphere-magicDef text-sphere-magicDef-foreground',
  agility: 'bg-sphere-agility text-sphere-agility-foreground',
  accuracy: 'bg-sphere-accuracy text-sphere-accuracy-foreground',
  evasion: 'bg-sphere-evasion text-sphere-evasion-foreground',
  luck: 'bg-sphere-luck text-sphere-luck-foreground',
  locked: 'bg-zinc-600 text-white',
}
</script>

<template>
  <Card class="bg-zinc-900/50 border-zinc-700 shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-gold text-base font-semibold flex items-center gap-2">
        Customized Spheres
        <Badge variant="secondary" class="bg-gold/20 text-gold font-bold text-xs">{{
          total
        }}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="total > 0" class="space-y-1.5">
        <div
          v-for="{ type, info, count } in getVisibleTypes(counts)"
          :key="type"
          class="flex justify-between items-center px-2.5 py-1.5 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
        >
          <span class="font-semibold text-xs" :class="textColorClasses[type]">{{
            info.label
          }}</span>
          <Badge :class="badgeColorClasses[type]" class="font-bold px-2 text-xs shadow-md">
            {{ count }}
          </Badge>
        </div>
      </div>
      <div v-else class="text-center py-4 space-y-2">
        <p class="font-medium text-sm">No spheres customized yet</p>
        <p class="text-xs leading-relaxed">Select a sphere type and click & drag over spheres!</p>
      </div>
    </CardContent>
  </Card>
</template>
