import { ref, type Ref, onBeforeUnmount, watch } from "vue";
import cytoscape, { type Core, type NodeSingular } from "cytoscape";
import { SphereType } from "@/domain/grid/SphereType";
import type { SphereGridData } from "@/domain/grid/SphereGridData";
import type { SphereNode } from "@/domain/grid/SphereNode";
import { getSphereColors, abilityNodeColor, abilityIcon, sphereTypeInfo, sphereIcons } from "@/constants/sphere";

export function useCytoscapeGrid(
  container: Ref<HTMLElement | null>,
  gridData: Ref<SphereGridData>,
  selectedType: Ref<SphereType>,
  onNodeUpdate: (nodeId: string, type: SphereType, value: number) => void,
  showIcons: Ref<boolean>,
  highlightedType: Ref<SphereType | null>,
  onSelectionChange?: (nodeIds: string[]) => void,
  onDragStart?: () => void,
  onDragEnd?: () => void,
) {
  let cy: Core | null = null;
  const isDragging = ref(false);
  let wheelEventCleanup: (() => void) | null = null;
  let middleMouseCleanup: (() => void) | null = null;

  const initializeCytoscape = () => {
    if (!container.value) return;

    if (wheelEventCleanup) {
      wheelEventCleanup();
      wheelEventCleanup = null;
    }
    if (middleMouseCleanup) {
      middleMouseCleanup();
      middleMouseCleanup = null;
    }
    if (cy) {
      cy.destroy();
      cy = null;
    }

    const { nodes, edges, positions } = gridData.value;
    const sphereColors = getSphereColors(); // Get colors from CSS at runtime

    // @ts-expect-error expose for e2e testing
    window.__cy = null;

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
          selectable: !node.abilityId,
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
          selector: "node",
          style: {
            width: 45,
            height: 45,
            "background-color": (ele: NodeSingular) => {
              const isAbilityNode = ele.data("abilityId") !== null && ele.data("abilityId") !== undefined;
              if (isAbilityNode) return abilityNodeColor;
              return sphereColors[ele.data("type") as SphereType];
            },
            "background-image": (ele) => {
              // Don't show icons when showIcons is false
              if (!showIcons.value) return "none";
              // Show ability icon for ability nodes
              const isAbilityNode = ele.data("abilityId") !== null && ele.data("abilityId") !== undefined;
              if (isAbilityNode) return abilityIcon;
              // Use icon if available for this sphere type
              const type = ele.data("type") as SphereType;
              return sphereIcons[type] || "none";
            },
            "background-fit": "cover",
            opacity: (ele: NodeSingular) => {
              if (!highlightedType.value) return 1;
              const isAbilityNode = ele.data("abilityId") !== null && ele.data("abilityId") !== undefined;
              if (isAbilityNode) return highlightedType.value ? 0.2 : 1;
              return ele.data("type") === highlightedType.value ? 1 : 0.2;
            },
            label: (ele: NodeSingular) => {
              // Show hover label if hovering over non-ability nodes
              const hoverLabel = ele.data("hoverLabel");
              if (hoverLabel) {
                return hoverLabel;
              }

              // Show ability name in center of ability nodes
              if (ele.data("abilityName")) {
                return ele.data("abilityName");
              }

              const value = ele.data("value");

              // When showing icons, show H/M for HP/MP, otherwise empty
              if (showIcons.value) {
                return ""; // Don't show numbers when icons are visible
              }

              // When not showing icons, show all stat values
              return value && value > 0 ? String(value) : "";
            },
            "text-valign": "center",
            "text-halign": "center",
            "text-margin-y": 0,
            "font-size": (ele: NodeSingular) => {
              // Smaller font for hover labels
              if (ele.data("hoverLabel")) return "14px";
              // Font size for ability names and stats
              return ele.data("abilityName") ? "12px" : "26px";
            },
            "font-weight": "bold",
            // Enable text wrapping for ability names and hover labels
            "text-wrap": (ele: NodeSingular) => {
              return ele.data("abilityName") || ele.data("hoverLabel") ? "wrap" : "none";
            },
            "text-max-width": (ele: NodeSingular) => {
              if (ele.data("hoverLabel")) return "80px";
              return ele.data("abilityName") ? "60px" : "0";
            },
            color: "#ffffff",
            "text-outline-color": "#000000",
            "text-outline-width": 3,
          },
        },
        {
          selector: "node[abilityId]",
          style: {
            // Make ability nodes larger
            width: 65,
            height: 65,
            "border-width": 0,
          },
        },
        {
          selector: "node:active",
          style: {
            "border-width": 4,
            "border-color": "#fbbf24",
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 5,
            "border-color": "#ffffff",
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 4,
            "border-color": "#fbbf24",
            "overlay-opacity": 0.2,
            "overlay-color": "#fbbf24",
          },
        },
        {
          selector: "edge",
          style: {
            width: 16,
            "line-color": "#444444",
            "curve-style": "straight",
          },
        },
      ],
      layout: {
        name: "preset",
      },
      userPanningEnabled: false,
      userZoomingEnabled: false,
      boxSelectionEnabled: true,
      autoungrabify: true,
      autounselectify: false,
    });

    // @ts-expect-error expose for e2e testing
    window.__cy = cy;

    // @ts-expect-error expose for e2e testing
    window.__clickNode = (nodeId: string, type?: string) => {
      if (!cy) return false;
      const node = cy.getElementById(nodeId);
      if (!node || node.empty() || node.data("abilityId")) return false;
      if (type) {
        selectedType.value = type as SphereType;
      }
      updateNodeType(node);
      return true;
    };

    // @ts-expect-error expose for e2e testing
    window.__getModifiableNodeId = (index: number) => {
      if (!cy) return null;
      const nodes = cy.nodes().filter((n: NodeSingular) => !n.data("abilityId") && !n.data("locked"));
      const node = nodes[index];
      return node ? node.id() : null;
    };

    const containerElement = container.value;
    if (containerElement) {
      function wheelHandler(event: WheelEvent) {
        event.preventDefault();
        if (!cy) return;

        if (event.ctrlKey || event.metaKey) {
          if (event.deltaY === 0) return;
          const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05;
          const currentZoom = cy.zoom();
          const newZoom = Math.max(0.1, Math.min(10, currentZoom * zoomFactor));
          cy.zoom({
            level: newZoom,
            renderedPosition: { x: event.offsetX, y: event.offsetY },
          });
        } else {
          const pan = cy.pan();
          cy.pan({ x: pan.x - event.deltaX, y: pan.y - event.deltaY });
        }
      }

      containerElement.addEventListener("wheel", wheelHandler, { passive: false });
      wheelEventCleanup = () => containerElement.removeEventListener("wheel", wheelHandler);

      let isPanning = false;
      let panStartX = 0;
      let panStartY = 0;
      let panStartPan = { x: 0, y: 0 };

      function panMouseDown(event: MouseEvent) {
        if (event.button === 1 || event.button === 2) {
          event.preventDefault();
          isPanning = true;
          panStartX = event.clientX;
          panStartY = event.clientY;
          panStartPan = cy ? { ...cy.pan() } : { x: 0, y: 0 };
        }
      }

      function panMouseMove(event: MouseEvent) {
        if (isPanning && cy) {
          cy.pan({
            x: panStartPan.x + (event.clientX - panStartX),
            y: panStartPan.y + (event.clientY - panStartY),
          });
        }
      }

      function panMouseUp(event: MouseEvent) {
        if (event.button === 1 || event.button === 2) {
          isPanning = false;
        }
      }

      function preventContextMenu(event: MouseEvent) {
        event.preventDefault();
      }

      containerElement.addEventListener("mousedown", panMouseDown);
      containerElement.addEventListener("contextmenu", preventContextMenu);
      document.addEventListener("mousemove", panMouseMove);
      document.addEventListener("mouseup", panMouseUp);
      middleMouseCleanup = () => {
        containerElement.removeEventListener("mousedown", panMouseDown);
        containerElement.removeEventListener("contextmenu", preventContextMenu);
        document.removeEventListener("mousemove", panMouseMove);
        document.removeEventListener("mouseup", panMouseUp);
      };
    }

    // Handle node interactions
    cy.on("mousedown", "node", (event) => {
      const node = event.target;
      if (!node.data("abilityId")) {
        onDragStart?.();
        isDragging.value = true;
        updateNodeType(node);
      }
    });

    cy.on("mouseover", "node", (event) => {
      const node = event.target;

      // Change cursor to pointer for non-ability nodes
      if (!node.data("abilityId") && containerElement) {
        const canvas = containerElement.querySelector("canvas");
        if (canvas) {
          (canvas as HTMLElement).style.cursor = "pointer";
        }
      }

      // Show hover label for non-ability nodes
      if (!node.data("abilityId")) {
        const type = node.data("type") as SphereType;
        const value = node.data("value");
        const typeInfo = sphereTypeInfo[type];

        // Create hover label with type name and value
        let hoverLabel = typeInfo.label;
        if (value && value > 0) {
          hoverLabel += ` +${value}`;
        }
        node.data("hoverLabel", hoverLabel);

        // If dragging, update node type
        if (isDragging.value) {
          updateNodeType(node);
        }
      }
    });

    cy.on("mouseout", "node", (event) => {
      const node = event.target;

      // Reset cursor to crosshair
      if (containerElement) {
        const canvas = containerElement.querySelector("canvas");
        if (canvas) {
          (canvas as HTMLElement).style.cursor = "crosshair";
        }
      }

      // Clear hover label for non-ability nodes
      if (!node.data("abilityId")) {
        node.data("hoverLabel", null);
      }
    });

    cy.on("mouseup", () => {
      isDragging.value = false;
      onDragEnd?.();
    });

    // Handle selection changes
    cy.on("select unselect", () => {
      if (onSelectionChange && cy) {
        const selectedNodes = cy.nodes(":selected").filter((node) => !node.data("abilityId"));
        const nodeIds = selectedNodes.map((node) => node.id());
        onSelectionChange(nodeIds);
      }
    });

    document.addEventListener("mouseup", handleGlobalMouseUp);
  };

  function handleGlobalMouseUp() {
    isDragging.value = false;
    onDragEnd?.();
  }

  const updateNodeType = (node: NodeSingular) => {
    const newType = selectedType.value;
    const statValue = sphereTypeInfo[newType].statValue;
    const sphereColors = getSphereColors();

    node.data("type", newType);
    node.data("value", statValue);

    const isAbilityNode = node.data("abilityId") !== null && node.data("abilityId") !== undefined;
    node.style("background-color", isAbilityNode ? abilityNodeColor : sphereColors[newType]);
    node.style("background-image", showIcons.value ? sphereIcons[newType] || "none" : "none");

    onNodeUpdate(node.id(), newType, statValue);
  };

  const resetNodes = (nodes: SphereNode[]) => {
    if (!cy) return;

    const sphereColors = getSphereColors();

    cy.nodes().forEach((node) => {
      const defaultNode = nodes.find((n) => n.id === node.id());
      if (defaultNode) {
        node.data("type", defaultNode.type);
        node.data("value", defaultNode.value);
        const isAbilityNode = defaultNode.abilityId !== null && defaultNode.abilityId !== undefined;
        const nodeType = defaultNode.type as SphereType;
        node.style("background-color", isAbilityNode ? abilityNodeColor : sphereColors[nodeType]);
        const icon = isAbilityNode ? abilityIcon : sphereIcons[nodeType] || "none";
        node.style("background-image", showIcons.value ? icon : "none");
      }
    });
  };

  const clearSelection = () => {
    if (cy) {
      cy.nodes().unselect();
    }
  };

  const updateSelectedNodes = (nodeIds: string[], type: SphereType, value: number) => {
    if (!cy) return;

    const sphereColors = getSphereColors();
    cy.batch(() => {
      nodeIds.forEach((nodeId) => {
        const node = cy?.getElementById(nodeId);
        if (node) {
          node.data("type", type);
          node.data("value", value);
          const isAbilityNode = node.data("abilityId") !== null && node.data("abilityId") !== undefined;
          node.style("background-color", isAbilityNode ? abilityNodeColor : sphereColors[type]);
          node.style("background-image", showIcons.value ? sphereIcons[type] || "none" : "none");
        }
      });
    });
    cy.style().update();
  };

  const destroy = () => {
    document.removeEventListener("mouseup", handleGlobalMouseUp);
    if (wheelEventCleanup) {
      wheelEventCleanup();
      wheelEventCleanup = null;
    }
    if (middleMouseCleanup) {
      middleMouseCleanup();
      middleMouseCleanup = null;
    }
    if (cy) {
      cy.destroy();
      cy = null;
    }
  };

  // Watch for showIcons changes and update all nodes
  watch(showIcons, () => {
    if (!cy) return;

    cy.nodes().forEach((node) => {
      const type = node.data("type") as SphereType;
      const isAbilityNode = node.data("abilityId") !== null && node.data("abilityId") !== undefined;

      if (!isAbilityNode) {
        // Update background image based on showIcons
        node.style("background-image", showIcons.value ? sphereIcons[type] || "none" : "none");
      }
    });

    // Force redraw
    cy.style().update();
  });

  // Watch for highlightedType changes and update node classes and opacity
  watch(highlightedType, () => {
    if (!cy) return;

    const currentCy = cy;
    currentCy.batch(() => {
      currentCy.nodes().forEach((node) => {
        const isAbilityNode = node.data("abilityId") !== null && node.data("abilityId") !== undefined;
        const nodeType = node.data("type") as SphereType;

        if (highlightedType.value && !isAbilityNode && nodeType === highlightedType.value) {
          node.addClass("highlighted");
        } else {
          node.removeClass("highlighted");
        }
      });
    });

    currentCy.style().update();
  });

  onBeforeUnmount(destroy);

  return {
    cy,
    isDragging,
    initializeCytoscape,
    resetNodes,
    clearSelection,
    updateSelectedNodes,
    destroy,
  };
}
