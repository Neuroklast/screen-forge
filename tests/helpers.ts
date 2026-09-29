import type { Page } from "@playwright/test";
export async function osApp(page: Page, name: string) {
  const item = page
    .locator(".os-sidebar")
    .getByRole("button", { name: new RegExp(name) });
  if (!(await item.isVisible()))
    await page.getByRole("button", { name: "Start menu" }).click();
  await item.click();
}
export async function configuration(page: Page, tab: string) {
  if (!(await page.getByRole("tab", { name: tab, exact: true }).isVisible()))
    await page.getByLabel("Konfiguration öffnen").click();
  await page.getByRole("tab", { name: tab, exact: true }).click();
}
export { boxesOverlap } from "../src/core/layout";
export async function closeConfiguration(page: Page) {
  const close = page.getByLabel("Konfiguration schließen");
  if (await close.isVisible()) await close.click();
}
