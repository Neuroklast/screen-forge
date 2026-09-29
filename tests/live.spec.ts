import { configuration, closeConfiguration } from "./helpers";
import { test, expect, type Page } from "@playwright/test";
async function select(page: Page, name: string) {
  await page
    .getByRole("button", { name: new RegExp(name) })
    .first()
    .click();
}
async function pause(page: Page) {
  const button = page.getByRole("button", { name: "Pause", exact: true });
  if (await button.count()) await button.click();
}
async function advance(page: Page, seconds: number) {
  await pause(page);
  const slider = page.getByLabel("Szenenzeit", { exact: true });
  await slider.fill(String(Number(await slider.inputValue()) + seconds));
}
test("perspective depth and autonomous target positions move and pause", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, "Analysetisch");
  const layer = page.locator(".assembly-layer").first();
  const before = await layer.getAttribute("data-depth");
  await page.waitForTimeout(250);
  expect(await layer.getAttribute("data-depth")).not.toBe(before);
  await pause(page);
  const paused = await page.locator(".spatial-assembly").innerHTML();
  await page.waitForTimeout(300);
  expect(await page.locator(".spatial-assembly").innerHTML()).toBe(paused);
  await page.getByRole("button", { name: "Run analysis", exact: true }).click();
  await expect(page.getByLabel("Process status")).toHaveAttribute(
    "data-state",
    "running",
  );
  await advance(page, 17);
  await expect(page.getByLabel("Process status")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await select(page, "Orbital Tracking");
  const r = page.locator(".auto-reticle");
  const x = await r.getAttribute("data-x");
  await expect(r).not.toHaveAttribute("data-x", x!);
  await advance(page, 3);
  await expect(page.locator(".tracking-state")).toHaveText("TRACK LOCK");
  await page.getByRole("button", { name: "Hold sensor" }).click();
  const held = await r.getAttribute("data-x");
  await page.waitForTimeout(350);
  expect(await r.getAttribute("data-x")).toBe(held);
  await page.getByRole("button", { name: "Next contact" }).click();
  await expect(page.locator(".tracking-hud h3")).toHaveText("TRACK 02");
});
test("corporate records require retrieval and diagnostics return results", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, "Konzernsystem");
  await page
    .locator(".corp-nav")
    .getByRole("button", { name: /Personnel/ })
    .click();
  await page.getByRole("button", { name: /Dr. Mara Vale/ }).click();
  await expect(page.locator(".corp-record")).toHaveCount(0);
  await expect(page.getByLabel("Process status")).toHaveAttribute(
    "data-state",
    "running",
  );
  await advance(page, 7);
  await expect(page.locator(".corp-record")).toContainText("Research director");
  await page.getByRole("button", { name: "Close record" }).click();
  await page
    .locator(".corp-nav")
    .getByRole("button", { name: /Diagnostics/ })
    .click();
  await page.getByRole("button", { name: "Run diagnostics" }).click();
  await advance(page, 13);
  await expect(page.getByLabel("Process status")).toContainText("Report D-204");
});
test("actor typing advances distinct commands, timed output and visual channels without scrollbars", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, "Netzwerkterminal");
  await page
    .locator(".os-sidebar")
    .getByRole("button", { name: /Terminal/ })
    .click();
  const input = page.getByLabel("Terminaleingabe");
  await input.fill("xxxx");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText("inspect relay");
  await advance(page, 5);
  await input.pressSequentially("asdf");
  await expect(input).toHaveValue(/^ip -br addre/);
  await input.press("Enter");
  await expect(page.locator(".terminal-visual")).toContainText(
    "INTERFACE ENUMERATION",
  );
  await advance(page, 5);
  await expect(page.getByRole("log")).toContainText("Interface snapshot saved");
  await input.pressSequentially("asdf");
  await expect(input).toHaveValue(/^ip route ge/);
  expect(
    await page
      .getByRole("log")
      .evaluate((el) => getComputedStyle(el).scrollbarWidth),
  ).toBe("none");
});
test("themes, logo and system profile survive reload and export", async ({
  page,
}) => {
  await page.goto("/");
  await configuration(page, "Firmen");
  await page
    .getByLabel("Systemvorlage", { exact: true })
    .selectOption({ label: "Cyberpunk 2077 HUD" });
  await expect(page.locator(".scene-canvas")).toHaveClass(/skin-cyberdeck/);
  await configuration(page, "Themes");
  await page
    .getByLabel("Farbtheme", { exact: true })
    .selectOption({ label: "Amber phosphor" });
  await page.getByLabel("Theme-Name", { exact: true }).fill("My film amber");
  await page
    .getByRole("button", { name: "Theme speichern", exact: true })
    .click();
  await configuration(page, "Firmen");
  await page.getByLabel("Firmenlogo hochladen").setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      await page.evaluate(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ff3355";
        ctx.fillRect(0, 0, 32, 32);
        return canvas.toDataURL("image/png").split(",")[1];
      }),
      "base64",
    ),
  });
  await expect(page.locator(".custom-brand-logo")).toBeVisible();
  await page.getByLabel("Systemprofilname").fill("My film system");
  await page
    .getByRole("button", { name: "System speichern", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".custom-brand-logo")).toBeVisible();
  await configuration(page, "Firmen");
  await page
    .getByLabel("Systemvorlage", { exact: true })
    .selectOption({ label: "Vesper Research" });
  await configuration(page, "Firmen");
  await page
    .getByLabel("Systemvorlage", { exact: true })
    .selectOption({ label: "My film system" });
  await expect(page.locator(".os-wordmark strong")).toHaveText("NIGHT CITY OS");
  await expect(page.locator(".custom-brand-logo")).toBeVisible();
  await configuration(page, "Themes");
  await page
    .getByLabel("Farbtheme", { exact: true })
    .selectOption({ label: "My film amber" });
  await expect(page.getByLabel("Theme background")).toHaveValue("#100d05");
});
test("global overlays exist on every scene, react to sliders and freeze with clock", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of [
    "Konzernsystem",
    "Netzwerkterminal",
    "Countdown",
    "Orbital Tracking",
    "Analysetisch",
  ]) {
    await closeConfiguration(page);
    await select(page, name);
    await configuration(page, "Effekte");
    await page.getByRole("slider", { name: "glow", exact: true }).fill("1");
    await expect(page.locator(".display-fx")).toHaveCount(1);
    expect(
      await page
        .locator(".display-fx")
        .evaluate((el) => getComputedStyle(el).pointerEvents),
    ).toBe("none");
  }
  await closeConfiguration(page);
  await pause(page);
  const fx = await page.locator(".display-fx").innerHTML();
  await page.waitForTimeout(150);
  expect(await page.locator(".display-fx").innerHTML()).toBe(fx);
});
test("completed OS process creates a report and messages link to processes", async ({
  page,
}) => {
  await page.goto("/");
  await select(page, "Netzwerkterminal");
  await page
    .locator(".os-sidebar")
    .getByRole("button", { name: /Messages/ })
    .click();
  await page.getByRole("button", { name: "Recover attachment" }).click();
  await advance(page, 108);
  await page.getByRole("button", { name: "Return to workspace" }).click();
  await page
    .locator(".os-sidebar")
    .getByRole("button", { name: /Filesystem/ })
    .click();
  await page.getByRole("button", { name: /^workspace/ }).click();
  await page.getByRole("button", { name: /decrypt-1.report/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Result verified and committed",
  );
});
