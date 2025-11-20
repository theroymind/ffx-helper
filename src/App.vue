<template>
  <div class="flex flex-col h-screen bg-background">
    <NavigationBar />
    <RouterView class="flex-1 overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import NavigationBar from "./components/NavigationBar.vue";
import { useThemeStore } from "@/stores/theme";
import { useAnalytics } from "@/composables/useAnalytics";

useThemeStore();

const { initialize } = useAnalytics();

onMounted(() => {
  initialize();
});
</script>
