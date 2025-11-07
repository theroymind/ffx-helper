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

      <div class="flex gap-2 flex-wrap">
        <Button
          @click="toggleLinkMode"
          :variant="isLinkMode ? 'default' : 'outline'"
          :class="isLinkMode && 'border-2 border-amber-400'"
        >
          {{ isLinkMode ? "Link Mode (Toggle connections)" : "Place Mode (Click to add nodes)" }}
        </Button>
        <Button v-if="isLinkMode && selectedNodeForLink" @click="cancelLinkSelection" variant="outline">
          Cancel Selection
        </Button>
      </div>

      <div class="flex gap-2 flex-wrap">
        <Button @click="toggleGrid" variant="outline">{{ showGrid ? "Hide Grid" : "Show Grid" }}</Button>
        <Button @click="resetView" variant="outline">Reset View</Button>
        <Button @click="clearNodes" variant="outline">Clear All Nodes</Button>
        <Button @click="exportNodes" variant="outline">Export JSON</Button>
        <Button @click="importExpertGrid" variant="outline">Load Expert Grid (Reference)</Button>
      </div>

      <div class="flex gap-2 flex-wrap items-center">
        <label for="image-upload" class="inline-block">
          <input id="image-upload" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
          <Button type="button" @click="triggerImageUpload" variant="outline" as="div"> Load Sphere Grid Image </Button>
        </label>
        <Button v-if="backgroundImage" @click="clearImage" variant="outline">Clear Image</Button>
        <div v-if="backgroundImage" class="flex items-center gap-2 px-4 py-2 bg-background rounded-md">
          <label class="flex items-center gap-2 text-muted-foreground text-sm">
            Opacity: {{ imageOpacity.toFixed(2) }}
            <input type="range" min="0" max="1" step="0.1" v-model.number="imageOpacity" @input="draw" class="w-30" />
          </label>
        </div>
      </div>

      <div class="flex gap-8">
        <p class="font-semibold">Nodes placed: {{ nodes.length }}</p>
        <p class="font-semibold">
          Connections:
          {{ nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2 }}
        </p>
        <p class="font-semibold">Target: ~860 nodes</p>
        <p v-if="referenceNodes.length > 0" class="font-semibold">Reference nodes: {{ referenceNodes.length }}</p>
        <p class="font-semibold">Canvas: {{ canvasWidth }}x{{ canvasHeight }}</p>
        <p class="font-semibold">Zoom: {{ (viewScale * 100).toFixed(0) }}%</p>
        <p v-if="imageScale !== 1.0" class="font-semibold">Image scale: {{ imageScale.toFixed(3) }}</p>
      </div>
    </div>

    <div class="overflow-auto border-2 border-border rounded-lg bg-zinc-950 touch-none">
      <canvas
        ref="canvasRef"
        :width="canvasWidth"
        :height="canvasHeight"
        @click="handleCanvasClick"
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
import { ref, onMounted, watch, nextTick } from "vue"
import type { SphereType } from "@/types/sphere.ts"
import { sphereTypeInfo, getSphereColors, abilityNodeColor } from "@/constants/sphere.ts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Button from "../ui/button/Button.vue"
import NodeTypeDialogContent from "@/components/grid-mapper/NodeTypeDialogContent.vue"
import { useImageCache } from "@/composables/useImageCache.ts"

interface GridNode {
  id: number
  x: number
  y: number
  connections: number[] // Array of connected node IDs
  type: SphereType
  value?: number
  lockLevel?: number | null
  abilityId?: number | null
  abilityName?: string | null
}

interface ExpertGridNode {
  x: number
  y: number
  connections: [number, number][]
  attribute_name?: string | null
  ability_id?: number | null
  lock_level?: number | null
  value?: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(3000)
const canvasHeight = ref(3000)
const nodes = ref<GridNode[]>([])
const referenceNodes = ref<GridNode[]>([])
const showGrid = ref(true)
const gridSpacing = 50
const nodeRadius = 8
const mousePos = ref({ x: 0, y: 0 })
const backgroundImage = ref<HTMLImageElement | null>(null)
const imageOpacity = ref(0.7)
const imageScale = ref(1.0)
let nextNodeId = 1

// Image caching
const { loadImage } = useImageCache()

// Link mode state
const isLinkMode = ref(false)
const selectedNodeForLink = ref<GridNode | null>(null)

// Canvas view state (zoom and pan)
const viewScale = ref(1.0)
const viewOffsetX = ref(0)
const viewOffsetY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)

