<template>
  <nav class="w-full border-b px-3 md:px-6 py-3 md:py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 md:gap-8">
        <h1 class="text-lg md:text-xl text-gold font-bold">FFX Planner</h1>
        <div class="flex gap-1">
          <RouterLink to="/" custom v-slot="{ navigate, isActive: isActiveLink }">
            <Button variant="ghost" @click="navigate" :class="isActiveLink && 'bg-accent text-accent-foreground'">
              Sphere Grid
            </Button>
          </RouterLink>
          <RouterLink to="/monster-arena" custom v-slot="{ navigate, isActive: isActiveLink }">
            <Button variant="ghost" @click="navigate" :class="isActiveLink && 'bg-accent text-accent-foreground'">
              Monster Arena
            </Button>
          </RouterLink>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <Settings class="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup :model-value="themeStore.theme" @update:model-value="themeStore.setTheme">
            <DropdownMenuRadioItem value="light"> Light </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"> Dark </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Privacy</DropdownMenuLabel>
          <div class="flex items-center justify-between px-2 py-1.5">
            <span class="text-sm">Analytics</span>
            <Switch :model-value="isAccepted" @update:model-value="handleAnalyticsToggle" />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Settings } from "lucide-vue-next";
import { useThemeStore } from "@/stores/theme";
import { useAnalyticsConsent } from "@/composables/useAnalyticsConsent";
import Button from "@/components/ui/button/Button.vue";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

const themeStore = useThemeStore();
const { isAccepted, accept, decline } = useAnalyticsConsent();

function handleAnalyticsToggle(checked: boolean) {
  if (checked) {
    accept();
  } else {
    decline();
  }
}
</script>
