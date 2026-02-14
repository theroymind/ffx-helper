import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = isCI ? "http://localhost:4173" : "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "e2e/mobile.spec.ts",
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: "e2e/mobile.spec.ts",
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      testMatch: "e2e/mobile.spec.ts",
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
      testMatch: "e2e/mobile.spec.ts",
    },
  ],
  webServer: {
    command: isCI ? "npm run preview" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
  },
});
