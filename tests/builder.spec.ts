import { test, expect } from "@playwright/test";

test("builder adds a device and shows the linter", async ({ page }) => {
  await page.goto(`/?role=trainer&room=builder-${Date.now()}`);
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page
    .getByRole("button", { name: "Szenario bearbeiten", exact: true })
    .click();

  const cards = page.locator(".builder-card");
  const before = await cards.count();
  await expect(page.locator(".builder-linter")).toBeVisible();

  await page.getByRole("button", { name: "Terminal", exact: true }).first().click();
  await expect(cards).toHaveCount(before + 1);

  // Undo restores the previous count.
  await page.locator(".builder").press("Control+z");
  await expect(cards).toHaveCount(before);
});
