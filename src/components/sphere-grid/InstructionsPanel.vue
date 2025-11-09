<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Info } from "lucide-vue-next"
</script>

<template>
  <Card class="shadow-lg">
    <CardHeader class="pb-2">
      <CardTitle class="text-gold font-semibold flex items-center gap-2">
        <Info class="h-4 w-4" />
        How to Use
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul class="space-y-1.5 text-xs">
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span>FFX Int/HD grid - <strong>803 nodes</strong></span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span><strong>Click & drag</strong> to paint spheres</span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span><strong>Drag area</strong> to select multiple nodes</span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span><strong class="text-pink-400">Pink</strong> = abilities (locked)</span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span><strong class="text-zinc-400">Gray</strong> = locks (locked)</span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span><strong>2-finger scroll</strong> pan, <strong>pinch</strong> zoom</span>
        </li>
        <li class="flex gap-2">
          <span class="text-gold font-bold">•</span>
          <span>Auto-saves to local storage</span>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
