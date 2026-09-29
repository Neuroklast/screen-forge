import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://127.0.0.1:5173",
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
  }, { command: "node server/exercise.mjs", url: "http://127.0.0.1:8787/health", reuseExistingServer: false, env: { EXERCISE_ADMIN_KEY: "browser-test-key", EXERCISE_DATA_DIR: ".exercise-data/browser-tests" } }],
  reporter: "list",
});
