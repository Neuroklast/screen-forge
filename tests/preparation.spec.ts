import { test, expect } from "@playwright/test";
import {
  addDevice,
  createGuided,
  DOMAIN,
  loadTemplate,
  login,
  openAddDevice,
  save,
} from "./support/prep";

test("disposal setup hides patient controls and offers ordnance devices", async ({
  page,
}) => {
  await login(page, "prep-disposal");
  await createGuided(page, DOMAIN.disposal, "Disposal test");

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Patienten", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Spieler hinzufügen")).toHaveCount(0);

  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await openAddDevice(page);
  await expect(
    page.getByRole("button", { name: "Medizingerät", exact: true }),
  ).toHaveCount(0);
  await addDevice(page, "Sprengkörper-Konsole");
  await expect(page.locator(".prepare-device")).toContainText(
    "Sprengkörper-Konsole 1",
  );
  await expect(
    page.getByRole("heading", { name: "Requisiten", exact: true }),
  ).toBeVisible();
});

test("medical setup shows patient controls and hides ordnance", async ({
  page,
}) => {
  await login(page, "prep-medical");
  await createGuided(page, DOMAIN.medical, "Medical test");

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await openAddDevice(page);
  await expect(
    page.getByRole("button", { name: "Sprengkörper-Konsole", exact: true }),
  ).toHaveCount(0);
  await addDevice(page, "Medizingerät");
  await save(page);

  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings")).not.toContainText(
    "benötigt einen Patienten",
  );
  await expect(
    page.getByRole("button", { name: "Übung starten", exact: true }).last(),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Patienten", exact: true }),
  ).toBeVisible();
});

test("film setup offers actors and hides patient and team controls", async ({
  page,
}) => {
  await login(page, "prep-film");
  await createGuided(page, DOMAIN.film, "Film test");

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Darsteller hinzufügen", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Teilnehmer hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Team hinzufügen", exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await addDevice(page, "Projektion");
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Darsteller", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Patienten", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Teams", exact: true }),
  ).toHaveCount(0);
});

test("existing template is edited and saved from the preparation shell", async ({
  page,
}) => {
  await login(page, "prep-template");
  await loadTemplate(page, "Relay Recovery", "Relay edited");

  await page.getByRole("button", { name: "Szenario", exact: true }).click();
  await page.getByLabel("Szenarioname", { exact: true }).fill("Relay edited 2");
  await save(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Relay edited 2",
  );
});

