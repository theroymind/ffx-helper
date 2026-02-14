<template>
  <AlertDialog :open="isOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="text-gold">Help Improve FFX Planner?</AlertDialogTitle>
        <AlertDialogDescription>
          We use anonymous analytics (Umami) and error tracking (Sentry) to improve the app. No personal data is
          collected. You can change this anytime in Settings.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleDecline">No Thanks</AlertDialogCancel>
        <AlertDialogAction @click="handleAccept">Allow Analytics</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAnalyticsConsent } from "@/composables/useAnalyticsConsent";

const isOpen = defineModel<boolean>("open", { required: true });

const { accept, decline } = useAnalyticsConsent();

function handleAccept() {
  accept();
  isOpen.value = false;
}

function handleDecline() {
  decline();
  isOpen.value = false;
}
</script>
