import { test, expect } from "@playwright/test";

test("demo runs offline with a guided tour and no exercise socket", async ({
  page,
}) => {
  const sockets: string[] = [];
  page.on("websocket", (ws) => sockets.push(ws.url()));
  await page.goto("/?demo=1");
  await expect(page.locator(".demo-watermark")).toHaveText("DEMO — FIKTIV");
  await expect(page.locator(".demo-tour")).toBeVisible();
  await expect(page.locator(".demo-tour-step")).toHaveText("1 / 7");
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.locator(".demo-tour-step")).toHaveText("7 / 7");
  await page
    .locator(".demo-tour")
    .getByRole("button", { name: "Tour beenden", exact: true })
    .click();
  await expect(page.locator(".demo-tour")).toHaveCount(0);
  expect(sockets.filter((url) => url.includes("/exercise"))).toHaveLength(0);
});

test("demo tour stops render the seeded offline surfaces", async ({ page }) => {
  await page.goto("/?demo=1");
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Einsatz bauen" })
    .click();
  await expect(page.locator(".builder")).toBeVisible();
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Feldgerät" })
    .click();
  await expect(page.locator(".demo-stage .role-stage")).toBeVisible();
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Debrief" })
    .click();
  await expect(page.locator(".demo-panel")).toBeVisible();
});

test("demo injects feed the debrief and reset restores the seed", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Injects" })
    .click();
  await page
    .getByRole("button", { name: "Auslösen", exact: true })
    .first()
    .click();
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Debrief" })
    .click();
  await expect(page.locator(".demo-log li")).toHaveCount(1);
  await page.getByRole("button", { name: "Demo zurücksetzen" }).click();
  await expect(page.locator(".demo-log li")).toHaveCount(0);
});

test("demo graph editor opens the start node", async ({ page }) => {
  await page.goto("/?demo=1");
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Einsatz bauen" })
    .click();
  await page.getByRole("tab", { name: "Ablauf" }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  const startNode = page.locator(".wf-node").filter({ hasText: "Start" });
  await expect(startNode).toBeVisible();
  await startNode.click();
  await expect(page.getByText("Startknoten: keine Konfiguration")).toBeVisible();
});

test("kiosk demo restarts the tour after idle and exits with the PIN", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/?demo=1&kiosk=1");
  await expect(page.locator(".demo-tour-step")).toHaveText("1 / 7");
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Sandbox" })
    .click();
  await expect(page.locator(".demo-tour-step")).toHaveText("7 / 7");
  await page.clock.fastForward(90_001);
  await expect(page.locator(".demo-tour-step")).toHaveText("1 / 7");
  await page.getByRole("button", { name: "Demo verlassen" }).click();
  await page.getByLabel("Presenter-PIN").fill("2048");
  await page.getByRole("button", { name: "Bestätigen" }).click();
  await expect(page).toHaveURL(/\/$/);
});
