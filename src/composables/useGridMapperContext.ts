import { ref, computed, provide, inject, watch, type Ref, type InjectionKey } from "vue"
import { useLocalStorage } from "@vueuse/core"
import type { SphereType } from "@/types/sphere"

export interface GridNode {
  id: number
  x: number
  y: number
  connections: number[]
  type: SphereType
  value?: number
  lockLevel?: number | null
  abilityId?: number | null
  abilityName?: string | null
}

export interface NodeData {
  type: SphereType
  value?: number
  lockLevel?: number | null
  abilityName?: string | null
}

export interface GridMapperContext {
  // Node state
  nodes: Ref<GridNode[]>
  referenceNodes: Ref<GridNode[]>

  // Canvas transform state
  viewScale: Ref<number>
  viewOffsetX: Ref<number>
  viewOffsetY: Ref<number>

  // Background image state
  backgroundImage: Ref<HTMLImageElement | null>
  imageOpacity: Ref<number>
  imageScale: Ref<number>
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>

  // Interaction state
  isLinkMode: Ref<boolean>
  selectedNodeForLink: Ref<GridNode | null>
  mousePos: Ref<{ x: number; y: number }>
  showGrid: Ref<boolean>
  isPanning: Ref<boolean>

  // Drag-to-create state
  isDraggingToCreate: Ref<boolean>
  dragStartNode: Ref<GridNode | null>
  dragEndPos: Ref<{ x: number; y: number } | null>

  // Canvas ref
  canvasRef: Ref<HTMLCanvasElement | null>

  // Methods (used by composables and components)
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number }
  findNodeAtPosition: (x: number, y: number, threshold?: number) => GridNode | null
  toggleConnection: (node1: GridNode, node2: GridNode) => boolean
  updateMousePosition: (x: number, y: number) => void
  addNode: (x: number, y: number, nodeData: NodeData) => GridNode
  updateNode: (nodeId: number, nodeData: NodeData) => void
  deleteNode: (nodeId: number) => void
  setReferenceNodes: (refNodes: GridNode[]) => void
  handleImageUpload: (event: Event) => Promise<void>
  clearImage: () => void
  toggleLinkMode: () => void
  cancelLinkSelection: () => void
  toggleGrid: () => void
  resetView: () => void
  clearNodes: () => boolean
  loadNodes: (loadedNodes: GridNode[]) => void
  getCurrentNodes: () => GridNode[]
}

const GridMapperContextKey: InjectionKey<GridMapperContext> = Symbol("GridMapperContext")

