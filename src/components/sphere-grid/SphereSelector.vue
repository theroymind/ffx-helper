<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { SphereType } from '@/types/sphere'
import { sphereTypeInfo, sphereButtonClasses, sphereColors } from '@/constants/sphere'

const modelValue = defineModel<SphereType>({ required: true })

// Filter out empty and locked types
const selectableTypes = Object.entries(sphereTypeInfo).filter(
  ([type]) => type !== 'empty' && type !== 'locked',
)

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

const mixColor = (hex: string, amount: number, target: string) => {
  const { r, g, b } = hexToRgb(hex)
  const { r: tr, g: tg, b: tb } = hexToRgb(target)
  const mix = (channel: number, targetChannel: number) =>
    Math.round(channel + (targetChannel - channel) * amount)
  const nr = mix(r, tr)
  const ng = mix(g, tg)
  const nb = mix(b, tb)
  return `rgb(${nr}, ${ng}, ${nb})`
}

const buttonStyle = (type: SphereType, active: boolean) => {
  const color = sphereColors[type]
  const background = active ? color : mixColor(color, 0.3, '#000000')
  const border = active ? mixColor(color, 0.2, '#ffffff') : mixColor(color, 0.4, '#000000')
  const text = '#ffffff'
  return {
    backgroundColor: background,
    borderColor: border,
    borderWidth: active ? '2px' : '1px',
    color: text,
    boxShadow: active ? `0 0 0 3px ${mixColor(color, 0.3, '#000000')}` : 'none',
    transform: active ? 'scale(1.02)' : 'scale(1)',
  }
}
</script>

<template>
  <div class="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl shadow-black/40">
    <div class="space-y-2 pb-4">
      <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/80">
        Sphere focus
      </p>
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
        variant="ghost"
        :data-active="modelValue === type"
        :class="[sphereButtonClasses[type as SphereType]]"
        :style="buttonStyle(type as SphereType, modelValue === type)"
        @click="modelValue = type as SphereType"
      >
        {{ info.label }} +{{ info.statValue }}
      </Button>
    </div>
  </div>
</template>
