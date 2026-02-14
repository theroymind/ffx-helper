<template>
  <div class="flex flex-col h-screen bg-background">
    <NavigationBar />
    <RouterView class="flex-1 overflow-hidden" />
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import NavigationBar from "./components/NavigationBar.vue";
import { Toaster } from "@/components/ui/sonner";
import { useThemeStore } from "@/stores/theme";

useThemeStore();
</script>
