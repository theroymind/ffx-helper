import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import sphereGridData from '@/nodes.json'
import abilitiesData from '@/abilities.json'
import type { SphereNode, SphereGridData, Stats } from '@/types/sphere'
import { mapAttributeToType, sphereTypeInfo, baseStats } from '@/constants/sphere'

// Build ability ID to name mapping from abilities.json
const abilityNames: Record<number, string> = {}
abilitiesData.forEach((ability: any) => {
  abilityNames[ability.id] = ability.name
})

// Generate the sphere grid from the data file
export const generateSphereGrid = (): SphereGridData => {
  const nodes: SphereNode[] = []
  const edges: Array<{ source: string; target: string }> = []
  const positions: Record<string, { x: number; y: number }> = {}

  // Create a map of coordinates to node IDs for connection lookup
  const coordToNodeId = new Map<string, string>()

  // Parse the FFX sphere grid data
  sphereGridData.forEach((nodeData: any) => {
    const nodeId = `node-${nodeData.id}`
    const sphereType = mapAttributeToType(
      nodeData.attribute_name,
      nodeData.ability_id,
      nodeData.lock_level,
    )

    // For empty nodes, set value to 0 so no number displays
    const displayValue = sphereType === 'empty' ? 0 : nodeData.value || 0

    nodes.push({
      id: nodeId,
      type: sphereType,
      value: displayValue,
      locked: sphereType === 'locked',
      abilityId: nodeData.ability_id,
      abilityName: nodeData.ability_id
        ? abilityNames[nodeData.ability_id] || `Ability ${nodeData.ability_id}`
        : undefined,
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
            (edge) =>
              (edge.source === sourceId && edge.target === targetId) ||
              (edge.source === targetId && edge.target === sourceId),
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

export function useSphereData() {
  // Generate default sphere grid data
  const defaultSphereGrid = generateSphereGrid()

  // Use local storage to persist node customizations
  const storedNodes = useLocalStorage<SphereNode[]>(
    'ffx-sphere-grid-nodes',
    defaultSphereGrid.nodes,
    {
      mergeDefaults: true,
    },
  )

  // Create the reactive sphere data, using stored nodes if available
  const sphereData = ref<SphereGridData>({
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
    { deep: true },
  )

  // Calculate stats
  const stats = computed<Stats>(() => {
    const result: Stats = { ...baseStats }

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
    const counts = Object.fromEntries(
      Object.keys(sphereTypeInfo).map((type) => [type, 0]),
    ) as Record<string, number>

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

  // Reset grid to defaults
  const resetGrid = (updateCallback?: (nodes: SphereNode[]) => void) => {
    const freshDefaults = generateSphereGrid()
    sphereData.value.nodes = freshDefaults.nodes
    storedNodes.value = freshDefaults.nodes

    if (updateCallback) {
      updateCallback(freshDefaults.nodes)
    }
  }

  // Update a node's type
  const updateNode = (nodeId: string, type: string, value: number) => {
    const node = sphereData.value.nodes.find((n) => n.id === nodeId)
    if (node) {
      node.type = type as any
      node.value = value
    }
  }

  return {
    sphereData,
    stats,
    overriddenSphereCounts,
    resetGrid,
    updateNode,
  }
}
