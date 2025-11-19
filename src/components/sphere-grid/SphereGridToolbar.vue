<template>
  <TooltipProvider>
    <Card class="p-2">
      <div class="flex gap-1">
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

        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="handleImportClick">
              <Download class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import Grid</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" class="h-8 mx-1" />

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': gridType === 'standard' }"
              @click="emit('update:gridType', 'standard')"
            >
              <span class="text-xs font-medium">STD</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Standard Grid</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': gridType === 'expert' }"
              @click="emit('update:gridType', 'expert')"
            >
              <span class="text-xs font-medium">EXP</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Expert Grid</p>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" class="h-8 mx-1" />

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': displayMode === 'icons' }"
              @click="emit('update:displayMode', 'icons')"
            >
              <Image class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show Icons</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': displayMode === 'numbers' }"
              @click="emit('update:displayMode', 'numbers')"
            >
              <Hash class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Show Numbers</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>

    <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Download, Upload, Image, Hash } from "lucide-vue-next";
import type { GridType } from "@/composables/useSphereData";

defineProps<{
  gridType: GridType;
  displayMode: "icons" | "numbers";
}>();

const emit = defineEmits<{
  export: [];
  import: [file: File];
  "update:gridType": [value: GridType];
  "update:displayMode": [value: "icons" | "numbers"];
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
