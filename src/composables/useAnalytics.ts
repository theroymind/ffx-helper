import { ref } from "vue";

export enum AnalyticsEvent {
  SphereModified = "sphere_modified",
  GridReset = "grid_reset",
  GridShared = "grid_shared",
  GridImported = "grid_imported",
  SelectionModeChanged = "selection_mode_changed",
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}

const UMAMI_SRC = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "7740cd5b-03fa-4302-b3cb-6d35ac534828";

const isEnabled = ref(false);

function injectUmamiScript(): void {
  const script = document.createElement("script");
  script.defer = true;
  script.src = UMAMI_SRC;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  document.head.appendChild(script);
}

export function useAnalytics() {
  function initialize() {
    if (!import.meta.env.PROD) return;

    injectUmamiScript();

    if (typeof window !== "undefined" && window.umami) {
      isEnabled.value = true;
    }
  }

  function trackEvent(eventName: AnalyticsEvent, properties?: Record<string, string | number>) {
    if (!isEnabled.value || !window.umami) return;

    try {
      window.umami.track(eventName, properties);
    } catch (error) {
      console.warn("Analytics tracking failed:", error);
    }
  }

  function trackSphereModification(sphereType: string, value: number) {
    trackEvent(AnalyticsEvent.SphereModified, {
      type: sphereType,
      value,
    });
  }

  function trackGridReset() {
    trackEvent(AnalyticsEvent.GridReset);
  }

  function trackGridShared(method: "link" | "export") {
    trackEvent(AnalyticsEvent.GridShared, { method });
  }

  function trackGridImported() {
    trackEvent(AnalyticsEvent.GridImported);
  }

  function trackSelectionModeChanged(mode: string) {
    trackEvent(AnalyticsEvent.SelectionModeChanged, { mode });
  }

  return {
    initialize,
    trackEvent,
    trackSphereModification,
    trackGridReset,
    trackGridShared,
    trackGridImported,
    trackSelectionModeChanged,
  };
}
