<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-gold text-base font-semibold">Sphere Focus</CardTitle>
      <CardDescription>Pick the stat you want to paint on the grid.</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-2 grid-cols-1 xl:grid-cols-2">
      <StatButton
        v-for="type in selectableTypes"
        :key="type"
        :stat-type="type"
        :active="modelValue === type"
        @click="modelValue = type"
      />
    </CardContent>
  </Card>
</template>
<script setup lang="ts">
import type { SphereType } from "@/domain/grid/SphereType";
import { sphereTypeInfo } from "@/constants/sphere";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatButton } from ".";

const modelValue = defineModel<SphereType>({ required: true });

const selectableTypes = [
  ...Object.keys(sphereTypeInfo).filter((type) => type !== "locked" && type !== "empty" && type !== "ability"),
  "empty",
] as SphereType[];
</script>
