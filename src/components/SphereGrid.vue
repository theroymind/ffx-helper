<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import sphereGridData from '../nodes.json'
import abilitiesData from '../abilities.json'

// Sphere types definition
type SphereType =
  | 'empty'
  | 'hp'
  | 'mp'
  | 'strength'
  | 'defense'
  | 'magic'
  | 'magicDef'
  | 'agility'
  | 'accuracy'
  | 'evasion'
  | 'luck'
  | 'locked'

interface SphereNode {
  id: string
  type: SphereType
  value: number
  locked: boolean
  abilityId?: number | null
  abilityName?: string
}

// Color mapping for sphere types
const sphereColors: Record<SphereType, string> = {
  empty: '#333333',
  hp: '#22c55e', // green
  mp: '#3b82f6', // blue
  strength: '#f97316', // orange
  defense: '#0ea5e9', // cyan
  magic: '#a855f7', // purple
  magicDef: '#ec4899', // pink
  agility: '#06b6d4', // teal
  accuracy: '#eab308', // yellow
  evasion: '#94a3b8', // slate
  luck: '#fbbf24', // amber
  locked: '#71717a', // gray
}

// Bright pink color for ability nodes
const abilityNodeColor = '#ff1ac6'

// Build ability ID to name mapping from abilities.json
const abilityNames: Record<number, string> = {}
abilitiesData.forEach((ability: any) => {
  abilityNames[ability.id] = ability.name
})

// Sphere type labels and values
const sphereTypeInfo: Record<
  SphereType,
  { label: string; statValue: number; statKey: keyof Stats | null }
> = {
  empty: { label: 'Empty', statValue: 0, statKey: null },
  hp: { label: 'HP', statValue: 300, statKey: 'hp' },
  mp: { label: 'MP', statValue: 40, statKey: 'mp' },
  strength: { label: 'Strength', statValue: 4, statKey: 'strength' },
  defense: { label: 'Defense', statValue: 4, statKey: 'defense' },
  magic: { label: 'Magic', statValue: 4, statKey: 'magic' },
  magicDef: { label: 'Magic Def', statValue: 4, statKey: 'magicDef' },
  agility: { label: 'Agility', statValue: 4, statKey: 'agility' },
  accuracy: { label: 'Accuracy', statValue: 4, statKey: 'accuracy' },
  evasion: { label: 'Evasion', statValue: 4, statKey: 'evasion' },
  luck: { label: 'Luck', statValue: 4, statKey: 'luck' },
  locked: { label: 'Locked', statValue: 0, statKey: null },
}

interface Stats {
  hp: number
  mp: number
  strength: number
  defense: number
  magic: number
  magicDef: number
  agility: number
  accuracy: number
  evasion: number
  luck: number
}

// Refs
const cyContainer = ref<HTMLElement | null>(null)
let cy: Core | null = null
const selectedType = ref<SphereType>('hp')
const isDragging = ref(false)

// Map FFX attribute names to our sphere types
const mapAttributeToType = (attributeName: string | null, abilityId: number | null, lockLevel: number | null): SphereType => {
  if (lockLevel !== null) return 'locked'
  if (abilityId !== null) return 'locked'
  if (!attributeName) return 'empty'

  const attributeMap: Record<string, SphereType> = {
    'HP': 'hp',
    'MP': 'mp',
    'Strength': 'strength',
    'Defense': 'defense',
    'Magic': 'magic',
    'Magic Defense': 'magicDef',
    'Agility': 'agility',
    'Accuracy': 'accuracy',
    'Evasion': 'evasion',
    'Luck': 'luck',
  }

  return attributeMap[attributeName] || 'empty'
}

