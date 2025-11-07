<template>
  <Collapsible v-model:open="isOpen" class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h4 class="text-sm font-semibold text-foreground">Saved Versions</h4>
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="sm">
          <ChevronsUpDown class="h-4 w-4" />
          <span class="sr-only">Toggle versions</span>
        </Button>
      </CollapsibleTrigger>
    </div>

    <CollapsibleContent class="space-y-3">
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
            <DialogDescription>
              Give your grid mapping a name to save it for later.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label for="version-name">Version Name</Label>
              <Input
                id="version-name"
                v-model="versionName"
                placeholder="e.g., Standard Grid Complete"
                @keyup.enter="handleSave"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" @click="showSaveDialog = false">
              Cancel
            </Button>
            <Button type="button" @click="handleSave" :disabled="!versionName.trim()">
              <Save class="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div v-if="versions.length === 0" class="text-xs text-muted-foreground text-center py-3">
        No saved versions yet
      </div>

      <div v-else class="space-y-2 max-h-[250px] overflow-y-auto">
        <Card v-for="version in versions" :key="version.id">
          <CardContent class="p-3 space-y-2">
            <div class="flex items-start justify-between gap-2">
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
              <Button
                variant="outline"
                size="sm"
                class="flex-1 text-xs"
                @click="$emit('load', version.id)"
              >
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
                      Are you sure you want to delete "{{ version.name }}"? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction @click="$emit('delete', version.id)">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Download, Trash2, ChevronsUpDown } from 'lucide-vue-next'
import type { GridMapperVersion } from '@/composables/useVersionManager'

defineProps<{
  versions: GridMapperVersion[]
}>()

const emit = defineEmits<{
  save: [name: string]
  load: [versionId: string]
  delete: [versionId: string]
}>()

const isOpen = ref(false)
const showSaveDialog = ref(false)
const versionName = ref('')

function handleSave() {
  if (versionName.value.trim()) {
    emit('save', versionName.value.trim())
    versionName.value = ''
    showSaveDialog.value = false
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
</script>
