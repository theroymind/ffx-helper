import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

const testSafeConfig = {
  ...viteConfig,
  plugins: Array.isArray(viteConfig.plugins)
    ? viteConfig.plugins.filter((p) => p && typeof p === "object" && "name" in p && p.name !== "sentry-vite-plugin")
    : viteConfig.plugins,
};

export default mergeConfig(
  testSafeConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test-setup.ts"],
      exclude: [...configDefaults.exclude, "e2e/**"],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  }),
);
