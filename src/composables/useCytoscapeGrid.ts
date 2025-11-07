import { ref, type Ref, onBeforeUnmount } from 'vue'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import type { SphereGridData, SphereType } from '@/types/sphere'
import { getSphereColors, abilityNodeColor, sphereTypeInfo } from '@/constants/sphere'

export function useCytoscapeGrid(
  container: Ref<HTMLElement | null>,
  gridData: Ref<SphereGridData>,
  selectedType: Ref<SphereType>,
  onNodeUpdate: (nodeId: string, type: SphereType, value: number) => void,
) {
  let cy: Core | null = null
  const isDragging = ref(false)

  const initializeCytoscape = () => {
    if (!container.value) return

    const { nodes, edges, positions } = gridData.value
    const sphereColors = getSphereColors() // Get colors from CSS at runtime

    cy = cytoscape({
      container: container.value,
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
              return ele.data('abilityName') ? '60px' : '0'
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
  }

  const handleGlobalMouseUp = () => {
    isDragging.value = false
  }

  const updateNodeType = (node: NodeSingular) => {
    const newType = selectedType.value
    const statValue = sphereTypeInfo[newType].statValue
    const sphereColors = getSphereColors() // Get colors from CSS at runtime

    node.data('type', newType)
    node.data('value', statValue)
    node.style('background-color', sphereColors[newType])

    // Update the underlying data via callback
    onNodeUpdate(node.id(), newType, statValue)
  }

  const resetNodes = (nodes: any[]) => {
    if (!cy) return

    const sphereColors = getSphereColors() // Get colors from CSS at runtime

    cy.nodes().forEach((node) => {
      const defaultNode = nodes.find((n) => n.id === node.id())
      if (defaultNode) {
        node.data('type', defaultNode.type)
        node.data('value', defaultNode.value)
        node.style(
          'background-color',
          defaultNode.abilityId ? abilityNodeColor : sphereColors[defaultNode.type],
        )
      }
    })
  }

  const destroy = () => {
    document.removeEventListener('mouseup', handleGlobalMouseUp)
    if (cy) {
      cy.destroy()
      cy = null
    }
  }

  onBeforeUnmount(destroy)

  return {
    cy,
    isDragging,
    initializeCytoscape,
    resetNodes,
    destroy,
  }
}
