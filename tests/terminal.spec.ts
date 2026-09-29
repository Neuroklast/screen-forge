import { test, expect } from "@playwright/test";

test("terminal goal chain completes and reports success", async ({ page }) => {
  await page.goto("/?mode=film");
  await page
    .getByRole("button", { name: "Terminal", exact: true })
    .first()
    .click();
  const input = page.getByLabel("Terminaleingabe");
  for (const command of [
    "status",
    "scan --local",
    "inspect auth",
    "login --token 07-RELAY",
  ]) {
    await input.fill(command);
    await input.press("Enter");
  }
  await expect(page.locator(".terminal-log")).toContainText("ACCESS GRANTED");
  await expect(page.locator(".terminal-header")).toContainText(
    "ABGESCHLOSSEN",
  );
});
