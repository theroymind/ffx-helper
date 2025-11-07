<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo, sphereColors } from '@/constants/sphere'

defineProps<{
  counts: Record<string, number>
  total: number
}>()

const getVisibleTypes = (counts: Record<string, number>) => {
  return Object.entries(sphereTypeInfo)
    .filter(([type]) => type !== 'locked' && counts[type] > 0)
    .map(([type, info]) => ({ type: type as SphereType, info, count: counts[type] }))
}
</script>

<template>
  <Card class="bg-zinc-900/50 border-zinc-700 shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-amber-400 text-base font-semibold flex items-center gap-2">
        Customized Spheres
        <Badge variant="secondary" class="bg-amber-400/20 text-amber-400 font-bold text-xs">{{ total }}</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="total > 0" class="space-y-1.5">
        <div
          v-for="{ type, info, count } in getVisibleTypes(counts)"
          :key="type"
          class="flex justify-between items-center px-2.5 py-1.5 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
        >
          <span class="font-semibold text-xs" :style="{ color: sphereColors[type] }">{{ info.label }}</span>
          <Badge :style="{ backgroundColor: sphereColors[type] }" class="text-white font-bold px-2 text-xs shadow-md">
            {{ count }}
          </Badge>
        </div>
      </div>
      <div v-else class="text-center py-4 space-y-2">
        <p class="text-slate-400 font-medium text-sm">No spheres customized yet</p>
        <p class="text-xs text-slate-500 leading-relaxed">
          Select a sphere type and click & drag over spheres!
        </p>
      </div>
    </CardContent>
  </Card>
</template>