export function createGridMapperContext() {
  // Node state (auto-saved to localStorage)
  const nodes = useLocalStorage<GridNode[]>('ffx-grid-mapper-nodes', [])
  const referenceNodes = ref<GridNode[]>([])

  let nextNodeId = 1
  if (nodes.value.length > 0) {
    nextNodeId = Math.max(...nodes.value.map((n) => n.id)) + 1
  }

  // Canvas transform state
  const viewScale = ref(1.0)
  const viewOffsetX = ref(0)
  const viewOffsetY = ref(0)
  const isPanning = ref(false)

  // Background image state
  const backgroundImage = ref<HTMLImageElement | null>(null)
  const imageOpacity = ref(0.7)
  const imageScale = ref(1.0)
  const canvasWidth = ref(3000)
  const canvasHeight = ref(3000)

  // Interaction state
  const isLinkMode = ref(false)
  const selectedNodeForLink = ref<GridNode | null>(null)
  const mousePos = ref({ x: 0, y: 0 })
  const showGrid = ref(true)

  // Drag-to-create state
  const isDraggingToCreate = ref(false)
  const dragStartNode = ref<GridNode | null>(null)
  const dragEndPos = ref<{ x: number; y: number } | null>(null)

  // Canvas ref
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  // Computed
  const totalConnections = computed(() => {
    return nodes.value.reduce((sum, node) => sum + node.connections.length, 0) / 2
  })

  // Node operations
  function addNode(x: number, y: number, nodeData: NodeData): GridNode {
    const newNode: GridNode = {
      id: nextNodeId++,
      x,
      y,
      connections: [],
      type: nodeData.type,
      value: nodeData.value || 0,
      lockLevel: nodeData.lockLevel,
      abilityName: nodeData.abilityName,
    }
    nodes.value.push(newNode)
    return newNode
  }

  function updateNode(nodeId: number, nodeData: NodeData) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.type = nodeData.type
      node.value = nodeData.value || 0
      node.lockLevel = nodeData.lockLevel
      node.abilityName = nodeData.abilityName
    }
  }

  function deleteNode(nodeId: number) {
    const nodeIndex = nodes.value.findIndex((n) => n.id === nodeId)
    if (nodeIndex === -1) return

    nodes.value.forEach((node) => {
      node.connections = node.connections.filter((id) => id !== nodeId)
    })

    nodes.value.splice(nodeIndex, 1)

    if (selectedNodeForLink.value?.id === nodeId) {
      selectedNodeForLink.value = null
    }
  }

  function clearNodes(): boolean {
    if (confirm("Clear all nodes?")) {
      nodes.value = []
      nextNodeId = 1
      selectedNodeForLink.value = null
      return true
    }
    return false
  }

  function loadNodes(loadedNodes: GridNode[]) {
    nodes.value = JSON.parse(JSON.stringify(loadedNodes))
    selectedNodeForLink.value = null
    if (loadedNodes.length > 0) {
      nextNodeId = Math.max(...loadedNodes.map((n) => n.id)) + 1
    } else {
      nextNodeId = 1
    }
  }

  function getCurrentNodes(): GridNode[] {
    return JSON.parse(JSON.stringify(nodes.value))
  }

  function findNodeAtPosition(x: number, y: number, threshold = 15): GridNode | null {
    return (
      nodes.value.find((node) => {
        const distance = Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2))
        return distance <= threshold
      }) || null
    )
  }

  function toggleConnection(node1: GridNode, node2: GridNode): boolean {
    if (node1.id === node2.id) return false

    const alreadyConnected = node1.connections.includes(node2.id)

    if (alreadyConnected) {
      node1.connections = node1.connections.filter((id) => id !== node2.id)
      node2.connections = node2.connections.filter((id) => id !== node1.id)
      return false
    } else {
      node1.connections.push(node2.id)
      node2.connections.push(node1.id)
      return true
    }
  }

  function setReferenceNodes(refNodes: GridNode[]) {
    referenceNodes.value = refNodes
  }

  // Transform operations
  function screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - viewOffsetX.value) / viewScale.value,
      y: (screenY - viewOffsetY.value) / viewScale.value,
    }
  }

  function resetView() {
    viewScale.value = 1.0
    viewOffsetX.value = 0
    viewOffsetY.value = 0
  }

  // Interaction operations
  function toggleLinkMode() {
    isLinkMode.value = !isLinkMode.value
    selectedNodeForLink.value = null
  }

  function cancelLinkSelection() {
    selectedNodeForLink.value = null
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  function updateMousePosition(x: number, y: number) {
    mousePos.value = { x: Math.round(x), y: Math.round(y) }
  }

  // Background image operations
  function scaleImageToCanvas(img: HTMLImageElement) {
    const TARGET_MAX_DIMENSION = 3000
    const maxDimension = Math.max(img.width, img.height)
    const scale = TARGET_MAX_DIMENSION / maxDimension

    canvasWidth.value = Math.round(img.width * scale)
    canvasHeight.value = Math.round(img.height * scale)
    imageScale.value = scale
  }

  function handleImageUpload(event: Event): Promise<void> {
    return new Promise((resolve, reject) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) {
        reject(new Error("No file selected"))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          scaleImageToCanvas(img)
          backgroundImage.value = img
          resolve()
        }
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        scaleImageToCanvas(img)
        backgroundImage.value = img
        resolve(img)
      }
      img.onerror = () => reject(new Error(`Failed to load image from ${url}`))
      img.src = url
    })
  }

  function clearImage() {
    backgroundImage.value = null
  }

  // Create and provide context
  const context: GridMapperContext = {
    nodes,
    referenceNodes,
    viewScale,
    viewOffsetX,
    viewOffsetY,
    backgroundImage,
    imageOpacity,
    imageScale,
    canvasWidth,
    canvasHeight,
    isLinkMode,
    selectedNodeForLink,
    mousePos,
    showGrid,
    isPanning,
    isDraggingToCreate,
    dragStartNode,
    dragEndPos,
    canvasRef,
    screenToWorld,
    findNodeAtPosition,
    toggleConnection,
    updateMousePosition,
    addNode,
    updateNode,
    deleteNode,
    setReferenceNodes,
    handleImageUpload,
    clearImage,
    toggleLinkMode,
    cancelLinkSelection,
    toggleGrid,
    resetView,
    clearNodes,
    loadNodes,
    getCurrentNodes,
  }

  provide(GridMapperContextKey, context)

  return {
    // Return context for passing to composables in provider component
    ...context,

    // Additional computed values not in context
    totalConnections,
  }
}

export function useGridMapperContext() {
  const context = inject(GridMapperContextKey)
  if (!context) {
    throw new Error("useGridMapperContext must be used within a component that called createGridMapperContext")
  }
  return context
}
