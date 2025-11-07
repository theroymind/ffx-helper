import { watch } from "vue"
import type { SphereType } from "@/types/sphere"
import { sphereTypeInfo, getSphereColors, abilityNodeColor } from "@/constants/sphere"
import { useGridMapperContext, type GridMapperContext } from "./useGridMapperContext"

const GRID_SPACING = 50
const NODE_RADIUS = 8

export function useGridMapperDrawing(providedContext?: GridMapperContext) {
  const ctx = providedContext || useGridMapperContext()
  const sphereColors = getSphereColors()

  function getSphereColor(type: SphereType): string {
    if (type === "empty") return "#333333"
    if (type === "locked") return "#71717a"
    return sphereColors[type] || "#10b981"
  }

  function draw() {
    const canvas = ctx.canvasRef.value
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    // Save context state
    context.save()

    // Clear canvas (before transformations)
    context.fillStyle = "#18181b" // zinc-950
    context.fillRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan transformations
    context.translate(ctx.viewOffsetX.value, ctx.viewOffsetY.value)
    context.scale(ctx.viewScale.value, ctx.viewScale.value)

    // Draw background image if loaded
    if (ctx.backgroundImage.value) {
      context.globalAlpha = ctx.imageOpacity.value
      context.drawImage(ctx.backgroundImage.value, 0, 0, ctx.canvasWidth.value, ctx.canvasHeight.value)
      context.globalAlpha = 1.0
    }

    // Draw grid if enabled
    if (ctx.showGrid.value) {
      drawGrid(context)
    }

    // Draw reference nodes
    drawReferenceNodes(context)

    // Draw connections
    drawConnections(context)

    // Draw nodes
    drawNodes(context)

    // Restore context state (undo transformations)
    context.restore()

    // Draw mouse cursor in screen space (after restore)
    drawMouseCursor(context)
  }

  function drawGrid(context: CanvasRenderingContext2D) {
    context.strokeStyle = "#3f3f46" // zinc-700
    context.lineWidth = 1

    // Vertical lines
    for (let x = 0; x <= ctx.canvasWidth.value; x += GRID_SPACING) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, ctx.canvasHeight.value)
      context.stroke()
    }

    // Horizontal lines
    for (let y = 0; y <= ctx.canvasHeight.value; y += GRID_SPACING) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(ctx.canvasWidth.value, y)
      context.stroke()
    }

    // Draw coordinates every 100 pixels
    context.fillStyle = "#71717a" // zinc-500
    context.font = "10px monospace"
    for (let x = 0; x <= ctx.canvasWidth.value; x += 100) {
      for (let y = 0; y <= ctx.canvasHeight.value; y += 100) {
        if (x === 0 && y === 0) continue
        context.fillText(`${x},${y}`, x + 2, y + 10)
      }
    }
  }

  function drawReferenceNodes(context: CanvasRenderingContext2D) {
    ctx.referenceNodes.value.forEach((node) => {
      context.fillStyle = "#52525b" // zinc-600
      context.beginPath()
      context.arc(node.x, node.y, 6, 0, Math.PI * 2)
      context.fill()
    })
  }

  function drawConnections(context: CanvasRenderingContext2D) {
    context.strokeStyle = "#6366f1" // indigo-500
    context.lineWidth = 3
    ctx.nodes.value.forEach((node) => {
      node.connections.forEach((connectedId) => {
        const connectedNode = ctx.nodes.value.find((n) => n.id === connectedId)
        if (connectedNode) {
          context.beginPath()
          context.moveTo(node.x, node.y)
          context.lineTo(connectedNode.x, connectedNode.y)
          context.stroke()
        }
      })
    })
  }

  function drawNodes(context: CanvasRenderingContext2D) {
    ctx.nodes.value.forEach((node) => {
      const isSelected = ctx.selectedNodeForLink.value?.id === node.id
      const isConnectedToSelected =
        ctx.selectedNodeForLink.value &&
        ctx.selectedNodeForLink.value.connections.includes(node.id) &&
        !isSelected

      let baseColor = getSphereColor(node.type)
      if (node.abilityName) {
        baseColor = abilityNodeColor
      }

      let fillColor = baseColor
      let strokeColor = "#ffffff"
      let strokeWidth = 2

      if (isSelected) {
        fillColor = "#f59e0b" // amber-500
        strokeColor = "#fbbf24" // amber-400
        strokeWidth = 3
      } else if (isConnectedToSelected) {
        fillColor = "#ef4444" // red-500
        strokeColor = "#fca5a5" // red-300
        strokeWidth = 3
      }

      context.fillStyle = fillColor
      context.beginPath()
      context.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
      context.fill()

      context.strokeStyle = strokeColor
      context.lineWidth = strokeWidth
      context.stroke()

      // Node labels
      context.fillStyle = "#ffffff"
      context.font = "bold 10px monospace"
      context.textAlign = "center"
      context.fillText(`${node.id}`, node.x, node.y + 20)

      if (node.abilityName) {
        context.font = "8px monospace"
        context.fillText(node.abilityName, node.x, node.y - 12)
      } else if (node.lockLevel) {
        context.font = "8px monospace"
        context.fillText(`L${node.lockLevel}`, node.x, node.y - 12)
      } else {
        const typeInfo = sphereTypeInfo[node.type]
        if (typeInfo && typeInfo.shortLabel !== "---") {
          context.font = "8px monospace"
          context.fillText(typeInfo.shortLabel, node.x, node.y - 12)
        }
      }
    })
  }

  function drawMouseCursor(context: CanvasRenderingContext2D) {
    if (ctx.mousePos.value.x > 0 && ctx.mousePos.value.y > 0) {
      const worldX = (ctx.mousePos.value.x - ctx.viewOffsetX.value) / ctx.viewScale.value
      const worldY = (ctx.mousePos.value.y - ctx.viewOffsetY.value) / ctx.viewScale.value

      context.fillStyle = "#fbbf24" // amber-400
      context.beginPath()
      context.arc(ctx.mousePos.value.x, ctx.mousePos.value.y, 4, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = "#fbbf24"
      context.font = "12px monospace"
      context.textAlign = "left"
      context.fillText(
        `${Math.round(worldX)}, ${Math.round(worldY)}`,
        ctx.mousePos.value.x + 10,
        ctx.mousePos.value.y - 10,
      )
    }
  }

  // Watch for changes and redraw
  watch(
    [
      ctx.nodes,
      ctx.showGrid,
      ctx.referenceNodes,
      ctx.isLinkMode,
      ctx.selectedNodeForLink,
      ctx.viewScale,
      ctx.viewOffsetX,
      ctx.viewOffsetY,
      ctx.mousePos,
      ctx.backgroundImage,
      ctx.imageOpacity,
    ],
    () => {
      draw()
    },
  )

  return {
    draw,
  }
}
