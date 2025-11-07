<template>
  <TooltipProvider>
    <div class="absolute top-4 left-4 flex gap-2">
      <Card class="p-2">
        <div class="flex gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                @click="ctx.toggleLinkMode()"
                :variant="ctx.isLinkMode.value ? 'default' : 'ghost'"
                size="icon"
                class="h-8 w-8"
              >
                <Link class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ ctx.isLinkMode.value ? "Switch to Place Mode" : "Switch to Link Mode" }}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip v-if="ctx.isLinkMode.value && ctx.selectedNodeForLink.value">
            <TooltipTrigger as-child>
              <Button @click="ctx.cancelLinkSelection()" variant="ghost" size="icon" class="h-8 w-8">
                <X class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel Selection</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" class="h-8 mx-1" />

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="ctx.toggleGrid()" variant="ghost" size="icon" class="h-8 w-8">
                <Grid3x3 class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ ctx.showGrid.value ? "Hide Grid" : "Show Grid" }}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="ctx.resetView()" variant="ghost" size="icon" class="h-8 w-8">
                <Maximize class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset View</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" class="h-8 mx-1" />

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="handleExport" variant="ghost" size="icon" class="h-8 w-8">
                <Download class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export as JSON</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="handleImportExpertGrid" variant="ghost" size="icon" class="h-8 w-8">
                <FileJson class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Load Reference Grid</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" class="h-8 mx-1" />

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="triggerImageUpload" variant="ghost" size="icon" class="h-8 w-8">
                <ImageIcon class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload Background Image</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip v-if="ctx.backgroundImage.value">
            <TooltipTrigger as-child>
              <Button @click="ctx.clearImage()" variant="ghost" size="icon" class="h-8 w-8">
                <ImageOff class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear Background Image</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" class="h-8 mx-1" />

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="ctx.clearNodes()" variant="ghost" size="icon" class="h-8 w-8 text-destructive">
                <Trash2 class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear All Nodes</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </Card>

      <Card v-if="ctx.backgroundImage.value" class="p-2">
        <div class="flex items-center gap-2 p-2">
          <span class="text-xs text-muted-foreground">Opacity</span>
          <input type="range" min="0" max="1" step="0.1" v-model.number="ctx.imageOpacity.value" class="w-20 h-1" />
          <span class="text-xs font-medium text-foreground w-8">
            {{ (ctx.imageOpacity.value * 100).toFixed(0) }}%
          </span>
        </div>
      </Card>

      <Card class="p-2">
        <div class="flex items-center gap-2 p-2 min-w-[110px]">
          <span class="text-xs text-muted-foreground">Mode</span>
          <Badge :variant="ctx.isLinkMode.value ? 'default' : 'secondary'" class="text-xs">
            {{ ctx.isLinkMode.value ? "Link" : "Place" }}
          </Badge>
        </div>
      </Card>
    </div>

    <input id="toolbar-image-upload" type="file" accept="image/*" @change="handleImageUpload" class="hidden" />
  </TooltipProvider>
</template>

<script setup lang="ts">
import type { SphereType } from "@/types/sphere"
import Button from "@/components/ui/button/Button.vue"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Link, X, Grid3x3, Maximize, Download, FileJson, ImageIcon, ImageOff, Trash2 } from "lucide-vue-next"
import { useGridMapperContext } from "@/composables/useGridMapperContext"

const ctx = useGridMapperContext()

function triggerImageUpload() {
  const input = document.getElementById("toolbar-image-upload") as HTMLInputElement
  if (input) input.click()
}

async function handleImageUpload(event: Event) {
  try {
    await ctx.handleImageUpload(event)
  } catch (error) {
    console.error("Failed to load image:", error)
  }
}

function handleExport() {
  const jsonData = JSON.stringify(ctx.nodes.value, null, 2)
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "standard_grid_nodes.json"
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImportExpertGrid() {
  try {
    const response = await fetch("/src/nodes.json")
    const expertNodes = (await response.json()) as Array<{
      x: number
      y: number
      connections: [number, number][]
      attribute_name?: string | null
      ability_id?: number | null
      lock_level?: number | null
      value?: number
    }>

    const refNodes = expertNodes.map((node, index) => ({
      id: -index - 1,
      x: node.x * 3,
      y: node.y * 3,
      connections: [],
      type: "empty" as SphereType,
    }))

    ctx.setReferenceNodes(refNodes)
    alert(`Loaded ${ctx.referenceNodes.value.length} reference nodes`)
  } catch (error) {
    console.error("Failed to load expert grid:", error)
    alert("Failed to load expert grid")
  }
}
</script>
