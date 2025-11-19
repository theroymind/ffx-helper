<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { ButtonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import type { SphereType } from "@/types/sphere";
import { sphereTypeInfo, sphereIcons } from "@/constants/sphere";
import { cn } from "@/lib/utils";

interface Props {
  statType: SphereType;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  showValue?: boolean;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showValue: true,
  active: false,
});

// Get icon for sphere type - either from icons or use letter for HP/MP
const getSphereIcon = (type: SphereType): { type: "image" | "text"; value: string } | null => {
  const iconUrl = sphereIcons[type];
  if (iconUrl) return { type: "image", value: iconUrl };

  return null;
};

const typeInfo = sphereTypeInfo[props.statType];
const icon = getSphereIcon(props.statType);
</script>

<template>
  <Button
    type="button"
    :variant="variant || (statType as any)"
    :size="size"
    :class="cn('justify-start', active && 'ring-2 ring-gold ring-offset-2 ring-offset-background', props.class)"
    :data-active="active"
  >
    <div class="flex h-6 w-6 items-center justify-center rounded-full shrink-0">
      <img v-if="icon?.type === 'image'" :src="icon.value" :alt="typeInfo.label" class="h-6 w-6" />
      <span v-else-if="icon?.type === 'text'" class="font-bold">
        {{ icon.value }}
      </span>
    </div>
    <slot>
      {{ typeInfo.label }}
    </slot>
  </Button>
</template>
