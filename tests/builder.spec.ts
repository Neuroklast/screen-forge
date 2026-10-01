import { test, expect } from "@playwright/test";

// The legacy MissionBuilder was removed from preparation (plan 17) and now lives
// only in the offline demo sandbox. Cover it there.
test("demo sandbox canvas adds a device and shows the linter", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page
    .locator(".demo-tour-progress")
    .getByRole("button", { name: "Einsatz bauen" })
    .click();
  await expect(page.locator(".builder")).toBeVisible();

  const cards = page.locator(".builder-card");
  const before = await cards.count();
  await expect(page.locator(".builder-linter")).toBeVisible();

  await page
    .getByRole("button", { name: "Terminal", exact: true })
    .first()
    .click();
  await expect(cards).toHaveCount(before + 1);

  // Undo restores the previous count.
  await page.locator(".builder").press("Control+z");
  await expect(cards).toHaveCount(before);
});
