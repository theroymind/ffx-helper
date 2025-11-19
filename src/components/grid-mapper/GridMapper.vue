<template>
  <div class="flex flex-col gap-4 p-4 bg-background min-h-screen">
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="text-xl">Grid Mapper</CardTitle>
            <CardDescription class="text-xs mt-1">
              <template v-if="!isLinkMode">
                Click to place • Drag from node to create & link • Shift+drag to pan • Scroll to zoom
              </template>
              <template v-else-if="!selectedNodeForLink"> Click node to start connecting </template>
              <template v-else> Click another node to toggle connection </template>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4 pb-4">
        <GridMapperStats />
      </CardContent>
    </Card>

    <div class="relative overflow-auto border-2 border-border rounded-lg bg-card shadow-lg touch-none">
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

      <GridMapperToolbar />
    </div>

    <!-- Node Type Selection Dialog -->
    <Dialog :open="showNodeTypeDialog" @update:open="showNodeTypeDialog = $event" :modal="false">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ editingNode ? "Edit Node" : dialogTitle }}</DialogTitle>
          <DialogDescription>
            <template v-if="editingNode && dialogDescription === 'default'">
              Modify or delete the node at position ({{ editingNode.x }}, {{ editingNode.y }})
            </template>
            <template v-else-if="dialogDescription === 'default'">
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
          :existing-node="editingNode"
          @confirm="handleNodeConfirm"
          @cancel="cancelNodePlacement"
          @update-title="dialogTitle = $event"
          @update-description="dialogDescription = $event"
        />

        <DialogFooter>
          <Button v-if="editingNode" variant="destructive" @click="handleNodeDelete">Delete Node</Button>
          <Button variant="outline" @click="cancelNodePlacement">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/button/Button.vue";
import NodeTypeDialogContent from "@/components/grid-mapper/NodeTypeDialogContent.vue";
import GridMapperToolbar from "@/components/grid-mapper/GridMapperToolbar.vue";
import GridMapperStats from "@/components/grid-mapper/GridMapperStats.vue";
import { useImageCache } from "@/composables/useImageCache";
import { createGridMapperContext, type NodeData, type GridNode } from "@/composables/useGridMapperContext";
import { useGridMapperDrawing } from "@/composables/useGridMapperDrawing";
import { useGridMapperEvents } from "@/composables/useGridMapperEvents";

// Create context (provides to child components and composables)
const context = createGridMapperContext();
const {
  isLinkMode,
  selectedNodeForLink,
  canvasWidth,
  canvasHeight,
  canvasRef,
  backgroundImage,
  imageScale,
  addNode,
  updateNode,
  deleteNode,
  toggleConnection,
} = context;

// Canvas drawing (pass context since we're in the provider component)
const { draw } = useGridMapperDrawing(context);

// Canvas events (pass context since we're in the provider component)
const {
  handleCanvasClick,
  handleMouseDown,
  handleMouseUp: handleMouseUpEvent,
  handleMouseMove,
  handleWheel,
} = useGridMapperEvents(context);

// Image caching
const { loadImage } = useImageCache();

// Dialog state (UI-specific, stays in component)
const showNodeTypeDialog = ref(false);
const pendingNodePosition = ref({ x: 0, y: 0 });
const editingNode = ref<GridNode | null>(null);
const pendingLinkSourceNode = ref<GridNode | null>(null);
const dialogTitle = ref("Select Node Type");
const dialogDescription = ref("default");
const dialogKey = ref(0);

// Dialog handlers
function handleNodeConfirm(nodeData: NodeData) {
  if (editingNode.value) {
    updateNode(editingNode.value.id, nodeData);
  } else {
    const newNode = addNode(pendingNodePosition.value.x, pendingNodePosition.value.y, nodeData);

    if (pendingLinkSourceNode.value) {
      toggleConnection(pendingLinkSourceNode.value, newNode);
      pendingLinkSourceNode.value = null;
    }
  }
  showNodeTypeDialog.value = false;
  editingNode.value = null;
  dialogKey.value++;
  draw();
}

function handleNodeDelete() {
  if (editingNode.value) {
    deleteNode(editingNode.value.id);
    showNodeTypeDialog.value = false;
    editingNode.value = null;
    dialogKey.value++;
    draw();
  }
}

function cancelNodePlacement() {
  showNodeTypeDialog.value = false;
  editingNode.value = null;
  dialogKey.value++;
}

function resetDialog() {
  dialogKey.value++;
}

// Canvas click handler (delegates to events, handles place mode)
function handleClick(event: MouseEvent) {
  const result = handleCanvasClick(event);
  if (result && !isLinkMode.value) {
    pendingNodePosition.value = { x: result.worldX, y: result.worldY };
    if ("existingNode" in result && result.existingNode) {
      editingNode.value = result.existingNode;
    } else {
      editingNode.value = null;
    }
    showNodeTypeDialog.value = true;
  }
}

function handleMouseUp(event: MouseEvent) {
  const result = handleMouseUpEvent(event);

  if (result && result.type === "drag-to-create") {
    pendingNodePosition.value = { x: result.worldX, y: result.worldY };
    pendingLinkSourceNode.value = result.sourceNode;
    editingNode.value = null;
    showNodeTypeDialog.value = true;
  }
}

// Initialization
onMounted(async () => {
  await nextTick();

  // Automatically load the standard sphere grid image
  const img = await loadImage("/src/assets/standard_sphere_grid.jpeg");
  if (img) {
    const maxDimension = Math.max(img.width, img.height);
    const scale = 3000 / maxDimension;

    canvasWidth.value = Math.round(img.width * scale);
    canvasHeight.value = Math.round(img.height * scale);
    imageScale.value = scale;
    backgroundImage.value = img;

    await nextTick();
    draw();
  }
});
</script>
