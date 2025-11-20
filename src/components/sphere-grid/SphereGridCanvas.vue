<template>
  <div ref="container" class="flex-1 overflow-hidden w-full h-full touch-none [&_canvas]:cursor-crosshair"></div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const container = ref<HTMLElement | null>(null);

defineExpose({
  container,
});
</script>