// Scale factor to match expert grid coordinate system
const TARGET_MAX_DIMENSION = 3000

// Node type selection dialog state
const showNodeTypeDialog = ref(false)
const pendingNodePosition = ref({ x: 0, y: 0 })
const dialogTitle = ref("Select Node Type")
const dialogDescription = ref("default")
const dialogKey = ref(0) // Used to force remount of dialog content

// Get sphere colors
const sphereColors = getSphereColors()
const getSphereColor = (type: SphereType): string => {
  if (type === "empty") return "#333333"
  if (type === "locked") return "#71717a"
  return sphereColors[type] || "#10b981"
}

// Node type selection handlers
interface NodeData {
  type: SphereType
  value?: number
  lockLevel?: number | null
  abilityName?: string | null
}

function handleNodeConfirm(nodeData: NodeData) {
  nodes.value.push({
    id: nextNodeId++,
    x: pendingNodePosition.value.x,
    y: pendingNodePosition.value.y,
    connections: [],
    type: nodeData.type,
    value: nodeData.value || 0,
    lockLevel: nodeData.lockLevel,
    abilityName: nodeData.abilityName,
  })
  showNodeTypeDialog.value = false
  dialogKey.value++ // Force remount on next open
  draw()
}

function cancelNodePlacement() {
  showNodeTypeDialog.value = false
  dialogKey.value++ // Force remount on next open
}

function resetDialog() {
  dialogKey.value++ // Force remount to reset state
}

// Draw the grid and nodes
const draw = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Save context state
  ctx.save()

  // Clear canvas (before transformations)
  ctx.fillStyle = "#18181b" // zinc-950
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Apply zoom and pan transformations
  ctx.translate(viewOffsetX.value, viewOffsetY.value)
  ctx.scale(viewScale.value, viewScale.value)

  // Draw background image if loaded
  if (backgroundImage.value) {
    ctx.globalAlpha = imageOpacity.value
    ctx.drawImage(backgroundImage.value, 0, 0, canvasWidth.value, canvasHeight.value)
    ctx.globalAlpha = 1.0
  }

  // Draw grid if enabled
  if (showGrid.value) {
    ctx.strokeStyle = "#3f3f46" // zinc-700
    ctx.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= canvasWidth.value; x += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight.value)
      ctx.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight.value; y += gridSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth.value, y)
      ctx.stroke()
    }

    // Draw coordinates every 100 pixels
    ctx.fillStyle = "#71717a" // zinc-500
    ctx.font = "10px monospace"
    for (let x = 0; x <= canvasWidth.value; x += 100) {
      for (let y = 0; y <= canvasHeight.value; y += 100) {
        if (x === 0 && y === 0) continue
        ctx.fillText(`${x},${y}`, x + 2, y + 10)
      }
    }
  }

  // Draw reference nodes (expert grid)
  referenceNodes.value.forEach((node) => {
    ctx.fillStyle = "#52525b" // zinc-600 (reference color)
    ctx.beginPath()
    ctx.arc(node.x, node.y, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Draw connections between nodes
  ctx.strokeStyle = "#6366f1" // indigo-500
  ctx.lineWidth = 3
  nodes.value.forEach((node) => {
    node.connections.forEach((connectedId) => {
      const connectedNode = nodes.value.find((n) => n.id === connectedId)
      if (connectedNode) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(connectedNode.x, connectedNode.y)
        ctx.stroke()
      }
    })
  })

  // Draw user-placed nodes
  nodes.value.forEach((node) => {
    // Highlight if selected for linking
    const isSelected = selectedNodeForLink.value?.id === node.id

    // Check if this node is connected to the selected node
    const isConnectedToSelected =
      selectedNodeForLink.value && selectedNodeForLink.value.connections.includes(node.id) && !isSelected

    // Determine base color from node type
    let baseColor = getSphereColor(node.type)

    // Special handling for ability nodes
    if (node.abilityName) {
      baseColor = abilityNodeColor
    }

    // Color based on state
    let fillColor = baseColor
    let strokeColor = "#ffffff" // white
    let strokeWidth = 2

    if (isSelected) {
      fillColor = "#f59e0b" // amber-500 (selected)
      strokeColor = "#fbbf24" // amber-400
      strokeWidth = 3
    } else if (isConnectedToSelected) {
      fillColor = "#ef4444" // red-500 (connected - will disconnect)
      strokeColor = "#fca5a5" // red-300
      strokeWidth = 3
    }

    ctx.fillStyle = fillColor
    ctx.beginPath()
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2)
    ctx.fill()

    // Node border
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.stroke()

    // Node ID and type label
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 10px monospace"
    ctx.textAlign = "center"

    // Show node ID
    ctx.fillText(`${node.id}`, node.x, node.y + 20)

    // Show type info
    if (node.abilityName) {
      ctx.font = "8px monospace"
      ctx.fillText(node.abilityName, node.x, node.y - 12)
    } else if (node.lockLevel) {
      ctx.font = "8px monospace"
      ctx.fillText(`L${node.lockLevel}`, node.x, node.y - 12)
    } else {
      const typeInfo = sphereTypeInfo[node.type]
      if (typeInfo && typeInfo.shortLabel !== "---") {
        ctx.font = "8px monospace"
        ctx.fillText(typeInfo.shortLabel, node.x, node.y - 12)
      }
    }
  })

  // Restore context state (undo transformations)
  ctx.restore()

  // Draw mouse cursor position in screen space (after restore)
  if (mousePos.value.x > 0 && mousePos.value.y > 0) {
    // Transform screen coordinates to world coordinates
    const worldX = (mousePos.value.x - viewOffsetX.value) / viewScale.value
    const worldY = (mousePos.value.y - viewOffsetY.value) / viewScale.value

    ctx.fillStyle = "#fbbf24" // amber-400
    ctx.beginPath()
    ctx.arc(mousePos.value.x, mousePos.value.y, 4, 0, Math.PI * 2)
    ctx.fill()

    // Show world coordinates near cursor
    ctx.fillStyle = "#fbbf24"
    ctx.font = "12px monospace"
    ctx.textAlign = "left"
    ctx.fillText(`${Math.round(worldX)}, ${Math.round(worldY)}`, mousePos.value.x + 10, mousePos.value.y - 10)
  }
}

