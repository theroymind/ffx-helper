<template>
  <Item
    class="flex items-center justify-between gap-3 p-3 cursor-pointer"
    :class="{
      'bg-success/10 border-success': count === 10,
      'hover:bg-accent/50': count < 10,
    }"
    @click="handleClick"
  >
    <span class="text-sm font-medium flex-1">{{ monsterName }}</span>
    <div class="flex items-center gap-2 shrink-0">
      <Button size="icon-sm" variant="outline" @click.stop="handleDecrement" :disabled="count === 0">
        <Minus class="size-4" />
      </Button>
      <span
        class="text-sm font-mono w-12 text-center"
        :class="{
          'text-success font-bold': count === 10,
        }"
      >
        {{ count }}/10
      </span>
      <Button size="icon-sm" variant="outline" @click.stop="handleIncrement" :disabled="count === 10">
        <Plus class="size-4" />
      </Button>
    </div>
  </Item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Item } from '@/components/ui/item'
import { useMonsterArena } from '@/composables/useMonsterArena'

const props = defineProps<{
  monsterName: string
}>()

const { getMonsterCount, incrementMonster, decrementMonster } = useMonsterArena()

const count = computed(() => getMonsterCount(props.monsterName))

function handleIncrement() {
  incrementMonster(props.monsterName)
}

function handleDecrement() {
  decrementMonster(props.monsterName)
}

function handleClick() {
  if (count.value < 10) {
    incrementMonster(props.monsterName)
  }
}
</script>
