import { computed } from "vue";
import { useLocalStorage } from "@vueuse/core";

export enum AnalyticsConsentStatus {
  Pending = "pending",
  Accepted = "accepted",
  Declined = "declined",
}

const CONSENT_KEY = "ffx-analytics-consent";

const consentStatus = useLocalStorage<AnalyticsConsentStatus>(CONSENT_KEY, AnalyticsConsentStatus.Pending);

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