// Find node near click position
const findNodeAtPosition = (x: number, y: number, threshold = 15): GridNode | null => {
  return (
    nodes.value.find((node) => {
      const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2))
      return distance <= threshold
    }) || null
  )
}

// Transform screen coordinates to world coordinates
const screenToWorld = (screenX: number, screenY: number) => {
  return {
    x: (screenX - viewOffsetX.value) / viewScale.value,
    y: (screenY - viewOffsetY.value) / viewScale.value,
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  // Don't handle clicks while panning
  if (isPanning.value) return

  const rect = canvas.getBoundingClientRect()
  const screenX = event.clientX - rect.left
  const screenY = event.clientY - rect.top

  // Transform to world coordinates
  const { x, y } = screenToWorld(screenX, screenY)
  const worldX = Math.round(x)
  const worldY = Math.round(y)

  if (isLinkMode.value) {
    // Link mode: select nodes to create/remove connections
    const clickedNode = findNodeAtPosition(worldX, worldY)

    if (clickedNode) {
      if (!selectedNodeForLink.value) {
        // First click: select source node
        selectedNodeForLink.value = clickedNode
      } else {
        // Second click: toggle connection
        if (clickedNode.id !== selectedNodeForLink.value.id) {
          // Check if already connected
          const alreadyConnected = selectedNodeForLink.value.connections.includes(clickedNode.id)

          if (alreadyConnected) {
            // Remove bidirectional connection
            selectedNodeForLink.value.connections = selectedNodeForLink.value.connections.filter(
              (id) => id !== clickedNode.id,
            )
            clickedNode.connections = clickedNode.connections.filter((id) => id !== selectedNodeForLink.value!.id)
          } else {
            // Add bidirectional connection
            selectedNodeForLink.value.connections.push(clickedNode.id)
            clickedNode.connections.push(selectedNodeForLink.value.id)
          }
        }
        // Deselect
        selectedNodeForLink.value = null
      }
    }
  } else {
    // Place mode: show dialog to select node type
    pendingNodePosition.value = { x: worldX, y: worldY }
    showNodeTypeDialog.value = true
  }

  draw()
}

const handleMouseDown = (event: MouseEvent) => {
  // Middle mouse button or space + left click for panning
  if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
    event.preventDefault()
    isPanning.value = true
    lastPanX.value = event.clientX
    lastPanY.value = event.clientY
  }
}

