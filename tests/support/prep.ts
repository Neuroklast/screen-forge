import { expect, type Page } from "@playwright/test";

// Shared preparation helpers. The guided surface is an adaptive interview, so
// tests create a scenario by choosing a domain, not by walking wizard steps.

export const DOMAIN = {
  sar: "Search & Rescue",
  medical: "Medizinischer Einsatz",
  technical: "Technischer Zwischenfall",
  disposal: "Entschärfungsszenario",
  film: "Filmsequenz",
  free: "Freies Szenario",
} as const;

export async function login(page: Page, room: string) {
  await page.goto(
    `/?role=trainer&room=${room}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du als Nächstes tun?" }),
  ).toBeVisible();
}

export async function createGuided(page: Page, domain: string, name: string) {
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du bauen?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: domain, exact: true }).click();
  await page.getByLabel("Szenarioname", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Szenario anlegen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
}

export async function save(page: Page) {
  await page
    .getByRole("button", { name: "Szenario speichern", exact: true })
    .click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    "Szenario gespeichert",
  );
}

export async function loadTemplate(page: Page, template: string, name: string) {
  await page
    .getByRole("button", { name: "Vorlage laden", exact: false })
    .click();
  await page
    .locator(".gallery-card")
    .filter({ hasText: template })
    .getByRole("button", { name: "Laden", exact: true })
    .click();
  await page.getByLabel("Szenarioname", { exact: true }).fill(name);
  await save(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
}

// The Device Builder creates a device with one click on a preset in the "Add
// device" menu.
export async function openAddDevice(page: Page) {
  await page
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();
}

export async function addDevice(page: Page, label: string) {
  const preset = page.getByRole("button", { name: label, exact: true });
  if ((await preset.count()) === 0) await openAddDevice(page);
  // Less common presets live behind "More…".
  if ((await preset.count()) === 0)
    await page.getByRole("button", { name: "Mehr…", exact: true }).click();
  await preset.click();
}
