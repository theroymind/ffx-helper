import { ref } from "vue";
import { useGridMapperContext, type GridMapperContext } from "./useGridMapperContext";

export function useGridMapperEvents(providedContext?: GridMapperContext) {
  const ctx = providedContext || useGridMapperContext();
  const lastPanX = ref(0);
  const lastPanY = ref(0);
  const dragStartScreenPos = ref<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5;

  function handleCanvasClick(event: MouseEvent) {
    const canvas = ctx.canvasRef.value;
    if (!canvas || ctx.isPanning.value) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const { x, y } = ctx.screenToWorld(screenX, screenY);
    const worldX = Math.round(x);
    const worldY = Math.round(y);

    if (ctx.isLinkMode.value) {
      const clickedNode = ctx.findNodeAtPosition(worldX, worldY);

      if (clickedNode) {
        if (!ctx.selectedNodeForLink.value) {
          ctx.selectedNodeForLink.value = clickedNode;
        } else {
          if (clickedNode.id !== ctx.selectedNodeForLink.value.id) {
            ctx.toggleConnection(ctx.selectedNodeForLink.value, clickedNode);
          }
          ctx.selectedNodeForLink.value = null;
        }
      }
    } else {
      const clickedNode = ctx.findNodeAtPosition(worldX, worldY);
      if (clickedNode) {
        return { worldX, worldY, existingNode: clickedNode };
      }
      return { worldX, worldY };
    }
  }

  function handleMouseDown(event: MouseEvent) {
    const canvas = ctx.canvasRef.value;
    if (!canvas) return;

    if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
      event.preventDefault();
      ctx.isPanning.value = true;
      lastPanX.value = event.clientX;
      lastPanY.value = event.clientY;
      return;
    }

    if (event.button === 0 && !ctx.isLinkMode.value) {
      const rect = canvas.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const { x, y } = ctx.screenToWorld(screenX, screenY);
      const worldX = Math.round(x);
      const worldY = Math.round(y);

      const clickedNode = ctx.findNodeAtPosition(worldX, worldY);

      if (clickedNode && clickedNode.connections.length < 4) {
        dragStartScreenPos.value = { x: screenX, y: screenY };
        ctx.dragStartNode.value = clickedNode;
      }
    }
  }

  function handleMouseUp(event: MouseEvent) {
    const wasDragging = ctx.isDraggingToCreate.value;

    ctx.isPanning.value = false;
    ctx.isDraggingToCreate.value = false;
    dragStartScreenPos.value = null;

    if (wasDragging && ctx.dragEndPos.value) {
      return {
        type: "drag-to-create" as const,
        worldX: ctx.dragEndPos.value.x,
        worldY: ctx.dragEndPos.value.y,
        sourceNode: ctx.dragStartNode.value,
      };
    }

    ctx.dragStartNode.value = null;
    ctx.dragEndPos.value = null;
  }

  function handleMouseMove(event: MouseEvent) {
    const canvas = ctx.canvasRef.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    ctx.updateMousePosition(screenX, screenY);

    if (ctx.isPanning.value) {
      const deltaX = event.clientX - lastPanX.value;
      const deltaY = event.clientY - lastPanY.value;

      ctx.viewOffsetX.value += deltaX;
      ctx.viewOffsetY.value += deltaY;

      lastPanX.value = event.clientX;
      lastPanY.value = event.clientY;
      return;
    }

    if (ctx.dragStartNode.value && dragStartScreenPos.value) {
      const dx = screenX - dragStartScreenPos.value.x;
      const dy = screenY - dragStartScreenPos.value.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > DRAG_THRESHOLD) {
        ctx.isDraggingToCreate.value = true;
        const { x, y } = ctx.screenToWorld(screenX, screenY);
        ctx.dragEndPos.value = { x: Math.round(x), y: Math.round(y) };
      }
    }
  }

  function handleWheel(event: WheelEvent) {
    const canvas = ctx.canvasRef.value;
    if (!canvas) return;

    if (event.ctrlKey) {
      event.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const worldPosBefore = ctx.screenToWorld(mouseX, mouseY);

      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      ctx.viewScale.value = Math.max(0.1, Math.min(10, ctx.viewScale.value * zoomFactor));

      const worldPosAfter = ctx.screenToWorld(mouseX, mouseY);

      ctx.viewOffsetX.value += (worldPosAfter.x - worldPosBefore.x) * ctx.viewScale.value;
      ctx.viewOffsetY.value += (worldPosAfter.y - worldPosBefore.y) * ctx.viewScale.value;
    } else {
      event.preventDefault();

      ctx.viewOffsetX.value -= event.deltaX;
      ctx.viewOffsetY.value -= event.deltaY;
    }
  }

  return {
    handleCanvasClick,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleWheel,
  };
}
