import type { Page } from "@playwright/test";
export async function configuration(page: Page, tab: string) {
  if (!(await page.getByRole("tab", { name: tab, exact: true }).isVisible()))
    await page.getByLabel("Konfiguration öffnen").click();
  await page.getByRole("tab", { name: tab, exact: true }).click();
}
export async function closeConfiguration(page: Page) {
  const close = page.getByLabel("Konfiguration schließen");
  if (await close.isVisible()) await close.click();
}
