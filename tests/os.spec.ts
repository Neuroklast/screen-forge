import { configuration, closeConfiguration, osApp } from "./helpers";
import { test, expect, type Page } from "@playwright/test";
async function enter(page: Page) {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: /Operating System/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.getByLabel("Szenenzeit", { exact: true }).fill("0");
}
async function app(page: Page, name: string) {
  await osApp(page, name);
}
async function seek(page: Page, time: number) {
  await page.getByLabel("Szenenzeit", { exact: true }).fill(String(time));
}
test("filesystem, personnel, 4D projection and real local command parsing", async ({
  page,
}) => {
  await enter(page);
  await app(page, "Filesystem");
  await page.getByRole("button", { name: /sector-07.fragment/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Recover archive");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await app(page, "Personnel");
  await page.getByRole("button", { name: /Elias Ward/ }).click();
  await expect(page.locator(".os-personnel-record")).toContainText(
    "Relay operations",
  );
  await app(page, "4D projection");
  await page.getByRole("slider", { name: "XW Rotation" }).fill("2");
  await expect(page.locator(".os-hypercube line")).toHaveCount(32);
  await app(page, "Terminal");
  await configuration(page, "Eingaben");
  await page.getByLabel("Vorbereitetes Tippen").uncheck();
  await closeConfiguration(page);
  await page
    .getByLabel("Terminal input")
    .fill("cat /workspace/operator.notes");
  await page.getByLabel("Terminal input").press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Inspect the relay topology",
  );
});
test("long operation seeks both directions, pauses and resets deterministically", async ({
  page,
}) => {
  await enter(page);
  await app(page, "Sequences");
  await page.getByRole("button", { name: "Run full operation" }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await seek(page, 239);
  await expect(page.locator(".os-sequence-display h3")).toHaveText(
    "Containment exception",
  );
  await expect(page.locator(".cyber-os")).toHaveClass(/os-warning/);
  await seek(page, 20);
  await expect(page.locator(".os-sequence-display h3")).toHaveText(
    "Memory surface inspection",
  );
  await expect(page.locator(".cyber-os")).not.toHaveClass(/os-warning/);
  const before = await page.locator(".os-phase-visual").innerHTML();
  await page.waitForTimeout(120);
  expect(await page.locator(".os-phase-visual").innerHTML()).toBe(before);
  await page.getByRole("button", { name: "Take zurücksetzen" }).click();
  await expect(page.locator(".os-sequence")).toHaveCount(0);
  await expect(page.locator(".os-task-time")).toContainText("00:00:00");
});
test("three slider gates, cancelled scan, successful scan and boot handover", async ({
  page,
}) => {
  await enter(page);
  await page.getByRole("button", { name: "Sitzung sperren" }).click();
  const slider = page.getByLabel("Align access");
  for (let i = 0; i < 3; i++) {
    await slider.focus();
    await slider.press("End");
  }
  await expect(page.getByLabel("Fingerabdruck scannen")).toBeVisible();
  const sensor = page.getByLabel("Fingerabdruck scannen");
  await sensor.focus();
  await page.keyboard.down(" ");
  await page.waitForTimeout(200);
  await page.keyboard.up(" ");
  await expect(sensor).toContainText("HOLD CONTACT SENSOR");
  await sensor.focus();
  await page.keyboard.down(" ");
  await expect(page.locator(".os-lock-screen")).toHaveCount(0, {
    timeout: 6000,
  });
  await page.keyboard.up(" ");
  await expect(page.locator(".os-sequence h2")).toHaveText("Cold start");
});
test("stage return button does not intercept OS lock button", async ({
  page,
}) => {
  await enter(page);
  await page.getByRole("button", { name: "Nur Ausgabe" }).click();
  await page.getByRole("button", { name: "Sitzung sperren" }).click();
  await expect(page.locator(".os-lock-screen")).toBeVisible();
});
