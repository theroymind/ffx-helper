<template>
  <div>
    <SphereGridProvider :grid-type="gridType">
      <SphereGrid :grid-type="gridType" @update:grid-type="handleGridTypeChange" />
    </SphereGridProvider>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { useGridSharingStore } from "@/stores/gridSharing";
import { GridType } from "@/domain/grid/GridType";
import SphereGridProvider from "@/components/sphere-grid/SphereGridProvider.vue";
import SphereGrid from "@/components/SphereGrid.vue";

const gridSharingStore = useGridSharingStore();
const { isSharedView, sharedGridType } = storeToRefs(gridSharingStore);

const storedGridType = useLocalStorage<GridType>("ffx-sphere-grid-type", GridType.Standard);
const gridType = ref<GridType>(sharedGridType.value || storedGridType.value);

watch(sharedGridType, (newType) => {
  if (newType) {
    gridType.value = newType;
  }
});

watch(isSharedView, (isShared) => {
  if (!isShared) {
    gridType.value = storedGridType.value;
  }
});

function handleGridTypeChange(newType: GridType) {
  gridType.value = newType;
  if (!isSharedView.value) {
    storedGridType.value = newType;
  }
}
</script>
