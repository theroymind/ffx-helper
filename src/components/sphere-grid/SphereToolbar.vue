<template>
  <TooltipProvider>
    <Card v-bind="$attrs" class="p-2 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <div data-test-id="sphere-selector" class="flex gap-1 flex-nowrap">
        <Tooltip v-for="type in selectableTypes" :key="type">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :data-test-id="`sphere-type-${type}`"
              :class="{ 'ring-2 ring-gold ring-offset-2 ring-offset-background': modelValue === type }"
              @click="modelValue = type"
            >
              <img
                v-if="sphereIcons[type]"
                :src="sphereIcons[type]"
                :alt="sphereTypeInfo[type].label"
                class="h-5 w-5"
              />
              <span v-else class="text-xs font-medium">{{ sphereTypeInfo[type].shortLabel }}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ sphereTypeInfo[type].label }}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </Card>
  </TooltipProvider>
</template>

<script setup lang="ts">
import type { SphereType } from "@/domain/grid/SphereType";
import { sphereTypeInfo, sphereIcons } from "@/constants/sphere";
import Button from "@/components/ui/button/Button.vue";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const modelValue = defineModel<SphereType>({ required: true });

const selectableTypes = [
  ...Object.keys(sphereTypeInfo).filter((type) => type !== "locked" && type !== "empty" && type !== "ability"),
  "empty",
] as SphereType[];
</script>
