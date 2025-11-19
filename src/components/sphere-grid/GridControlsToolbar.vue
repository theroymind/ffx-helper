<template>
  <TooltipProvider>
    <Card class="p-2">
      <div class="flex gap-1">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': selectionMode }"
              @click="selectionMode = !selectionMode"
            >
              <Hand v-if="selectionMode" class="h-4 w-4" />
              <MousePointer2 v-else class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ selectionMode ? "Single Mode" : "Selection Mode" }}</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" class="h-8 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8">
              <Trash2 class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start">
            <DropdownMenuItem @click="showResetDialog = true">
              <RotateCcw class="h-4 w-4 mr-2" />
              Reset to Default
            </DropdownMenuItem>

            <DropdownMenuItem @click="showClearDialog = true" class="text-destructive focus:text-destructive">
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
          <AlertDialogAction @click="handleReset">Reset to Defaults</AlertDialogAction>
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
          <AlertDialogAction @click="handleClear">Clear Grid</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { RotateCcw, Trash2, MousePointer2, Hand } from "lucide-vue-next";

const selectionMode = defineModel<boolean>("selectionMode", { default: false });

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