// Load the actual FFX sphere grid structure
const generateSphereGrid = (): {
  nodes: SphereNode[]
  edges: Array<{ source: string; target: string }>
  positions: Record<string, { x: number; y: number }>
} => {
  const nodes: SphereNode[] = []
  const edges: Array<{ source: string; target: string }> = []
  const positions: Record<string, { x: number; y: number }> = {}

  // Create a map of coordinates to node IDs for connection lookup
  const coordToNodeId = new Map<string, string>()

  // Parse the FFX sphere grid data
  sphereGridData.forEach((nodeData: any) => {
    const nodeId = `node-${nodeData.id}`
    const sphereType = mapAttributeToType(nodeData.attribute_name, nodeData.ability_id, nodeData.lock_level)

    // For empty nodes, set value to 0 so no number displays
    const displayValue = sphereType === 'empty' ? 0 : (nodeData.value || 0)

    nodes.push({
      id: nodeId,
      type: sphereType,
      value: displayValue,
      locked: sphereType === 'locked',
      abilityId: nodeData.ability_id,
      abilityName: nodeData.ability_id ? abilityNames[nodeData.ability_id] || `Ability ${nodeData.ability_id}` : undefined,
    })

    // Add spacing multiplier to spread nodes out more
    const spacingMultiplier = 3.0
    positions[nodeId] = {
      x: nodeData.x * spacingMultiplier,
      y: nodeData.y * spacingMultiplier,
    }

    // Map coordinates to node ID for connection lookup
    coordToNodeId.set(`${nodeData.x},${nodeData.y}`, nodeId)
  })

  // Create edges based on connections
  sphereGridData.forEach((nodeData: any) => {
    const sourceId = `node-${nodeData.id}`

    if (nodeData.connections && Array.isArray(nodeData.connections)) {
      nodeData.connections.forEach((conn: [number, number]) => {
        const targetCoord = `${conn[0]},${conn[1]}`
        const targetId = coordToNodeId.get(targetCoord)

        if (targetId && targetId !== sourceId) {
          // Avoid duplicate edges by checking if reverse edge exists
          const edgeExists = edges.some(
            edge => (edge.source === sourceId && edge.target === targetId) ||
                   (edge.source === targetId && edge.target === sourceId)
          )

          if (!edgeExists) {
            edges.push({ source: sourceId, target: targetId })
          }
        }
      })
    }
  })

  return { nodes, edges, positions }
}

// Generate default sphere grid data
const defaultSphereGrid = generateSphereGrid()

// Use local storage to persist node customizations
// Only store the nodes array since edges and positions don't change
const storedNodes = useLocalStorage<SphereNode[]>('ffx-sphere-grid-nodes', defaultSphereGrid.nodes, {
  mergeDefaults: true,
})

// Create the reactive sphere data, using stored nodes if available
const sphereData = ref({
  nodes: storedNodes.value,
  edges: defaultSphereGrid.edges,
  positions: defaultSphereGrid.positions,
})

// Watch for changes to nodes and persist to localStorage
watch(
  () => sphereData.value.nodes,
  (newNodes) => {
    storedNodes.value = newNodes
  },
  { deep: true }
)

// Calculate stats
const stats = computed<Stats>(() => {
  const result: Stats = {
    hp: 333, // base stats from image
    mp: 59,
    strength: 63,
    defense: 63,
    magic: 63,
    magicDef: 63,
    agility: 63,
    accuracy: 8,
    evasion: 8,
    luck: 60,
  }

  sphereData.value.nodes.forEach((node) => {
    const info = sphereTypeInfo[node.type]
    if (info.statKey) {
      result[info.statKey] += info.statValue
    }
  })

  return result
})

// Calculate sphere counts for overridden nodes only
const overriddenSphereCounts = computed(() => {
  const counts: Record<SphereType, number> = {
    empty: 0,
    hp: 0,
    mp: 0,
    strength: 0,
    defense: 0,
    magic: 0,
    magicDef: 0,
    agility: 0,
    accuracy: 0,
    evasion: 0,
    luck: 0,
    locked: 0,
  }

  let totalOverridden = 0

  sphereData.value.nodes.forEach((node, index) => {
    const defaultNode = defaultSphereGrid.nodes[index]

    // Only count if the node has been changed from its default
    // Skip locked and ability nodes as they can't be changed
    if (defaultNode && !node.locked && !node.abilityId) {
      const hasChanged = node.type !== defaultNode.type || node.value !== defaultNode.value

      if (hasChanged) {
        counts[node.type]++
        totalOverridden++
      }
    }
  })

  return {
    counts,
    total: totalOverridden,
  }
})

