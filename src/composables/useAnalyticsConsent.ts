import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { LocalStorageKey } from "@/domain/LocalStorageKey";
import { AnalyticsConsentStatus } from "@/domain/AnalyticsConsentStatus";

const consentStatus = useLocalStorage<AnalyticsConsentStatus>(
  LocalStorageKey.AnalyticsConsent,
  AnalyticsConsentStatus.Pending,
);

export function useAnalyticsConsent() {
  const hasResponded = computed(() => consentStatus.value !== AnalyticsConsentStatus.Pending);
  const isAccepted = computed(() => consentStatus.value === AnalyticsConsentStatus.Accepted);

  function accept() {
    consentStatus.value = AnalyticsConsentStatus.Accepted;
  }

  function decline() {
    consentStatus.value = AnalyticsConsentStatus.Declined;
  }

  return {
    consentStatus,
    hasResponded,
    isAccepted,
    accept,
    decline,
  };
}
