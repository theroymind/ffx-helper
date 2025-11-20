<template>
  <TooltipProvider>
    <Card v-bind="$attrs" class="p-2">
      <div class="flex gap-1">
        <template v-if="!isSharedView">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                :class="{ 'bg-accent': gridType === GridType.Standard }"
                @click="emit('update:gridType', GridType.Standard)"
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
                :class="{ 'bg-accent': gridType === GridType.Expert }"
                @click="emit('update:gridType', GridType.Expert)"
              >
                <span class="text-xs font-medium">EXP</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Expert Grid</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" class="h-8 mx-1" />
        </template>

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
  </TooltipProvider>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Image, Hash } from "lucide-vue-next";
import { GridType } from "@/domain/grid/GridType";
import { useGridSharingStore } from "@/stores/gridSharing";

const { isSharedView } = storeToRefs(useGridSharingStore());

defineProps<{
  gridType: GridType;
  displayMode: "icons" | "numbers";
}>();

const emit = defineEmits<{
  "update:gridType": [value: GridType];
  "update:displayMode": [value: "icons" | "numbers"];
}>();
</script>
