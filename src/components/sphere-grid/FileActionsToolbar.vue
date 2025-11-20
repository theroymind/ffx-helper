<template>
  <TooltipProvider>
    <Card v-bind="$attrs" class="p-2">
      <div class="flex gap-1">
        <Tooltip v-if="!isSharedView">
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleImportClick">
              <Download class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import Grid</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleExport">
              <Upload class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export Grid</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip v-if="!isSharedView">
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleShare">
              <Share2 class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy Share URL</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>

    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Upload, Share2 } from "lucide-vue-next";
import { useGridSharingStore } from "@/stores/gridSharing";

const { isSharedView } = storeToRefs(useGridSharingStore());

const emit = defineEmits<{
  export: [];
  import: [file: File];
  share: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

function handleExport() {
  emit("export");
}

function handleImportClick() {
  fileInputRef.value?.click();
}

function handleShare() {
  emit("share");
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