// Initialize Cytoscape
onMounted(() => {
  if (!cyContainer.value) return

  const gridData = sphereData.value as ReturnType<typeof generateSphereGrid>
  const { nodes, edges, positions } = gridData

  cy = cytoscape({
    container: cyContainer.value,
    elements: [
      ...nodes.map((node) => ({
        data: {
          id: node.id,
          type: node.type,
          locked: node.locked,
          value: node.value,
          abilityId: node.abilityId,
          abilityName: node.abilityName,
        },
        position: positions[node.id],
      })),
      ...edges.map((edge) => ({
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
        },
      })),
    ],
    style: [
      {
        selector: 'node',
        style: {
          width: 45,
          height: 45,
          'background-color': (ele) => {
            // Ability nodes are bright pink
            if (ele.data('abilityId') !== null && ele.data('abilityId') !== undefined) {
              return abilityNodeColor
            }
            return sphereColors[ele.data('type') as SphereType]
          },
          'border-width': 2,
          'border-color': '#ffffff',
          label: (ele) => {
            // Show ability name in center of ability nodes
            if (ele.data('abilityName')) {
              return ele.data('abilityName')
            }
            // Show stat value for stat nodes
            const value = ele.data('value')
            return value && value > 0 ? String(value) : ''
          },
          'text-valign': 'center',
          'text-halign': 'center',
          'text-margin-y': 0,
          'font-size': (ele) => {
            // Font size for ability names and stats
            return ele.data('abilityName') ? '12px' : '26px'
          },
          'font-weight': 'bold',
          // Enable text wrapping for ability names
          'text-wrap': (ele) => {
            return ele.data('abilityName') ? 'wrap' : 'none'
          },
          'text-max-width': (ele) => {
            return ele.data('abilityName') ? '60px' : 'none'
          },
          color: '#ffffff',
          // Text outline for both ability names and stat numbers
          'text-outline-color': '#000000',
          'text-outline-width': 3,
        },
      },
      {
        selector: 'node[abilityId]',
        style: {
          // Make ability nodes larger
          width: 65,
          height: 65,
          'border-width': 3,
        },
      },
      {
        selector: 'node:active',
        style: {
          'border-width': 4,
          'border-color': '#fbbf24',
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#444444',
          'curve-style': 'straight',
        },
      },
    ],
    layout: {
      name: 'preset',
    },
    userZoomingEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
    autoungrabify: true, // Disable node dragging
    autounselectify: false,
  })

  // Handle node interactions
  cy.on('mousedown', 'node', (event) => {
    const node = event.target
    // Don't allow modifying locked nodes or ability nodes
    if (!node.data('locked') && !node.data('abilityId')) {
      isDragging.value = true
      updateNodeType(node)
    }
  })

  cy.on('mouseover', 'node', (event) => {
    if (isDragging.value) {
      const node = event.target
      // Don't allow modifying locked nodes or ability nodes
      if (!node.data('locked') && !node.data('abilityId')) {
        updateNodeType(node)
      }
    }
  })

  cy.on('mouseup', () => {
    isDragging.value = false
  })

  // Global mouseup to catch when released outside canvas
  document.addEventListener('mouseup', handleGlobalMouseUp)
})

const handleGlobalMouseUp = () => {
  isDragging.value = false
}

const updateNodeType = (node: NodeSingular) => {
  const newType = selectedType.value
  const statValue = sphereTypeInfo[newType].statValue

  node.data('type', newType)
  node.data('value', statValue)
  node.style('background-color', sphereColors[newType])

  // Update the underlying data
  const nodeData = sphereData.value.nodes.find((n) => n.id === node.id())
  if (nodeData) {
    nodeData.type = newType
    nodeData.value = statValue
  }
}

const resetGrid = () => {
  // Reset to the original defaults from nodes.json
  const freshDefaults = generateSphereGrid()
  sphereData.value.nodes = freshDefaults.nodes

  // Clear localStorage to start fresh
  storedNodes.value = freshDefaults.nodes

  if (cy) {
    cy.nodes().forEach((node) => {
      // Find the corresponding node in the fresh defaults
      const defaultNode = freshDefaults.nodes.find((n) => n.id === node.id())
      if (defaultNode) {
        node.data('type', defaultNode.type)
        node.data('value', defaultNode.value)
        node.style('background-color', defaultNode.abilityId ? abilityNodeColor : sphereColors[defaultNode.type])
      }
    })
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  if (cy) {
    cy.destroy()
  }
})
</script>

