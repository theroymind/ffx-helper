<template>
  <Collapsible v-model:open="isOpen" class="border-b border-border last:border-b-0" :data-location="location">
    <CollapsibleTrigger class="w-full">
      <div class="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold">{{ location }}</span>
          <Badge :variant="badgeVariant"> {{ capturedCount }}/{{ totalCount }} </Badge>
        </div>
        <ChevronDown class="size-5 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="px-4 pb-4 space-y-2">
        <MonsterItem v-for="monster in monsters" :key="monster" :monster-name="monster" />
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronDown } from "lucide-vue-next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import MonsterItem from "./MonsterItem.vue";
import { useMonsterArena } from "@/composables/useMonsterArena";

const props = defineProps<{
  location: string;
  monsters: string[];
}>();

const { isLocationOpen, setLocationOpen, isMonsterComplete } = useMonsterArena();

const isOpen = computed({
  get() {
    return isLocationOpen(props.location);
  },
  set(value: boolean) {
    setLocationOpen(props.location, value);
  },
});

const capturedCount = computed(() => {
  return props.monsters.filter((monster) => isMonsterComplete(monster)).length;
});

const totalCount = computed(() => props.monsters.length);

const badgeVariant = computed(() => {
  if (capturedCount.value === totalCount.value) return "success";
  if (capturedCount.value > 0) return "warning";
  return "outline";
});
</script>
