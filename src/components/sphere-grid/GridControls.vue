<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-gold text-base font-semibold">Grid Controls</CardTitle>
    </CardHeader>
    <CardContent>
      <Button
        :variant="selectionMode ? 'default' : 'outline'"
        class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm"
        @click="selectionMode = !selectionMode"
      >
        <component :is="selectionMode ? Hand : MousePointer2" class="h-3.5 w-3.5 mr-2" />
        {{ selectionMode ? "Paint Mode" : "Selection Mode" }}
      </Button>

      <AlertDialog v-model:open="showClearDialog">
        <AlertDialogTrigger as-child>
          <Button variant="destructive" class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm">
            <Trash2 class="h-3.5 w-3.5 mr-2" />
            Clear Grid
          </Button>
        </AlertDialogTrigger>
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

      <AlertDialog v-model:open="showResetDialog">
        <AlertDialogTrigger as-child>
          <Button variant="outline" class="w-full font-semibold shadow-md hover:shadow-lg transition-all text-sm">
            <RotateCcw class="h-3.5 w-3.5 mr-2" />
            Reset to Default
          </Button>
        </AlertDialogTrigger>
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

      <div class="flex items-center justify-center gap-2 p-2 bg-success/10 rounded-md border border-success/30">
        <Save class="h-3.5 w-3.5 text-success" />
        <span class="text-xs text-success font-medium">Changes auto-saved</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { Save, RotateCcw, Trash2, MousePointer2, Hand } from "lucide-vue-next";

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
