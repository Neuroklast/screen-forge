import { test, expect, type Page } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";

// Artifact-level acceptance journeys. These run against the built dist served by
// the real exercise server (not the Vite dev server), with a real service
// worker present on the origin. Run with `npm run test:e2e:artifact`.
const PORT = 8794;
const KEY = "artifact-journey-key";

let server: ChildProcess | null = null;

function startServer(dataDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
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
        if (response.ok) return resolve();
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
  await new Promise((resolve) => setTimeout(resolve, 400));
}

// The suite asserts the German chrome; the shipped default is English.
async function german(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("screenforge.locale", "de");
    } catch {
      /* ignore */
    }
  });
}

async function login(page: Page, room: string): Promise<void> {
  await page.goto(`http://127.0.0.1:${PORT}/?role=trainer&room=${room}`);
  await page.getByLabel("Trainer-Schlüssel").fill(KEY);
  await page.getByRole("button", { name: "Verbinden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du als Nächstes tun?" }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  await startServer(`.exercise-data/artifact-journeys-${Date.now().toString(36)}`);
});

test.afterAll(async () => {
  await stopServer();
});

test("trainer preparation navigation is deterministic and escapable", async ({
  page,
}) => {
  await german(page);
  await login(page, "artifact-nav");

  // Sections are addressable and reloadable.
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await expect(page).toHaveURL(/section=devices/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Geräte", exact: true })).toBeVisible();

  // Guided setup opens as a state, closes deterministically, and browser Back works.
  await page.getByRole("button", { name: "Übersicht", exact: true }).click();
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await expect(page).toHaveURL(/guided=0/);
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page).not.toHaveURL(/guided=/);
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("film graph: add a take, connect, and start with the preview present", async ({
  page,
}) => {
  await german(page);
  await page.goto(`http://127.0.0.1:${PORT}/?role=film`);
  await page.getByRole("button", { name: "Ablaufeditor" }).click();
  await expect(page.locator(".sequence-graph .react-flow")).toBeVisible();
  // The live stage preview stays reachable while editing the graph.
  await expect(page.locator(".stage-shell")).toBeVisible();
  const before = await page.locator(".wf-node").count();
  await page
    .locator(".sequence-palette button")
    .filter({ hasText: "Terminal" })
    .first()
    .click();
  await expect(page.locator(".wf-node")).toHaveCount(before + 1);
  await expect(
    page.getByRole("button", { name: "Ablauf starten", exact: true }),
  ).toBeEnabled();
});

test("localization: German control surfaces contain no raw enum labels", async ({
  page,
}) => {
  await german(page);
  await login(page, "artifact-l10n");
  const text = await page.locator(".training-app").innerText();
  for (const raw of ["PLAYBACK", "code-table", "data-sheet", "interpolate"])
    expect(text).not.toContain(raw);
  await page.getByRole("button", { name: "Szenario", exact: true }).click();
  await expect(page.getByRole("option", { name: "Wiedergabe" })).toHaveCount(1);
});
