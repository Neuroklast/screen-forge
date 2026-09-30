import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto(
    `/?role=trainer&room=e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du als Nächstes tun?" }),
  ).toBeVisible();
}

test("workflow pilot links, challenges the code and shows diagnostics", async ({
  page,
  browser,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Device Link & Diagnostics", exact: false })
    .click();
  await page.getByLabel("Szenarioname", { exact: true }).fill("Link test");
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Link test");

  await page.getByRole("button", { name: "Geräte vorbereiten", exact: true }).click();
  const card = page
    .locator(".device-card")
    .filter({ has: page.getByRole("heading", { name: "Device Console", exact: true }) });
  await card.getByRole("button", { name: "QR-Code anzeigen" }).click();
  const url = await page
    .getByRole("link", { name: "Gerätelink öffnen" })
    .getAttribute("href");
  const ctx = await browser.newContext();
  const device = await ctx.newPage();
  await device.goto(url!);
  try {
    await page.getByRole("button", { name: "Übung starten", exact: true }).last().click();
    await device.getByRole("button", { name: "Connect device" }).click();
    await expect(device.getByText("Enter access code")).toBeVisible();

    for (const digit of ["0", "0", "0", "0"])
      await device.getByRole("button", { name: digit, exact: true }).click();
    await device.getByRole("button", { name: "OK", exact: true }).click();
    await expect(
      device.getByText("INPUT REJECTED — TRY AGAIN"),
    ).toBeVisible();

    for (const digit of ["7", "3", "9", "2"])
      await device.getByRole("button", { name: digit, exact: true }).click();
    await device.getByRole("button", { name: "OK", exact: true }).click();
    await expect(device.getByText("SELF TEST")).toBeVisible();
    await expect(device.getByText("NOMINAL")).toBeVisible();
  } finally {
    await ctx.close();
  }
});
