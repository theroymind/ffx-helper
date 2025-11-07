<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo, sphereIcons } from '@/constants/sphere'

const modelValue = defineModel<SphereType>({ required: true })

// Filter out empty and locked types
const selectableTypes = Object.entries(sphereTypeInfo).filter(
  ([type]) => type !== 'empty' && type !== 'locked',
)

// Get icon for sphere type - either from icons or use letter for HP/MP
const getSphereIcon = (type: string): { type: 'image' | 'text'; value: string } | null => {
  if (type === 'hp') return { type: 'text', value: 'H' }
  if (type === 'mp') return { type: 'text', value: 'M' }

  const iconUrl = sphereIcons[type as SphereType]
  if (iconUrl) return { type: 'image', value: iconUrl }

  return null
}
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
      <Button
        v-for="[type, info] in selectableTypes"
        :key="type"
        type="button"
        :variant="type as any"
        class="justify-start"
        :data-active="modelValue === type"
        @click="modelValue = type as SphereType"
      >
        <div
          class="flex h-6 w-6 items-center justify-center rounded-full border-2"
          :class="['luck', 'accuracy', 'agility'].includes(type) ? 'border-black' : 'border-white'"
        >
          <img
            v-if="getSphereIcon(type)?.type === 'image'"
            :src="getSphereIcon(type)?.value"
            :alt="info.label"
            class="h-4 w-4"
          />
          <span v-else-if="getSphereIcon(type)?.type === 'text'" class="font-bold">
            {{ getSphereIcon(type)?.value }}
          </span>
        </div>
        {{ info.label }} +{{ info.statValue }}
      </Button>
    </div>
  </div>
</template>
