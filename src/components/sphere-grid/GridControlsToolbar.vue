<template>
  <TooltipProvider>
    <Card v-bind="$attrs" class="p-2">
      <div class="flex gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button data-test-id="grid-controls-trigger" variant="ghost" size="icon" class="h-8 w-8">
              <Trash2 class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem data-test-id="reset-to-default-item" @click="showResetDialog = true">
              <RotateCcw class="h-4 w-4 mr-2" />
              Reset to Default
            </DropdownMenuItem>

            <DropdownMenuItem
              data-test-id="clear-grid-item"
              @click="showClearDialog = true"
              class="text-destructive focus:text-destructive"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Clear Grid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>

    <AlertDialog v-model:open="showResetDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to Default?</AlertDialogTitle>
          <AlertDialogDescription>
            This will restore all sphere nodes to their original default values. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction data-test-id="confirm-reset" @click="handleReset">Reset to Defaults</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog v-model:open="showClearDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Grid?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all sphere nodes to empty. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction data-test-id="confirm-clear" @click="handleClear">Clear Grid</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw, Trash2 } from "lucide-vue-next";

const emit = defineEmits<{
  reset: [];
  clear: [];
}>();

const showClearDialog = ref(false);
const showResetDialog = ref(false);

function handleClear() {
  emit("clear");
  showClearDialog.value = false;
}

function handleReset() {
  emit("reset");
  showResetDialog.value = false;
}
</script>
