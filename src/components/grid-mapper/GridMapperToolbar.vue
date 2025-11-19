<template>
  <TooltipProvider>
    <div class="absolute top-4 left-4 flex gap-2">
      <Card class="p-2">
        <div class="flex gap-1">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger as-child>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Save class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Versions</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" class="w-80">
              <DropdownMenuLabel>Saved Versions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div class="p-2">
                <Dialog v-model:open="showSaveDialog">
                  <DialogTrigger as-child>
                    <Button variant="default" size="sm" class="w-full">
                      <Save class="h-4 w-4 mr-2" />
                      Save Current Grid
                    </Button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Save Grid Version</DialogTitle>
                      <DialogDescription> Give your grid mapping a name to save it for later. </DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                      <div class="grid gap-2">
                        <Label for="version-name">Version Name</Label>
                        <Input
                          id="version-name"
                          v-model="versionName"
                          placeholder="e.g., Standard Grid Complete"
                          @keyup.enter="handleSaveVersion"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="secondary" @click="showSaveDialog = false"> Cancel </Button>
                      <Button type="button" @click="handleSaveVersion" :disabled="!versionName.trim()">
                        <Save class="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <DropdownMenuSeparator v-if="versionManager.versions.value.length > 0" />

              <div
                v-if="versionManager.versions.value.length === 0"
                class="text-xs text-muted-foreground text-center py-4"
              >
                No saved versions yet
              </div>

              <div v-else class="max-h-[300px] overflow-y-auto">
                <div
                  v-for="version in versionManager.versions.value"
                  :key="version.id"
                  class="p-2 border-b last:border-b-0"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-foreground truncate">
                        {{ version.name }}
                      </div>
                      <div class="text-xs text-muted-foreground mt-0.5">
                        {{ formatDate(version.dateCreated) }} • {{ version.nodes.length }} nodes
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button variant="outline" size="sm" class="flex-1 text-xs" @click="handleLoadVersion(version.id)">
                      <Download class="h-3 w-3 mr-1.5" />
                      Load
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger as-child>
                        <Button variant="destructive" size="sm" class="text-xs px-3">
                          <Trash2 class="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Version?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{{ version.name }}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction @click="handleDeleteVersion(version.id)"> Delete </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" class="h-8 mx-1" />

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
        <div class="flex items-center gap-2 min-w-[150px]">
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
import { ref } from "vue"
import Button from "@/components/ui/button/Button.vue"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, X, Grid3x3, Maximize, Download, ImageIcon, ImageOff, Trash2, Save } from "lucide-vue-next"
import { useGridMapperContext } from "@/composables/useGridMapperContext"
import { useGridMapperVersionManager } from "@/composables/useVersionManager"
import abilitiesData from "@/assets/abilities.json"

const ctx = useGridMapperContext()
const versionManager = useGridMapperVersionManager()

const showSaveDialog = ref(false)
const versionName = ref("")

const abilityNameToId = abilitiesData.reduce(
  (map, ability) => {
    map[ability.name] = ability.id
    return map
  },
  {} as Record<string, number>,
)

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
  const typeToAttributeName: Record<string, string | null> = {
    hp: "HP",
    mp: "MP",
    strength: "Strength",
    defense: "Defense",
    magic: "Magic",
    magicDef: "Magic Defense",
    agility: "Agility",
    accuracy: "Accuracy",
    evasion: "Evasion",
    luck: "Luck",
    empty: null,
    locked: null,
  }

  const exportedNodes = ctx.nodes.value.map((node) => {
    const connectedNodes = node.connections
      .map((connectedId) => {
        const connectedNode = ctx.nodes.value.find((n) => n.id === connectedId)
        return connectedNode ? [connectedNode.x, connectedNode.y] : null
      })
      .filter((conn) => conn !== null)

    return {
      id: node.id,
      x: node.x,
      y: node.y,
      connections: connectedNodes,
      attribute_name: typeToAttributeName[node.type] || null,
      value: node.value || null,
      lock_level: node.lockLevel || null,
      ability_id: node.abilityName ? abilityNameToId[node.abilityName] || null : null,
    }
  })

  const jsonData = JSON.stringify(exportedNodes, null, 2)
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "standard_grid_nodes.json"
  a.click()
  URL.revokeObjectURL(url)
}

function handleSaveVersion() {
  if (versionName.value.trim()) {
    const name = versionName.value.trim()
    const nodes = ctx.getCurrentNodes()
    versionManager.saveVersion(name, nodes)
    versionName.value = ""
    showSaveDialog.value = false
    alert(`Saved version: ${name}`)
  }
}

function handleLoadVersion(versionId: string) {
  const nodes = versionManager.loadVersion(versionId)
  if (nodes) {
    ctx.loadNodes(nodes)
    alert(`Loaded version with ${nodes.length} nodes`)
  }
}

function handleDeleteVersion(versionId: string) {
  versionManager.deleteVersion(versionId)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}
</script>
