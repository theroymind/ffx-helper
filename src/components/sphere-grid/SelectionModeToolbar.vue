<template>
  <TooltipProvider>
    <Card v-bind="$attrs" class="p-2">
      <div class="flex gap-1">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': !selectionMode }"
              @click="selectionMode = false"
            >
              <Pointer class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Single Mode</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="{ 'bg-accent': selectionMode }"
              @click="selectionMode = true"
            >
              <MousePointer2 class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Selection Mode (Multi)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { watch } from "vue";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MousePointer2, Pointer } from "lucide-vue-next";
import { useAnalytics } from "@/composables/useAnalytics";

const selectionMode = defineModel<boolean>("selectionMode", { default: false });
const { trackSelectionModeChanged } = useAnalytics();

watch(selectionMode, (newMode) => {
  trackSelectionModeChanged(newMode ? "multi" : "single");
});
</script>
