import { ref, watch } from "vue";
import { useAnalyticsConsent } from "@/composables/useAnalyticsConsent";

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
const SENTRY_DSN = "https://7d48942cbb25a8a75f40a3fcc9261e1c@o4510395206205440.ingest.us.sentry.io/4510395207057408";

const isEnabled = ref(false);
const sentryInitialized = ref(false);

function injectUmamiScript(): void {
  if (document.querySelector(`script[src="${UMAMI_SRC}"]`)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = UMAMI_SRC;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  document.head.appendChild(script);
}

function initializeSentry(app?: ReturnType<typeof import("vue").createApp>): void {
  if (sentryInitialized.value) return;

  import("@sentry/vue").then((Sentry) => {
    if (app) {
      Sentry.init({
        app,
        dsn: SENTRY_DSN,
        sendDefaultPii: false,
      });
    } else {
      Sentry.init({
        dsn: SENTRY_DSN,
        sendDefaultPii: false,
      });
    }
    sentryInitialized.value = true;
  });
}

export function useAnalytics(app?: ReturnType<typeof import("vue").createApp>) {
  const { isAccepted } = useAnalyticsConsent();

  function activate() {
    if (!import.meta.env.PROD) return;

    injectUmamiScript();
    isEnabled.value = true;
    initializeSentry(app);
  }

  function initialize() {
    if (!import.meta.env.PROD) return;

    if (isAccepted.value) {
      activate();
    }

    watch(isAccepted, (accepted) => {
      if (accepted) {
        activate();
      }
    });
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
