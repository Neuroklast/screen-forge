import { test, expect } from "@playwright/test";

test("choice tasks expose dynamic ports", async ({ page }) => {
  await page.goto(
    `/?role=trainer&room=choice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page
    .getByRole("button", { name: "Szenario bearbeiten", exact: true })
    .click();
  await page.getByRole("tab", { name: "Ablauf" }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();

  await page.getByRole("button", { name: "Aufgabe", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption("choice");
  await page
    .getByRole("combobox", { name: "a", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "b", exact: true })
    .selectOption({ index: 1 });
  const startNode = page.locator(".wf-node").filter({ hasText: "Start" });
  await expect(startNode).toBeVisible();
  await startNode.click();
  await page
    .getByRole("combobox", { name: "out", exact: true })
    .selectOption({ index: 2 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");
});

test("workflow editor creates, connects and lints a flow", async ({ page }) => {
  await page.goto(
    `/?role=trainer&room=flow-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page
    .getByRole("button", { name: "Szenario bearbeiten", exact: true })
    .click();

  await page.getByRole("tab", { name: "Ablauf" }).click();
  await expect(page.getByText("Kein Ablauf vorhanden.")).toBeVisible();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await expect(page.locator(".wf-node")).toHaveCount(2);

  // Add a task node; the editor selects it.
  await page.getByRole("button", { name: "Aufgabe", exact: true }).click();
  await expect(page.locator(".wf-node")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "success", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "failure", exact: true })
    .selectOption({ index: 1 });

  // Rewire the start output to the task (accessible path, no dragging).
  await page.locator(".wf-node").filter({ hasText: "Start" }).click();
  await page
    .getByRole("combobox", { name: "out", exact: true })
    .selectOption({ index: 2 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");

  // Counters bring their own variable.
  await page.getByRole("button", { name: "Zähler erhöhen" }).click();
  await expect(page.locator(".wf-variable")).toHaveCount(1);

  await page.getByRole("button", { name: "Szenario speichern", exact: true }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    "Szenario gespeichert",
  );
});

test("migrated widget tasks are editable in the graph", async ({ page }) => {
  await page.goto(
    `/?role=trainer&room=widget-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page
    .getByRole("button", { name: "Szenario bearbeiten", exact: true })
    .click();
  await page.getByRole("tab", { name: "Ablauf" }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Aufgabe", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption("dial");
  await expect(page.getByRole("spinbutton", { name: "Regler" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Referenz" })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption("code-table");
  await expect(page.getByRole("textbox", { name: "Klartext" })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption("timer");
  await expect(page.getByRole("spinbutton", { name: "Dauer" })).toBeVisible();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption("datasheet");
  await expect(page.getByRole("textbox", { name: "Thema" })).toBeVisible();
});
