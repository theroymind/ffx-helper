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

const isEnabled = ref(false);

export function useAnalytics() {
  function initialize() {
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