const handleMouseUp = () => {
  isPanning.value = false
}

const handleMouseMove = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  mousePos.value = {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top),
  }

  // Handle panning
  if (isPanning.value) {
    const deltaX = event.clientX - lastPanX.value
    const deltaY = event.clientY - lastPanY.value

    viewOffsetX.value += deltaX
    viewOffsetY.value += deltaY

    lastPanX.value = event.clientX
    lastPanY.value = event.clientY
  }

  draw()
}

const handleWheel = (event: WheelEvent) => {
  event.preventDefault()

  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Get world position before zoom
  const worldPosBefore = screenToWorld(mouseX, mouseY)

  // Adjust zoom
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1
  viewScale.value = Math.max(0.1, Math.min(10, viewScale.value * zoomFactor))

  // Get world position after zoom
  const worldPosAfter = screenToWorld(mouseX, mouseY)

  // Adjust offset to keep mouse position fixed
  viewOffsetX.value += (worldPosAfter.x - worldPosBefore.x) * viewScale.value
  viewOffsetY.value += (worldPosAfter.y - worldPosBefore.y) * viewScale.value

  draw()
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
  draw()
}

const resetView = () => {
  viewScale.value = 1.0
  viewOffsetX.value = 0
  viewOffsetY.value = 0
  draw()
}

const toggleLinkMode = () => {
  isLinkMode.value = !isLinkMode.value
  selectedNodeForLink.value = null
  draw()
}

const cancelLinkSelection = () => {
  selectedNodeForLink.value = null
  draw()
}

const clearNodes = () => {
  if (confirm("Clear all nodes?")) {
    nodes.value = []
    nextNodeId = 1
    selectedNodeForLink.value = null
    draw()
  }
}

const exportNodes = () => {
  const jsonData = JSON.stringify(nodes.value, null, 2)

  // Create download link
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "standard_grid_nodes.json"
  a.click()
  URL.revokeObjectURL(url)

  console.log("Exported nodes:", nodes.value.length)
}

const importExpertGrid = async () => {
  try {
    const response = await fetch("/src/nodes.json")
    const expertNodes = (await response.json()) as ExpertGridNode[]

    // Store expert grid nodes as reference
    referenceNodes.value = expertNodes.map((node, index) => ({
      id: -index - 1, // Negative IDs for reference nodes
      x: node.x * 3, // Apply spacing multiplier
      y: node.y * 3,
      connections: [],
      type: "empty" as SphereType,
    }))

    draw()

    alert(`Loaded ${referenceNodes.value.length} expert grid nodes as reference (gray dots)`)
  } catch (error) {
    console.error("Failed to load expert grid:", error)
    alert("Failed to load expert grid")
  }
}

const triggerImageUpload = () => {
  const input = document.getElementById("image-upload") as HTMLInputElement
  if (input) input.click()
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      // Scale image to match expert grid coordinate system
      const maxDimension = Math.max(img.width, img.height)
      const scale = TARGET_MAX_DIMENSION / maxDimension

      canvasWidth.value = Math.round(img.width * scale)
      canvasHeight.value = Math.round(img.height * scale)
      imageScale.value = scale
      backgroundImage.value = img
      draw()
      alert("Image loaded! Adjust opacity with the slider if needed.")
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  backgroundImage.value = null
  draw()
}

onMounted(async () => {
  // Automatically load the standard sphere grid image with caching
  const img = await loadImage("/src/assets/standard_sphere_grid.jpeg")
  if (img) {
    // Scale image to match expert grid coordinate system
    const maxDimension = Math.max(img.width, img.height)
    const scale = TARGET_MAX_DIMENSION / maxDimension

    canvasWidth.value = Math.round(img.width * scale)
    canvasHeight.value = Math.round(img.height * scale)
    imageScale.value = scale
    backgroundImage.value = img

    // Wait for Vue to update the canvas dimensions before drawing
    await nextTick()
    draw()
  }
})

watch([nodes, showGrid, referenceNodes, isLinkMode, selectedNodeForLink, viewScale, viewOffsetX, viewOffsetY], () => {
  draw()
})
</script>
