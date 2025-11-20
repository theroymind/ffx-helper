import { computed } from "vue";
import { defineStore } from "pinia";
import { useDark, useToggle } from "@vueuse/core";

export type Theme = "light" | "dark";

export const useThemeStore = defineStore("theme", () => {
  const isDark = useDark({
    storageKey: "ffx-theme",
    selector: "html",
    attribute: "class",
    valueDark: "dark",
    valueLight: "",
  });

  const toggleTheme = useToggle(isDark);

  const theme = computed<Theme>(() => (isDark.value ? "dark" : "light"));

  function setTheme(newTheme: Theme | string) {
    if (newTheme === "light" || newTheme === "dark") {
      isDark.value = newTheme === "dark";
    }
  }

  return { theme, isDark, toggleTheme, setTheme };
});
