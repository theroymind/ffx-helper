<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo } from '@/constants/sphere'

const modelValue = defineModel<SphereType>({ required: true })

// Filter out empty and locked types
const selectableTypes = Object.entries(sphereTypeInfo).filter(
  ([type]) => type !== 'empty' && type !== 'locked',
)
</script>

<template>
  <div class="rounded-2xl border p-4 shadow-2xl gap-2">
    <div class="space-y-2 pb-4">
      <p class="font-semibold uppercase tracking-[0.3em] text-amber-300/80">Sphere focus</p>
      <div>
        <p class="text-sm font-semibold text-white">Select sphere type</p>
        <p class="text-xs text-zinc-400">Pick the stat you want to paint on the grid.</p>
      </div>
    </div>

    <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      <Button
        v-for="[type, info] in selectableTypes"
        :key="type"
        type="button"
        :variant="type as any"
        :data-active="modelValue === type"
        @click="modelValue = type as SphereType"
      >
        {{ info.label }} +{{ info.statValue }}
      </Button>
    </div>
  </div>
</template>
