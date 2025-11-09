<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Save, RotateCcw, Trash2, MousePointer2, Hand } from "lucide-vue-next"

const selectionMode = defineModel<boolean>("selectionMode", { default: false })

defineEmits<{
  reset: []
  clear: []
}>()
</script>

<template>
  <div class="space-y-2.5">
    <Button
      :variant="selectionMode ? 'default' : 'outline'"
      class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm"
      @click="selectionMode = !selectionMode"
    >
      <component :is="selectionMode ? Hand : MousePointer2" class="h-3.5 w-3.5 mr-2" />
      {{ selectionMode ? "Paint Mode" : "Selection Mode" }}
    </Button>

    <Button
      variant="destructive"
      class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm"
      @click="$emit('clear')"
    >
      <Trash2 class="h-3.5 w-3.5 mr-2" />
      Clear Grid
    </Button>

    <Button
      variant="outline"
      class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm"
      @click="$emit('reset')"
    >
      <RotateCcw class="h-3.5 w-3.5 mr-2" />
      Reset to Defaults
    </Button>

    <div class="flex items-center justify-center gap-2 p-2 bg-zinc-900/50 rounded-md border border-zinc-700">
      <Save class="h-3.5 w-3.5 text-green-400" />
      <span class="text-xs text-green-400 font-medium">Changes auto-saved</span>
    </div>
  </div>
</template>
