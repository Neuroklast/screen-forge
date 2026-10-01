import { test, expect, type Page } from "@playwright/test";
import {
  addDevice,
  createGuided,
  DOMAIN,
  loadTemplate,
  login,
  save,
} from "./support/prep";

// Three complete preparation journeys, one per scenario type. They mirror the
// acceptance walk-throughs: create, build logic, assign, review, start.

// React Flow re-renders node cards on every workflow edit; target the stable
// node wrapper by its id instead of text to avoid mid-render races.
function startNode(page: Page) {
  return page.locator('.react-flow__node[data-id="start"] .wf-node');
}

test("journey: disposal setup, branched flow, event, assignment and start", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await login(page, "journey-disposal");
  await loadTemplate(page, "Ordnance Disposal", "Journey Disposal");

  // Participants and device ownership.
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page
    .getByRole("button", { name: "Team hinzufügen", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Teilnehmer hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  // Ownership lives in the contextual inspector now.
  await page
    .locator(".prepare-device")
    .filter({ hasText: "Console 01" })
    .click();
  await page.getByLabel("Zuordnung").selectOption({ label: "Teilnehmer 1" });

  // Branched flow on a prop trigger plus a linked timed event.
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByLabel("Startet").selectOption({ label: "Wenn Requisite" });
  await page.getByRole("button", { name: "Entscheidung", exact: true }).click();
  await expect(page.locator(".wf-node")).toHaveCount(3);
  await startNode(page).click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });
  await page
    .locator(".wf-node")
    .filter({ hasText: "Entscheidung" })
    .click();
  await page
    .getByRole("combobox", { name: "Ja", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "Nein", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");
  await page.getByRole("button", { name: "Zeitpunkt", exact: true }).click();
  await page
    .getByLabel("Aktion", { exact: true })
    .selectOption({ label: "Requisite setzen" });
  await expect(
    page.locator(".flow-chip").filter({ hasText: "startet" }),
  ).toBeVisible();
  await expect(page.locator(".wf-node.is-highlighted")).toHaveCount(1);

  // Review and start.
  await save(page);
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings li.is-error")).toHaveCount(0);
  const start = page.getByRole("button", {
    name: "Übung starten",
    exact: true,
  }).last();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(
    page.getByRole("heading", { name: "Verdeckte Ereignisse" }),
  ).toBeVisible();
});

test("journey: medical patient path is fixed through review", async ({ page }) => {
  test.setTimeout(60_000);
  await login(page, "journey-medical");
  await createGuided(page, DOMAIN.medical, "Journey Medical");
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await addDevice(page, "Medizingerät");

  // Treatment path: the medical action stays connected on success; the failure
  // output is left open on purpose to be caught by the review.
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Aktion", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Aufgabe", exact: true })
    .selectOption({ label: "Medizin" });
  await page
    .getByRole("combobox", { name: "Erfolg", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-node")).toHaveCount(3);
  await startNode(page).click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });

  // Review explains the open output in human language and blocks.
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings")).toContainText("Fehlschlag");
  await expect(page.locator(".prepare-findings li.is-error")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Übung starten", exact: true }).last(),
  ).toBeDisabled();

  // Fix the branch, save and start.
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page.locator(".wf-node").filter({ hasText: "medical" }).click();
  await page
    .getByRole("combobox", { name: "Fehlschlag", exact: true })
    .selectOption({ index: 1 });
  await save(page);
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings li.is-error")).toHaveCount(0);
  const start = page.getByRole("button", {
    name: "Übung starten",
    exact: true,
  }).last();
  await expect(start).toBeEnabled();
  await start.click();
  await expect(
    page.getByRole("heading", { name: "Verdeckte Ereignisse" }),
  ).toBeVisible();
});

test("journey: film actor, prop, trigger and flow reach a clean review", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await login(page, "journey-film");
  await createGuided(page, DOMAIN.film, "Journey Film");
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page
    .getByRole("button", { name: "Darsteller hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await addDevice(page, "Projektion");

  // Prop and a prop-triggered flow.
  await page
    .getByRole("button", { name: "Requisite hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByLabel("Startet").selectOption({ label: "Wenn Requisite" });
  await page.getByRole("button", { name: "Aktion", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Erfolg", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "Fehlschlag", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-node")).toHaveCount(3);
  await startNode(page).click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });
  // The event that starts the flow.
  await page.getByRole("button", { name: "Manuell", exact: true }).click();
  await page
    .getByLabel("Aktion", { exact: true })
    .selectOption({ label: "Requisite setzen" });
  await expect(
    page.locator(".flow-chip").filter({ hasText: "startet" }),
  ).toBeVisible();

  // Review is clean and offers the briefing.
  await save(page);
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings li.is-error")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Briefing", exact: true }),
  ).toBeVisible();
});
