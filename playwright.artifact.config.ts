import { defineConfig } from "@playwright/test";
// Artifact-level tests run against the built `dist/` served by the real exercise
// server, never the Vite dev server. They manage their own server process so
// they can redeploy a second build mid-test.
export default defineConfig({
  testDir: "./tests/artifact",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? {
          executablePath: process.env.CHROMIUM_PATH,
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--use-gl=angle",
            "--use-angle=swiftshader",
          ],
        }
      : {},
  },
});
