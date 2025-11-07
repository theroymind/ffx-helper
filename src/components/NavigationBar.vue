<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const isActive = (path: string) => {
  return computed(() => route.path === path)
}
</script>

<template>
  <nav class="w-full border-b px-6 py-4">
    <div class="flex items-center gap-8">
      <h1 class="text-xl font-bold text-zinc-100">FFX Planner</h1>
      <div class="flex gap-4">
        <RouterLink
          to="/"
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            isActive('/').value
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          "
        >
          Sphere Grid
        </RouterLink>
        <RouterLink
          to="/monster-arena"
          class="px-4 py-2 rounded-md transition-colors"
          :class="
            isActive('/monster-arena').value
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
          "
        >
          Monster Arena
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