<template>
  <div class="sphere-grid-container">
    <div class="controls">
      <h2>FFX Sphere Grid Planner</h2>

      <div class="sphere-selector">
        <button
          v-for="(info, type) in sphereTypeInfo"
          :key="type"
          v-show="type !== 'empty' && type !== 'locked'"
          :class="['sphere-button', { active: selectedType === type }]"
          :style="{ backgroundColor: sphereColors[type] }"
          @click="selectedType = type as SphereType"
        >
          {{ info.label }}
        </button>
      </div>

      <div class="actions">
        <button class="reset-button" @click="resetGrid">Reset to Defaults</button>
        <div class="save-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>Changes auto-saved</span>
        </div>
      </div>

      <div class="stats-panel">
        <h3>Current Stats</h3>
        <div class="stats-grid">
          <div class="stat-item" style="color: #22c55e">
            <span class="stat-label">HP:</span>
            <span class="stat-value">{{ stats.hp }}</span>
          </div>
          <div class="stat-item" style="color: #3b82f6">
            <span class="stat-label">MP:</span>
            <span class="stat-value">{{ stats.mp }}</span>
          </div>
          <div class="stat-item" style="color: #f97316">
            <span class="stat-label">Strength:</span>
            <span class="stat-value">{{ stats.strength }}</span>
          </div>
          <div class="stat-item" style="color: #0ea5e9">
            <span class="stat-label">Defense:</span>
            <span class="stat-value">{{ stats.defense }}</span>
          </div>
          <div class="stat-item" style="color: #a855f7">
            <span class="stat-label">Magic:</span>
            <span class="stat-value">{{ stats.magic }}</span>
          </div>
          <div class="stat-item" style="color: #ec4899">
            <span class="stat-label">Magic Def:</span>
            <span class="stat-value">{{ stats.magicDef }}</span>
          </div>
          <div class="stat-item" style="color: #06b6d4">
            <span class="stat-label">Agility:</span>
            <span class="stat-value">{{ stats.agility }}</span>
          </div>
          <div class="stat-item" style="color: #eab308">
            <span class="stat-label">Accuracy:</span>
            <span class="stat-value">{{ stats.accuracy }}</span>
          </div>
          <div class="stat-item" style="color: #94a3b8">
            <span class="stat-label">Evasion:</span>
            <span class="stat-value">{{ stats.evasion }}</span>
          </div>
          <div class="stat-item" style="color: #fbbf24">
            <span class="stat-label">Luck:</span>
            <span class="stat-value">{{ stats.luck }}</span>
          </div>
        </div>
      </div>

      <div class="sphere-counts-panel">
        <h3>Overridden Spheres ({{ overriddenSphereCounts.total }})</h3>
        <div class="sphere-counts-grid" v-if="overriddenSphereCounts.total > 0">
          <div
            v-for="(info, type) in sphereTypeInfo"
            :key="type"
            v-show="type !== 'locked' && overriddenSphereCounts.counts[type] > 0"
            class="sphere-count-item"
            :style="{ color: sphereColors[type] }"
          >
            <span class="sphere-count-label">{{ info.label }}:</span>
            <span class="sphere-count-value">{{ overriddenSphereCounts.counts[type] }}</span>
          </div>
        </div>
        <div v-else class="no-overrides">
          <p>No spheres have been customized yet.</p>
          <p class="hint">Select a sphere type above and click on empty spheres to start planning!</p>
        </div>
      </div>

      <div class="instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>This is the actual FFX International/HD sphere grid (803 nodes)</li>
          <li>Select a sphere type from the buttons above</li>
          <li>Click and drag over spheres to assign stat types</li>
          <li>Bright pink spheres are ability nodes (cannot be changed)</li>
          <li>Gray spheres are lock spheres (cannot be changed)</li>
          <li>Use mouse wheel to zoom, drag to pan</li>
          <li>Your changes are automatically saved to local storage</li>
          <li>Click "Reset to Defaults" to restore the original grid</li>
        </ul>
      </div>
    </div>

    <div class="canvas-container">
      <div ref="cyContainer" class="cy-container"></div>
    </div>
  </div>
</template>

<style scoped>
.sphere-grid-container {
  display: flex;
  gap: 2rem;
  height: 100vh;
  padding: 1rem;
  background: #1a1a1a;
  color: #ffffff;
}

.controls {
  width: 350px;
  overflow-y: auto;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
}

h2 {
  margin: 0 0 1rem 0;
  color: #fbbf24;
  font-size: 1.5rem;
}

h3 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1.2rem;
  color: #fbbf24;
}

h4 {
  margin: 1rem 0 0.5rem 0;
  font-size: 1rem;
  color: #fbbf24;
}

.sphere-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sphere-button {
  padding: 0.5rem 1rem;
  border: 2px solid transparent;
  border-radius: 6px;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.sphere-button:hover {
  transform: scale(1.05);
  border-color: #ffffff;
}

.sphere-button.active {
  border-color: #fbbf24;
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.actions {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reset-button {
  width: 100%;
  padding: 0.75rem;
  background: #dc2626;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button:hover {
  background: #b91c1c;
  transform: scale(1.02);
}

.save-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #1a1a1a;
  border-radius: 6px;
  color: #22c55e;
  font-size: 0.85rem;
  justify-content: center;
}

.save-indicator svg {
  flex-shrink: 0;
}

.stats-panel {
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #2a2a2a;
  border-radius: 4px;
  font-size: 1rem;
}

.stat-label {
  font-weight: bold;
}

.stat-value {
  font-family: monospace;
  font-size: 1.1rem;
}

.sphere-counts-panel {
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.sphere-counts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.sphere-count-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #2a2a2a;
  border-radius: 4px;
  font-size: 1rem;
}

.sphere-count-label {
  font-weight: bold;
}

.sphere-count-value {
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: bold;
}

.no-overrides {
  padding: 0.75rem;
  background: #2a2a2a;
  border-radius: 4px;
  text-align: center;
  color: #94a3b8;
}

.no-overrides p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.no-overrides .hint {
  font-size: 0.85rem;
  font-style: italic;
  color: #64748b;
}

.instructions {
  padding: 1rem;
  background: #1a1a1a;
  border-radius: 6px;
  font-size: 0.9rem;
}

.instructions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.5rem;
}

.canvas-container {
  flex: 1;
  background: #000000;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #444444;
}

.cy-container {
  width: 100%;
  height: 100%;
}
</style>
