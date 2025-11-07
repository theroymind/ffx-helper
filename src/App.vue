<template>
  <div :class="{ dark: themeStore.isDark }" class="flex flex-col h-screen bg-background">
    <NavigationBar />
    <RouterView class="flex-1 overflow-hidden" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavigationBar from './components/NavigationBar.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>
