import { expect, type Page } from "@playwright/test";
export async function osApp(page: Page, name: string) {
  const item = page
    .locator(".os-sidebar")
    .getByRole("button", { name: new RegExp(name) });
  if (!(await item.isVisible()))
    await page.getByRole("button", { name: "Start menu" }).click();
  await item.click();
}
export async function configuration(page: Page, tab: string) {
  const panel = page.locator(".config-menu");
  const target = page.getByRole("tab", { name: tab, exact: true });
  // The open button toggles, so a stale visibility check could close an
  // already open panel. Retry until the panel is reliably open, then click.
  await expect(async () => {
    if (!(await panel.isVisible()))
      await page.getByLabel("Konfiguration öffnen").click();
    await expect(panel).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await target.click();
}
export { boxesOverlap } from "../src/core/layout";
export async function closeConfiguration(page: Page) {
  const close = page.getByLabel("Konfiguration schließen");
  if (await close.isVisible()) await close.click();
}
