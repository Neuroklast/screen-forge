import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto(
    `/?role=trainer&room=flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
}

test("choice tasks expose dynamic ports", async ({ page }) => {
  await login(page);
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Aktion", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption({ label: "Auswahl" });
  await page
    .getByRole("combobox", { name: "a", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "b", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".flow-canvas .react-flow")).toBeVisible();
  const startNode = page.locator(".wf-node").filter({ hasText: "Start" });
  // React Flow hides a node until it has measured it; under load that can take
  // longer than the default assertion timeout.
  await expect(startNode).toBeVisible({ timeout: 15000 });
  await startNode.click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");
});

test("flow workspace creates, connects and lints a flow", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Kein Ablauf vorhanden.")).toBeVisible();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await expect(page.locator(".wf-node")).toHaveCount(2);

  // Add an action node; the editor selects it.
  await page.getByRole("button", { name: "Aktion", exact: true }).click();
  await expect(page.locator(".wf-node")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Erfolg", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "Fehlschlag", exact: true })
    .selectOption({ index: 1 });

  // Rewire the start output to the task (accessible path, no dragging).
  await expect(page.locator(".flow-canvas .react-flow")).toBeVisible();
  const start = page.locator(".wf-node").filter({ hasText: "Start" });
  await expect(start).toBeVisible({ timeout: 15000 });
  await start.click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");

  // Counters bring their own variable; the raw panel exposes it.
  await page.getByText("Weitere Bausteine").click();
  await page.getByRole("button", { name: "Zähler erhöhen" }).click();
  await page.getByText("Rohdaten", { exact: true }).click();
  await expect(page.getByText(/count-/).first()).toBeVisible();

  await page.getByRole("button", { name: "Szenario speichern", exact: true }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    "Szenario gespeichert",
  );
});

test("migrated widget tasks are editable in the graph", async ({ page }) => {
  await login(page);
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Aktion", exact: true }).click();
  const task = page.getByRole("combobox", { name: "Aufgabe", exact: true });
  await task.selectOption({ label: "Drehregler" });
  await expect(page.getByRole("spinbutton", { name: "Regler" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Referenz" })).toBeVisible();
  await task.selectOption({ label: "Codetabelle" });
  await expect(page.getByRole("textbox", { name: "Klartext" })).toBeVisible();
  await task.selectOption({ label: "Zeitgeber" });
  await expect(page.getByRole("spinbutton", { name: "Dauer" })).toBeVisible();
  await task.selectOption({ label: "Datenblatt" });
  await expect(page.getByRole("textbox", { name: "Thema" })).toBeVisible();
});
