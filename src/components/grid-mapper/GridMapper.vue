<template>
  <div class="flex flex-col gap-4 p-4 bg-background min-h-screen">
    <div class="flex flex-col gap-4 p-4 bg-muted rounded-lg">
      <h2 class="m-0 text-foreground font-semibold text-xl">Standard Grid Mapper Tool</h2>
      <p v-if="!isLinkMode" class="m-0 text-muted-foreground">
        Click to place nodes. Select type in dialog. Shift+drag or middle-click to pan. Scroll to zoom.
      </p>
      <p v-else-if="!selectedNodeForLink" class="m-0 text-muted-foreground">
        Click a node to start connecting. Shift+drag to pan.
      </p>
      <p v-else class="m-0 text-muted-foreground">Click another node to connect/disconnect. Red = will disconnect.</p>

      <GridMapperControls />
      <GridMapperStats />
    </div>

    <div class="overflow-auto border-2 border-border rounded-lg bg-zinc-950 touch-none">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="handleClick"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mousemove="handleMouseMove"
        @wheel="handleWheel"
        class="block cursor-crosshair select-none active:cursor-grabbing"
      ></canvas>
    </div>

    <!-- Node Type Selection Dialog -->
    <Dialog :open="showNodeTypeDialog" @update:open="showNodeTypeDialog = $event">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
          <DialogDescription>
            <template v-if="dialogDescription === 'default'">
              Choose the type of sphere node to place at position ({{ pendingNodePosition.x }},
              {{ pendingNodePosition.y }})
            </template>
            <template v-else-if="dialogDescription === 'back'">
              <Button variant="ghost" @click="resetDialog" class="gap-1 px-2 -ml-2"> ← Back to type selection </Button>
            </template>
          </DialogDescription>
        </DialogHeader>

        <NodeTypeDialogContent
          v-if="showNodeTypeDialog"
          :key="dialogKey"
          :pending-node-position="pendingNodePosition"
          @confirm="handleNodeConfirm"
          @cancel="cancelNodePlacement"
          @update-title="dialogTitle = $event"
          @update-description="dialogDescription = $event"
        />

        <DialogFooter>
          <Button variant="outline" @click="cancelNodePlacement">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Button from "@/components/ui/button/Button.vue"
import NodeTypeDialogContent from "@/components/grid-mapper/NodeTypeDialogContent.vue"
import GridMapperControls from "@/components/grid-mapper/GridMapperControls.vue"
import GridMapperStats from "@/components/grid-mapper/GridMapperStats.vue"
import { useImageCache } from "@/composables/useImageCache"
import { createGridMapperContext, type NodeData } from "@/composables/useGridMapperContext"
import { useGridMapperDrawing } from "@/composables/useGridMapperDrawing"
import { useGridMapperEvents } from "@/composables/useGridMapperEvents"

// Create context (provides to child components and composables)
const context = createGridMapperContext()
const { isLinkMode, selectedNodeForLink, canvasWidth, canvasHeight, canvasRef, backgroundImage, imageScale, addNode } =
  context

// Canvas drawing (pass context since we're in the provider component)
const { draw } = useGridMapperDrawing(context)

// Canvas events (pass context since we're in the provider component)
const { handleCanvasClick, handleMouseDown, handleMouseUp, handleMouseMove, handleWheel } = useGridMapperEvents(context)

// Image caching
const { loadImage } = useImageCache()

// Dialog state (UI-specific, stays in component)
const showNodeTypeDialog = ref(false)
const pendingNodePosition = ref({ x: 0, y: 0 })
const dialogTitle = ref("Select Node Type")
const dialogDescription = ref("default")
const dialogKey = ref(0)

// Dialog handlers
function handleNodeConfirm(nodeData: NodeData) {
  addNode(pendingNodePosition.value.x, pendingNodePosition.value.y, nodeData)
  showNodeTypeDialog.value = false
  dialogKey.value++
}

function cancelNodePlacement() {
  showNodeTypeDialog.value = false
  dialogKey.value++
}

function resetDialog() {
  dialogKey.value++
}

// Canvas click handler (delegates to events, handles place mode)
function handleClick(event: MouseEvent) {
  const result = handleCanvasClick(event)
  if (result && !isLinkMode.value) {
    pendingNodePosition.value = { x: result.worldX, y: result.worldY }
    showNodeTypeDialog.value = true
  }
}

// Initialization
onMounted(async () => {
  await nextTick()

  // Automatically load the standard sphere grid image
  const img = await loadImage("/src/assets/standard_sphere_grid.jpeg")
  if (img) {
    const maxDimension = Math.max(img.width, img.height)
    const scale = 3000 / maxDimension

    canvasWidth.value = Math.round(img.width * scale)
    canvasHeight.value = Math.round(img.height * scale)
    imageScale.value = scale
    backgroundImage.value = img

    await nextTick()
    draw()
  }
})
</script>
