import { test, expect } from "@playwright/test";
import { addDevice, login } from "./support/prep";

// Device Builder vertical slice: a persistent workspace with a runtime-backed
// preview, preview states, direct selection and command-based undo.
test("device builder: workspace, preview states, direct selection and undo", async ({
  page,
}) => {
  await login(page, "device-builder");
  await page.getByRole("button", { name: "Geräte", exact: true }).click();

  // Persistent three-pane workspace.
  await expect(page.locator(".workspace-shell")).toBeVisible();
  await expect(page.locator(".workspace-shell-nav")).toBeVisible();
  await expect(page.locator(".workspace-shell-canvas")).toBeVisible();
  await expect(page.locator(".workspace-shell-inspector")).toBeVisible();
  await expect(page.locator(".workspace-shell-status")).toBeVisible();

  // One-click creation from a preset; the preview renders the runtime surface.
  const initial = await page.locator(".prepare-device").count();
  await addDevice(page, "Zeitgeber");
  await expect(page.locator(".prepare-device")).toHaveCount(initial + 1);
  await expect(page.locator(".prepare-device strong").last()).toHaveText(
    /^Zeitgeber \d+$/,
  );
  await expect(
    page.locator(".device-preview-stage .training-terminal"),
  ).toBeVisible();

  // Command-based undo/redo.
  await page.keyboard.press("Control+z");
  await expect(page.locator(".prepare-device")).toHaveCount(initial);
  await page.keyboard.press("Control+y");
  await expect(page.locator(".prepare-device")).toHaveCount(initial + 1);

  // Preview states are transient and reach the renderer.
  await page.getByRole("button", { name: "Warnung", exact: true }).click();
  await expect(
    page.locator('.device-preview[data-preview-state="warning"]'),
  ).toBeVisible();
  await page.getByRole("button", { name: "Offline", exact: true }).click();
  await expect(page.locator(".device-preview-scrim")).toBeVisible();
  await page.getByRole("button", { name: "Sicher", exact: true }).click();
  await expect(page.locator(".device-preview-badge.is-safe")).toBeVisible();
  await page.getByRole("button", { name: "Normal", exact: true }).click();
  await expect(page.locator(".device-preview-scrim")).toHaveCount(0);

  // Direct selection from the preview, then inline editing.
  const anchor = page
    .locator('.device-preview-anchor[aria-label="Auswählen: Name"]')
    .first();
  await expect(anchor).toBeVisible();
  await anchor.click();
  await expect(page.locator(".device-inspector")).toContainText("Name");
  await anchor.dblclick();
  const inline = page.locator(".device-preview-inline");
  await inline.fill("Zeitgeber A");
  await inline.press("Enter");
  await expect(
    page.locator(".prepare-device").filter({ hasText: "Zeitgeber A" }),
  ).toBeVisible();

  // No long scrolling form: the inspector owns the selected device's properties.
  await page.getByRole("button", { name: "Eigenschaften", exact: true }).click();
  await expect(page.locator(".device-inspector select").first()).toBeVisible();
});

// Scene-backed surfaces render inside a scaled stage; the anchor overlay must
// measure them after the renderer settles and survive a module switch.
test("device builder: scaled scene preview exposes presentation anchors", async ({
  page,
}) => {
  await login(page, "device-builder-scene");
  await page.getByRole("button", { name: "Geräte", exact: true }).click();

  // The preview fills the canvas (no content-height collapse / clipping).
  const canvas = await page.locator(".workspace-shell-canvas").boundingBox();
  const preview = await page.locator(".device-preview").boundingBox();
  expect(preview!.height).toBeGreaterThan(canvas!.height * 0.8);

  await addDevice(page, "Intranet");
  await expect(
    page.locator(".prepare-device").filter({ hasText: "Intranet" }),
  ).toBeVisible();
  const title = page
    .locator('.device-preview-anchor[aria-label="Auswählen: Titel"]')
    .first();
  await expect(title).toBeVisible();
  await title.click();
  await expect(page.locator(".device-inspector")).toContainText("Titel");
  const field = page
    .locator(".device-inspector")
    .getByLabel("Titel", { exact: true });
  await field.fill("RELAY-07");
  await field.press("Enter");
  await expect(page.locator(".device-preview-stage")).toContainText("RELAY-07");
});
