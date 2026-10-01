import { test, expect } from "@playwright/test";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Artifact-level guarantee: a control surface running a stale cached app shell
// must be blocked when the server has moved to a new build, and must recover on
// reload once the shell is refreshed. This runs against the built dist served by
// the real exercise server with a real service worker, not the Vite dev server.
const PORT = 8793;
const KEY = "artifact-test-key";
const dist = resolve(process.cwd(), "dist");
const buildPath = resolve(dist, "build.json");

let server: ChildProcess | null = null;

function startServer(dataDir: string): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    server = spawn(process.execPath, ["server/exercise.mjs"], {
      env: {
        ...process.env,
        EXERCISE_PORT: String(PORT),
        EXERCISE_HOST: "127.0.0.1",
        EXERCISE_ADMIN_KEY: KEY,
        EXERCISE_DATA_DIR: dataDir,
      },
      stdio: "ignore",
    });
    const deadline = Date.now() + 15000;
    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`http://127.0.0.1:${PORT}/health`);
        if (response.ok) return resolvePromise();
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline)
        return reject(new Error("exercise server did not start"));
      setTimeout(() => void poll(), 200);
    };
    void poll();
  });
}

async function stopServer(): Promise<void> {
  if (!server) return;
  const child = server;
  server = null;
  child.kill();
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 400));
}

test("a stale control client is blocked and recovers after reload", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const original = readFileSync(buildPath, "utf8");
  const dataDir = `.exercise-data/artifact-${Date.now().toString(36)}`;
  try {
    // Build A is the artifact produced by `npm run build` before this run.
    await startServer(dataDir);

    // A field shell registers and is controlled by the service worker.
    await page.goto(
      `http://127.0.0.1:${PORT}/?role=element&room=artifact&station=s1`,
    );
    await page
      .waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
        timeout: 30000,
      })
      .catch(() => undefined);

    // Deploy build B: a real rebuild changes both the server identity and the
    // client bundle. Restart the server so it serves the new identity.
    execSync("npm run build", { stdio: "ignore" });
    const buildB = JSON.parse(readFileSync(buildPath, "utf8")).id;
    expect(buildB).not.toBe(JSON.parse(original).id);
    await stopServer();
    await startServer(dataDir);

    // The control surface must be blocked, never silently stale.
    await page.goto(`http://127.0.0.1:${PORT}/?role=trainer&room=artifact`);
    await page.getByLabel(/Trainer-Schlüssel|Trainer key/i).fill(KEY);
    await page
      .getByRole("button", { name: /^(Verbinden|Connect)$/i })
      .click();
    await expect(
      page.getByRole("heading", {
        name: /ScreenForge (wurde aktualisiert|was updated)/i,
      }),
    ).toBeVisible({ timeout: 30000 });

    // Recovery: the control shell drops the worker; reload reaches build B and
    // the gate is gone. The trainer session resumes from sessionStorage, so the
    // app is usable again without a fresh login.
    await page.getByRole("button", { name: /Neu laden|Reload/i }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Übersicht|Overview/i }),
    ).toBeVisible({ timeout: 30000 });
  } finally {
    await stopServer();
    // The mid-test `npm run build` replaced the client bundle. Restoring only
    // `build.json` would leave the bundle and the served identity mismatched for
    // later artifact tests, so rebuild once more for a consistent `dist`.
    execSync("npm run build", { stdio: "ignore" });
  }
});
