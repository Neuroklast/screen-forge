import {
  configuration,
  closeConfiguration,
  osApp,
  boxesOverlap,
} from "./helpers";
import { test, expect } from "@playwright/test";
test("all scenes render and operator controls reset a take", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?mode=film");
  for (const title of [
    "Konzernsystem",
    "Netzwerkterminal",
    "Countdown",
    "Orbital Tracking",
    "Analysetisch",
    "Codeschloss",
    "Türsteuerung",
    "Medizin",
    "Kamera",
    "Funk",
    "Schieber",
  ]) {
    await page
      .getByRole("button", { name: new RegExp(title) })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator(".scene-inner")).toBeVisible();
  }
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".transport-time")).not.toContainText("00:00:00");
  await page.getByRole("button", { name: "Take zurücksetzen" }).click();
  await expect(page.locator(".transport-time")).toContainText("00:00:00");
  expect(errors).toEqual([]);
});
test("warhead controls, tty and arming rail do not overlap", async ({
  page,
}) => {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: /Countdown/ })
    .first()
    .click();
  const controls = await page.locator(".warhead-controls").boundingBox();
  const tty = await page.locator(".warhead-tty").boundingBox();
  const rail = await page.locator(".arming-rail").boundingBox();
  const bar = await page.locator(".phase-bar").first().boundingBox();
  expect(controls).toBeTruthy();
  expect(tty).toBeTruthy();
  expect(rail).toBeTruthy();
  expect(bar).toBeTruthy();
  expect(boxesOverlap(controls!, tty!)).toBe(false);
  expect(boxesOverlap(controls!, rail!)).toBe(false);
  expect(boxesOverlap(tty!, rail!)).toBe(false);
  expect(
    bar!.x >= controls!.x - 1 &&
      bar!.x + bar!.width <= controls!.x + controls!.width + 1,
  ).toBe(true);
});
test("prepared input, preset export, stage escape and persistence", async ({
  page,
}) => {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: /Netzwerkterminal/ })
    .first()
    .click();
  await osApp(page, "Terminal");
  await page.getByLabel("Terminaleingabe").fill("abcdef");
  await expect(page.getByLabel("Terminaleingabe")).toHaveValue("inspec");
  await page.getByLabel("Terminaleingabe").fill("x".repeat(100));
  await page.getByLabel("Terminaleingabe").press("Enter");
  await expect(page.locator(".console-lines")).toContainText(
    "analysis complete",
  );
  await configuration(page, "Inhalt");
  await page.getByLabel("Titel", { exact: true }).fill("TEST SYSTEM");
  await page.reload();
  await expect(page.locator(".os-wordmark strong")).toHaveText("TEST SYSTEM");
  await configuration(page, "Inhalt");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportieren" }).click();
  expect((await download).suggestedFilename()).toBe(
    "screenforge-terminal.json",
  );
  await closeConfiguration(page);
  await page.getByRole("button", { name: "Nur Ausgabe" }).click();
  await expect(page.locator(".studio")).toHaveClass(/is-clean/);
  await page.locator("body").click({ position: { x: 3, y: 3 } });
  await page.keyboard.press("Escape");
  await expect(page.locator(".studio")).not.toHaveClass(/is-clean/);
});
test("countdown stops at zero and reset restores original time", async ({
  page,
}) => {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: /Countdown/ })
    .first()
    .click();
  await configuration(page, "Eingaben");
  await page.getByLabel("Dauer in Sekunden").fill("1");
  await closeConfiguration(page);
  await page.getByRole("button", { name: "Abspielen", exact: true }).click();
  await expect(page.locator(".countdown-digits")).toHaveText("00:00:00", {
    timeout: 4000,
  });
  await expect(
    page.getByRole("button", { name: "Abspielen", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Take zurücksetzen" }).click();
  await expect(page.locator(".countdown-digits")).toHaveText("00:00:01");
});
test("multitouch scale, rotate and cancel remain finite", async ({ page }) => {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: /Analysetisch/ })
    .first()
    .click();
  const surface = page.locator(".gesture-surface");
  await surface.evaluate((el) => {
    const send = (type: string, id: number, x: number, y: number) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId: id,
          pointerType: "touch",
          clientX: x,
          clientY: y,
          button: 0,
          bubbles: true,
        }),
      );
    el.setPointerCapture = () => {};
    send("pointerdown", 1, 100, 100);
    send("pointerdown", 2, 200, 100);
    send("pointermove", 2, 250, 150);
    send("pointercancel", 2, 250, 150);
    send("pointermove", 1, 120, 130);
    send("pointerup", 1, 120, 130);
  });
  await expect(page.locator(".gesture-content")).not.toHaveAttribute(
    "style",
    /scale\(1\)/,
  );
  const transform = await page
    .locator(".gesture-content")
    .getAttribute("style");
  expect(transform).not.toContain("NaN");
  expect(transform).not.toContain("scale(1)");
});
test("mobile layout and preset validation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?mode=film");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .locator('input[type=file][accept=".json,application/json"]')
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":99}'),
    });
  await expect(page.locator(".toast")).toContainText("Ungültiges Preset");
});
