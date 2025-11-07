import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = useLocalStorage<Theme>('ffx-theme', 'dark')

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(newTheme: Theme | string) {
    if (newTheme === 'light' || newTheme === 'dark') {
      theme.value = newTheme
    }
  }

  return { theme, isDark, toggleTheme, setTheme }
})
