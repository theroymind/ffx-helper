import { ref, type Ref, onBeforeUnmount, watch } from 'vue'
import cytoscape, { type Core, type NodeSingular } from 'cytoscape'
import type { SphereGridData, SphereType } from '@/types/sphere'
import { getSphereColors, abilityNodeColor, sphereTypeInfo, sphereIcons } from '@/constants/sphere'

export function useCytoscapeGrid(
  container: Ref<HTMLElement | null>,
  gridData: Ref<SphereGridData>,
  selectedType: Ref<SphereType>,
  onNodeUpdate: (nodeId: string, type: SphereType, value: number) => void,
  showIcons: Ref<boolean>,
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
            'background-image': (ele) => {
              // Don't show icons when showIcons is false
              if (!showIcons.value) return 'none'
              // Don't show icons for ability nodes
              const isAbilityNode = ele.data('abilityId') !== null && ele.data('abilityId') !== undefined
              if (isAbilityNode) return 'none'
              // Use icon if available for this sphere type
              const type = ele.data('type') as SphereType
              return sphereIcons[type] || 'none'
            },
            'background-fit': 'none',
            'background-width': 50,
            'background-height': 50,
            'border-width': 2,
            'border-color': '#ffffff',
            label: (ele) => {
              // Show hover label if hovering over non-ability nodes
              const hoverLabel = ele.data('hoverLabel')
              if (hoverLabel) {
                return hoverLabel
              }

              // Show ability name in center of ability nodes
              if (ele.data('abilityName')) {
                return ele.data('abilityName')
              }

              const type = ele.data('type') as SphereType
              const value = ele.data('value')

              // When showing icons, show H/M for HP/MP, otherwise empty
              if (showIcons.value) {
                if (type === 'hp') return 'H'
                if (type === 'mp') return 'M'
                return '' // Don't show numbers when icons are visible
              }

              // When not showing icons, show all stat values
              if (type === 'hp') return 'H'
              if (type === 'mp') return 'M'
              return value && value > 0 ? String(value) : ''
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'text-margin-y': 0,
            'font-size': (ele) => {
              // Smaller font for hover labels
              if (ele.data('hoverLabel')) return '14px'
              // Font size for ability names and stats
              return ele.data('abilityName') ? '12px' : '26px'
            },
            'font-weight': 'bold',
            // Enable text wrapping for ability names and hover labels
            'text-wrap': (ele) => {
              return ele.data('abilityName') || ele.data('hoverLabel') ? 'wrap' : 'none'
            },
            'text-max-width': (ele) => {
              if (ele.data('hoverLabel')) return '80px'
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
            width: 16,
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
      // Don't allow modifying ability nodes
      if (!node.data('abilityId')) {
        isDragging.value = true
        updateNodeType(node)
      }
    })

    cy.on('mouseover', 'node', (event) => {
      const node = event.target

      // Show hover label for non-ability nodes
      if (!node.data('abilityId')) {
        const type = node.data('type') as SphereType
        const value = node.data('value')
        const typeInfo = sphereTypeInfo[type]

        // Create hover label with type name and value
        let hoverLabel = typeInfo.label
        if (value && value > 0) {
          hoverLabel += ` +${value}`
        }
        node.data('hoverLabel', hoverLabel)

        // If dragging, also update node type
        if (isDragging.value) {
          updateNodeType(node)
        }
      }
    })

    cy.on('mouseout', 'node', (event) => {
      const node = event.target
      // Clear hover label for non-ability nodes
      if (!node.data('abilityId')) {
        node.data('hoverLabel', null)
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
    node.style('background-image', showIcons.value ? sphereIcons[newType] || 'none' : 'none')

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
        node.style(
          'background-image',
          showIcons.value ? sphereIcons[defaultNode.type] || 'none' : 'none',
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

  // Watch for showIcons changes and update all nodes
  watch(showIcons, () => {
    if (!cy) return

    cy.nodes().forEach((node) => {
      const type = node.data('type') as SphereType
      const isAbilityNode = node.data('abilityId') !== null && node.data('abilityId') !== undefined

      if (!isAbilityNode) {
        // Update background image based on showIcons
        node.style('background-image', showIcons.value ? sphereIcons[type] || 'none' : 'none')
      }
    })

    // Force redraw
    cy.style().update()
  })

  onBeforeUnmount(destroy)

  return {
    cy,
    isDragging,
    initializeCytoscape,
    resetNodes,
    destroy,
  }
}
