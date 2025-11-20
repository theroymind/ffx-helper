<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle class="text-gold text-xl font-bold flex items-center gap-2">
          <Info class="h-5 w-5" />
          How to Use
        </DialogTitle>
      </DialogHeader>
      <div class="space-y-4">
        <ul class="space-y-2 text-sm">
          <li class="flex gap-2">
            <span class="text-gold font-bold">•</span>
            <span><strong class="text-sphere-ability">Pink</strong> = Ability nodes which can't be edited/erased</span>
          </li>
          <li class="flex gap-2">
            <span class="text-gold font-bold">•</span>
            <span>Auto-saves to local storage</span>
          </li>
          <li class="flex gap-2">
            <span class="text-gold font-bold">•</span>
            <span>Don't forget to export to avoid losing all your data</span>
          </li>
        </ul>

        <Separator />

        <div class="space-y-3">
          <h3 class="font-semibold text-sm">Import / Export</h3>
          <p class="text-xs text-muted-foreground">
            Import and export only work on the currently viewed sphere grid type ({{
              gridType === "standard" ? "Standard" : "Expert"
            }}).
          </p>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="flex-1" @click="handleExport">
              <Upload class="h-4 w-4 mr-2" />
              Export Grid
            </Button>
            <Button variant="outline" size="sm" class="flex-1" @click="handleImportClick">
              <Download class="h-4 w-4 mr-2" />
              Import Grid
            </Button>
          </div>
        </div>

        <Separator />

        <div class="space-y-3">
          <Button variant="outline" size="sm" class="w-full" @click="handleTakeTour">
            <Info class="h-4 w-4 mr-2" />
            Take Tour
          </Button>
        </div>
      </div>
    </DialogContent>
    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, Upload, Download } from "lucide-vue-next";
import type { GridType } from "@/composables/useSphereData";

const isOpen = defineModel<boolean>("open", { required: true });

defineProps<{
  gridType: GridType;
}>();

const emit = defineEmits<{
  export: [];
  import: [file: File];
  takeTour: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleExport() {
  emit("export");
}

function handleImportClick() {
  fileInputRef.value?.click();
}

function handleTakeTour() {
  isOpen.value = false;
  emit("takeTour");
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    emit("import", file);
    input.value = "";
  }
}
</script>
