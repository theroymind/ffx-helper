<script setup lang="ts">
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo } from '@/constants/sphere'
import { StatButton } from '.'

const modelValue = defineModel<SphereType>({ required: true })

// Filter out locked type, put empty at the end
const selectableTypes = [
  ...Object.keys(sphereTypeInfo).filter((type) => type !== 'locked' && type !== 'empty'),
  'empty',
] as SphereType[]
</script>

<template>
  <div class="rounded-2xl border p-4 shadow-2xl gap-2">
    <div class="space-y-2 pb-4">
      <p class="font-semibold uppercase text-amber-300/80">Sphere focus</p>
      <div>
        <p class="text-sm font-semibold text-white">Select sphere type</p>
        <p class="text-xs text-zinc-400">Pick the stat you want to paint on the grid.</p>
      </div>
    </div>

    <div class="grid gap-2 grid-cols-1 xl:grid-cols-2 p-2">
      <StatButton
        v-for="type in selectableTypes"
        :key="type"
        :stat-type="type"
        :active="modelValue === type"
        @click="modelValue = type"
      />
    </div>
  </div>
</template>
