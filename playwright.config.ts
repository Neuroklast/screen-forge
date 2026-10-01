import { defineConfig } from "@playwright/test";
// Each run gets a fresh exercise data dir: the server persists rooms, and a
// fixed dir accumulates across runs until the room limit (100) is hit.
const exerciseDataDir = `.exercise-data/browser-tests-${Date.now().toString(36)}`;
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:5173",
    // The app defaults to English; the existing suite asserts the German
    // chrome, so pin the locale to German for these tests.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://127.0.0.1:5173",
          localStorage: [{ name: "screenforge.locale", value: "de" }],
        },
      ],
    },
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
    viewport: { width: 1600, height: 1000 },
  },
  webServer: [{
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  }, { command: "node server/exercise.mjs", url: "http://127.0.0.1:8787/health", reuseExistingServer: false, env: { EXERCISE_ADMIN_KEY: "browser-test-key", EXERCISE_DATA_DIR: exerciseDataDir } }],
  reporter: "list",
});
