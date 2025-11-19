<template>
  <TooltipProvider>
    <div class="flex gap-2">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="icon" @click="handleExport">
            <Download class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Export Grid</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <Button variant="outline" size="icon" @click="handleImportClick">
            <Upload class="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Import Grid</p>
        </TooltipContent>
      </Tooltip>

      <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Upload } from "lucide-vue-next";

const emit = defineEmits<{
  export: [];
  import: [file: File];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleExport() {
  emit("export");
}

function handleImportClick() {
  fileInputRef.value?.click();
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
