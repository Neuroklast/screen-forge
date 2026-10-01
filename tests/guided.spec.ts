import { test, expect, type Page } from "@playwright/test";
import { login } from "./support/prep";

async function startGuided(page: Page, domain: string) {
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du bauen?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: domain, exact: true }).click();
}

async function apply(page: Page, reason: string) {
  const suggestion = page.locator(".guided-suggestion").filter({ hasText: reason });
  await expect(suggestion).toBeVisible();
  await suggestion.getByRole("button", { name: "Übernehmen", exact: true }).click();
}

// The representative guided journey: answer a question, apply the suggestion,
// see the real graph grow, then change the earlier answer and reconcile.
test("guided interview builds a search flow and reconciles a changed answer", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await login(page, "guided-sar");
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du bauen?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Search & Rescue", exact: true }).click();

  // Location unknown -> a search phase is suggested.
  await page.getByRole("button", { name: "Nein", exact: true }).click();
  const suggestion = page
    .locator(".guided-suggestion")
    .filter({ hasText: "Suchphase" });
  await expect(suggestion).toBeVisible();
  await suggestion.getByRole("button", { name: "Übernehmen", exact: true }).click();

  // The real graph grows next to the interview.
  await expect(page.locator(".guided-canvas .wf-node").first()).toBeVisible();

  // Changing the earlier answer marks the generated content for reconciliation.
  const locationRow = page
    .locator(".guided-answered li")
    .filter({ hasText: "Standort" });
  await locationRow.getByRole("button", { name: "Ändern", exact: true }).click();
  await page.getByRole("button", { name: "Ja, genau", exact: true }).click();

  const reconcile = page.locator(".guided-reconcile");
  await expect(reconcile).toBeVisible();
  await expect(reconcile).toContainText("Änderungen prüfen");
  const removeButtons = reconcile.getByRole("button", {
    name: "Entfernen",
    exact: true,
  });
  const before = await removeButtons.count();
  expect(before).toBeGreaterThan(0);
  await removeButtons.first().click();
  await expect(removeButtons).toHaveCount(before - 1);
});

test("guided technical incident adds access work and a diagnostics flow", async ({
  page,
}) => {
  await login(page, "guided-tech");
  await startGuided(page, "Technischer Zwischenfall");

  // Locked access first (group order), then the known cause.
  await page.getByRole("button", { name: "Zugang verriegelt", exact: true }).click();
  await apply(page, "Zugangsmodul");
  await page.getByRole("button", { name: "Ja", exact: true }).click();
  await apply(page, "Diagnoseablauf");
  await expect(page.locator(".guided-canvas .wf-node").first()).toBeVisible();
});

test("guided disposal scenario adds a cordon and a neutralisation flow", async ({
  page,
}) => {
  await login(page, "guided-eod");
  await startGuided(page, "Entschärfungsszenario");

  await page.getByRole("button", { name: "Nein", exact: true }).click();
  await apply(page, "Absperrbereich");
  await page.getByRole("button", { name: "Baugruppe scharf", exact: true }).click();
  await apply(page, "Entschärfungsablauf");
  await expect(page.locator(".guided-canvas .wf-node").first()).toBeVisible();
});

test("guided film sequence branches on reactions", async ({ page }) => {
  await login(page, "guided-film");
  await startGuided(page, "Filmsequenz");

  await page
    .getByRole("button", { name: "Mehrere mögliche Reaktionen", exact: true })
    .click();
  await apply(page, "aus der gewählten Handlung");
  await apply(page, "Darsteller");
  await apply(page, "Requisite");
  await expect(page.locator(".guided-canvas .wf-node").first()).toBeVisible();
  expect(await page.locator(".guided-canvas .wf-node").count()).toBeGreaterThanOrEqual(
    3,
  );
});
