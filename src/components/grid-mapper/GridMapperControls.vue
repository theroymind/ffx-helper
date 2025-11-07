<template>
  <div class="flex flex-col gap-4">
    <div class="flex gap-2 flex-wrap">
      <Button
        @click="ctx.toggleLinkMode()"
        :variant="ctx.isLinkMode.value ? 'default' : 'outline'"
        :class="ctx.isLinkMode.value && 'border-2 border-amber-400'"
      >
        {{ ctx.isLinkMode.value ? "Link Mode (Toggle connections)" : "Place Mode (Click to add nodes)" }}
      </Button>
      <Button v-if="ctx.isLinkMode.value && ctx.selectedNodeForLink.value" @click="ctx.cancelLinkSelection()" variant="outline">
        Cancel Selection
      </Button>
    </div>

    <div class="flex gap-2 flex-wrap">
      <Button @click="ctx.toggleGrid()" variant="outline">{{ ctx.showGrid.value ? "Hide Grid" : "Show Grid" }}</Button>
      <Button @click="ctx.resetView()" variant="outline">Reset View</Button>
      <Button @click="ctx.clearNodes()" variant="outline">Clear All Nodes</Button>
      <Button @click="handleExport" variant="outline">Export JSON</Button>
      <Button @click="handleImportExpertGrid" variant="outline">Load Expert Grid (Reference)</Button>
    </div>

    <div class="flex gap-2 flex-wrap items-center">
      <label for="image-upload" class="inline-block">
        <input id="image-upload" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
        <Button type="button" @click="triggerImageUpload" variant="outline" as="div"> Load Sphere Grid Image </Button>
      </label>
      <Button v-if="ctx.backgroundImage.value" @click="ctx.clearImage()" variant="outline">Clear Image</Button>
      <div v-if="ctx.backgroundImage.value" class="flex items-center gap-2 px-4 py-2 bg-background rounded-md">
        <label class="flex items-center gap-2 text-muted-foreground text-sm">
          Opacity: {{ ctx.imageOpacity.value.toFixed(2) }}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            v-model.number="ctx.imageOpacity.value"
            class="w-30"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SphereType } from "@/types/sphere"
import Button from "@/components/ui/button/Button.vue"
import { useGridMapperContext } from "@/composables/useGridMapperContext"

const ctx = useGridMapperContext()

function triggerImageUpload() {
  const input = document.getElementById("image-upload") as HTMLInputElement
  if (input) input.click()
}

async function handleImageUpload(event: Event) {
  try {
    await ctx.handleImageUpload(event)
    alert("Image loaded! Adjust opacity with the slider if needed.")
  } catch (error) {
    console.error("Failed to load image:", error)
  }
}

function handleExport() {
  const jsonData = JSON.stringify(ctx.nodes.value, null, 2)
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "standard_grid_nodes.json"
  a.click()
  URL.revokeObjectURL(url)
  console.log("Exported nodes:", ctx.nodes.value.length)
}

async function handleImportExpertGrid() {
  try {
    const response = await fetch("/src/nodes.json")
    const expertNodes = (await response.json()) as Array<{
      x: number
      y: number
      connections: [number, number][]
      attribute_name?: string | null
      ability_id?: number | null
      lock_level?: number | null
      value?: number
    }>

    const refNodes = expertNodes.map((node, index) => ({
      id: -index - 1,
      x: node.x * 3,
      y: node.y * 3,
      connections: [],
      type: "empty" as SphereType,
    }))

    ctx.setReferenceNodes(refNodes)
    alert(`Loaded ${ctx.referenceNodes.value.length} expert grid nodes as reference (gray dots)`)
  } catch (error) {
    console.error("Failed to load expert grid:", error)
    alert("Failed to load expert grid")
  }
}
</script>
