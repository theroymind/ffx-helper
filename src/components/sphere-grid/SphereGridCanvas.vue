<script setup lang="ts">
import { ref } from 'vue'

const container = ref<HTMLElement | null>(null)

defineExpose({
  container,
})
</script>

<template>
  <div ref="container" class="flex-1 bg-black rounded-xl overflow-hidden border-2 border-zinc-700 shadow-2xl w-full h-full"></div>
</template>
