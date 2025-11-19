<template>
  <Card class="mx-4 mt-4">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Monster Arena Progress</CardTitle>
        <Badge v-if="hasUnsavedChanges" variant="warning">Unsaved</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <div class="text-sm text-muted-foreground">Monsters Captured</div>
          <div class="text-2xl font-bold">{{ capturedMonsters }}/{{ totalMonsters }}</div>
        </div>
        <div class="space-y-1">
          <div class="text-sm text-muted-foreground">Locations Complete</div>
          <div class="text-2xl font-bold">{{ completedLocations }}/{{ totalLocations }}</div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

defineProps<{
  hasUnsavedChanges: boolean;
  capturedMonsters: number;
  totalMonsters: number;
  completedLocations: number;
  totalLocations: number;
}>();
</script>