test("branched workflow stays connected and reports open outputs", async ({
  page,
}) => {
  await login(page, "prep-branch");
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Entscheidung", exact: true }).click();
  await expect(page.locator(".wf-node")).toHaveCount(3);

  await page.locator(".wf-node").filter({ hasText: "Start" }).click();
  await page
    .getByRole("combobox", { name: "Weiter", exact: true })
    .selectOption({ index: 2 });
  const decision = page.locator(".wf-node").filter({ hasText: "Entscheidung" });
  await decision.click();
  await page
    .getByRole("combobox", { name: "Ja", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "Nein", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");

  await page
    .getByRole("combobox", { name: "Nein", exact: true })
    .selectOption("");
  await expect(page.locator(".wf-findings")).toContainText("nicht verbunden");
  await page
    .getByRole("combobox", { name: "Nein", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");
});

test("device assignment links equipment to a participant", async ({ page }) => {
  await login(page, "prep-device");
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page.getByRole("button", { name: "Team hinzufügen", exact: true }).click();
  await page
    .getByRole("button", { name: "Teilnehmer hinzufügen", exact: true })
    .click();

  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  // Adding selects the new device; ownership is assigned in the inspector.
  await addDevice(page, "Funkgerät");
  await page.getByLabel("Zuordnung").selectOption({ label: "Teilnehmer 2" });

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.locator(".prepare-person").filter({ hasText: "Funkgerät 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings")).not.toContainText(
    "keinem Teilnehmer",
  );
});

test("mission location is set by clicking the map", async ({ page }) => {
  await login(page, "prep-map");
  await page.getByRole("button", { name: "Szenario", exact: true }).click();
  const readout = page.locator(".location-readout span").first();
  const before = await readout.textContent();
  await page.locator(".mission-map").click({ position: { x: 60, y: 60 } });
  await expect(readout).not.toHaveText(before ?? "");
});

test("timed event appears on the timeline with a human sentence", async ({
  page,
}) => {
  await login(page, "prep-timed");
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page.getByRole("button", { name: "Zeitpunkt", exact: true }).click();
  const chip = page.locator(".flow-chip").filter({ hasText: "1:00" });
  await expect(chip).toBeVisible();
  await expect(page.locator(".flow-summary")).toContainText(
    "Wenn Zeitpunkt 1:00",
  );
  await expect(page.locator(".flow-summary")).toContainText("sende Meldung");
  await page.getByLabel("Zeitpunkt (s)").fill("90");
  await expect(page.locator(".flow-chip").filter({ hasText: "1:30" })).toBeVisible();
  await expect(page.locator(".flow-summary")).toContainText("1:30");
});

test("event that starts a workflow highlights the entry node", async ({
  page,
}) => {
  await login(page, "prep-highlight");
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await page
    .getByRole("button", { name: "Requisite hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page.getByRole("button", { name: "Ablauf anlegen", exact: true }).click();
  // Trigger the flow on the prop state; the defaults already reference it.
  await page.getByLabel("Startet").selectOption({ label: "Wenn Requisite" });
  // The event sets the same prop state, so the link is derived.
  await page.getByRole("button", { name: "Manuell", exact: true }).click();
  await page
    .getByLabel("Aktion", { exact: true })
    .selectOption({ label: "Requisite setzen" });
  await expect(
    page.locator(".flow-chip").filter({ hasText: "startet" }),
  ).toBeVisible();
  await expect(page.locator(".wf-node.is-highlighted")).toHaveCount(1);
});

test("start validation blocks a medical scenario without a patient", async ({
  page,
}) => {
  await login(page, "prep-medical-gate");
  await createGuided(page, DOMAIN.medical, "Medical validation");
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await addDevice(page, "Medizingerät");
  await save(page);

  // Remove the provisioned patient so the treatment requirement fails.
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  const patientCard = page.locator(".prepare-person").filter({
    has: page.getByText("Patienten", { exact: true }),
  });
  await patientCard.getByRole("button", { name: "Entfernen" }).click();

  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings")).toContainText(
    "Modul Medizin benötigt einen Patienten",
  );
  await expect(
    page.getByRole("button", { name: "Übung starten", exact: true }).last(),
  ).toBeDisabled();

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page
    .getByRole("button", { name: "Patient hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await page
    .locator(".prepare-device")
    .filter({ hasText: "Medizingerät 1" })
    .click();
  await page.getByText("Erweitert").click();
  await page.getByLabel("Patienten").selectOption({ label: "Patient 1" });
  await save(page);

  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
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

test("a team can be created from a template with staffing", async ({ page }) => {
  await login(page, "prep-team-template");
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page
    .getByRole("button", { name: "Team aus Vorlage", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Kompakter Feldtrupp", exact: true })
    .click();
  // The team inspector shows the template and its staffing.
  await expect(page.locator(".sf-force-staffing")).toContainText("4 / 4");
  // One participant per recommended role slot (labels resolve to German).
  await expect(
    page.locator(".sf-force-item").filter({ hasText: "Truppführer" }),
  ).toHaveCount(1);
  await expect(
    page.locator(".sf-force-item").filter({ hasText: "Fernmeldespezialist" }),
  ).toHaveCount(1);
  // The template's equipment packs become suggestions for the team, with a
  // readiness roll-up and a link to a ScreenForge device.
  await expect(page.locator(".sf-force-equipment")).toContainText(
    "Ausrüstung bereit",
  );
  await expect(page.locator(".sf-force-equipment select").last()).toBeVisible();
});

test("an event carries MSEL metadata", async ({ page }) => {
  await login(page, "prep-mels");
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page.getByRole("button", { name: "Zeitpunkt", exact: true }).click();
  await page.getByText("Auswertung (MSEL)").click();
  await page.getByLabel("Zweck").fill("Test information handling");
  await page
    .getByLabel("Trainingsziel", { exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".flow-summary")).toContainText("Ziel:");
});
