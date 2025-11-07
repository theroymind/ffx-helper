<template>
  <div class="w-full min-h-screen bg-background pb-20">
    <MonsterSummaryCard
      :has-unsaved-changes="hasUnsavedChanges"
      :captured-monsters="capturedMonsters"
      :total-monsters="totalMonsters"
      :completed-locations="completedLocations"
      :total-locations="totalLocations"
    />

    <div class="mt-4">
      <MonsterLocationCollapsible
        v-for="location in locationProgress"
        :key="location.location"
        :location="location.location"
        :monsters="location.monsters"
      />
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
      <div class="flex gap-3 max-w-md mx-auto">
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button class="flex-1" variant="destructive" :disabled="!hasUnsavedChanges">
              <RotateCcw class="size-4" />
              Death Reset
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Death Reset</AlertDialogTitle>
              <AlertDialogDescription>
                This will rollback all monster captures to your last saved checkpoint. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction @click="handleDeathReset"> Confirm Reset </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button class="flex-1" variant="default" @click="handleSaveCheckpoint" :disabled="!hasUnsavedChanges">
          <Save class="size-4" />
          Save Checkpoint
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue"
import { Save, RotateCcw } from "lucide-vue-next"
import { useMonsterArena } from "@/composables/useMonsterArena"
import MonsterSummaryCard from "@/components/monster-arena/MonsterSummaryCard.vue"
import MonsterLocationCollapsible from "@/components/monster-arena/MonsterLocationCollapsible.vue"
import { Button } from "@/components/ui/button"
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

const {
  hasUnsavedChanges,
  lastModifiedLocation,
  saveCheckpoint,
  deathReset,
  locationProgress,
  totalMonsters,
  capturedMonsters,
  totalLocations,
  completedLocations,
} = useMonsterArena()

function handleSaveCheckpoint() {
  saveCheckpoint()
}

function handleDeathReset() {
  deathReset()
}

onMounted(async () => {
  // Wait for next tick to ensure DOM is fully rendered
  await nextTick()

  // If there's a last modified location, scroll to it and pulse it
  if (lastModifiedLocation.value) {
    const element = document.querySelector(`[data-location="${lastModifiedLocation.value}"]`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })

      // Small delay to ensure scroll completes before animation
      setTimeout(() => {
        element.classList.add("animate-pulse-bg")

        // Remove class after animation completes (1s)
        setTimeout(() => {
          element.classList.remove("animate-pulse-bg")
        }, 1000)
      }, 300)
    }
  }
})
</script>
