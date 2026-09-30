import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto(
    `/?role=trainer&room=prep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );
  await page.getByLabel("Trainer-Schlüssel").fill("browser-test-key");
  await page.getByRole("button", { name: "Verbinden", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Was möchtest du als Nächstes tun?" }),
  ).toBeVisible();
}

async function openWizard(page: Page) {
  await page
    .getByRole("button", { name: "Neues Szenario erstellen", exact: false })
    .click();
  await expect(page.getByRole("heading", { name: "Zweck" })).toBeVisible();
}

test("disposal setup hides patient controls and offers ordnance devices", async ({
  page,
}) => {
  await login(page);
  await openWizard(page);
  await page
    .getByRole("button", { name: "Sprengkörper entschärfen", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Spieler hinzufügen")).toHaveCount(0);

  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Teilnehmer hinzufügen", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  const preset = page.getByLabel("Gerätetyp");
  await expect(preset.locator("option", { hasText: "Medizingerät" })).toHaveCount(
    0,
  );
  await preset.selectOption({ label: "Sprengkörper-Konsole" });
  await page
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();

  // Participants stays free of patient controls; the prop was provisioned.
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Patienten", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Requisiten", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".prepare-device")).toContainText(
    "Sprengkörper-Konsole 1",
  );
});

test("medical setup shows patient controls and hides ordnance", async ({
  page,
}) => {
  await login(page);
  await openWizard(page);
  await page.getByRole("button", { name: "Medizin", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Patient hinzufügen", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Patient hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  const preset = page.getByLabel("Gerätetyp");
  await expect(
    preset.locator("option", { hasText: "Sprengkörper-Konsole" }),
  ).toHaveCount(0);
  await preset.selectOption({ label: "Medizingerät" });
  await page
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();

  // Bind the patient, then the review is clean.
  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  const card = page
    .locator(".prepare-device")
    .filter({ hasText: "Medizingerät 1" });
  await card.getByLabel("Patienten").selectOption({ label: "Patient 1" });
  await page.getByRole("button", { name: "Szenario speichern", exact: true }).click();
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
  await login(page);
  await openWizard(page);
  await page.getByRole("button", { name: "Film", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
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
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  const preset = page.getByLabel("Gerätetyp");
  await preset.selectOption({ label: "Projektion" });
  await page
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();
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
  await login(page);
  await openWizard(page);
  await page
    .getByRole("button", { name: "Relay Recovery", exact: false })
    .first()
    .click();
  await page.getByLabel("Szenarioname", { exact: true }).fill("Relay edited");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Relay edited",
  );

  await page.getByRole("button", { name: "Szenario", exact: true }).click();
  await page.getByLabel("Szenarioname", { exact: true }).fill("Relay edited 2");
  await page.getByRole("button", { name: "Szenario speichern", exact: true }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    "Szenario gespeichert",
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Relay edited 2",
  );
});

test("branched workflow stays connected and reports open outputs", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Ablauf", exact: true }).click();
  await page
    .getByRole("button", { name: "+ Ablauf anlegen", exact: true })
    .click();
  await page.getByRole("button", { name: "Entscheidung", exact: true }).click();
  await expect(page.locator(".wf-node")).toHaveCount(3);

  await page.locator(".wf-node").filter({ hasText: "Start" }).click();
  await page
    .getByRole("combobox", { name: "out", exact: true })
    .selectOption({ index: 2 });
  const decision = page.locator(".wf-node").filter({ hasText: "Entscheidung" });
  await decision.click();
  await page
    .getByRole("combobox", { name: "true", exact: true })
    .selectOption({ index: 1 });
  await page
    .getByRole("combobox", { name: "false", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");

  await page
    .getByRole("combobox", { name: "false", exact: true })
    .selectOption("");
  await expect(page.locator(".wf-findings")).toContainText("nicht verbunden");
  await page
    .getByRole("combobox", { name: "false", exact: true })
    .selectOption({ index: 1 });
  await expect(page.locator(".wf-findings")).toContainText("Keine Befunde.");
});

test("device assignment links equipment to a participant", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await page.getByRole("button", { name: "Team hinzufügen", exact: true }).click();
  await page
    .getByRole("button", { name: "Teilnehmer hinzufügen", exact: true })
    .click();

  await page.getByRole("button", { name: "Geräte", exact: true }).click();
  const addBlock = page.locator(".prepare-block").filter({
    has: page.getByRole("heading", { name: "Gerät hinzufügen", exact: true }),
  });
  await addBlock.getByLabel("Gerätetyp").selectOption({ label: "Funkgerät" });
  await addBlock
    .getByLabel("Zuordnung")
    .selectOption({ label: "Teilnehmer 2" });
  await addBlock
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();

  await page.getByRole("button", { name: "Teilnehmer", exact: true }).click();
  await expect(
    page.locator(".prepare-person").filter({ hasText: "Funkgerät 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Prüfen", exact: true }).click();
  await expect(page.locator(".prepare-findings")).not.toContainText(
    "keinem Teilnehmer",
  );
});

test("start validation blocks a medical scenario without a patient", async ({
  page,
}) => {
  await login(page);
  await openWizard(page);
  await page.getByRole("button", { name: "Medizin", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  const preset = page.getByLabel("Gerätetyp");
  await preset.selectOption({ label: "Medizingerät" });
  await page
    .getByRole("button", { name: "Gerät hinzufügen", exact: true })
    .click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByRole("button", { name: "Szenario anlegen" }).click();

  // The guided setup provisioned a patient; remove it to make the treatment
  // requirement fail.
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
  const card = page
    .locator(".prepare-device")
    .filter({ hasText: "Medizingerät 1" });
  await card.getByLabel("Patienten").selectOption({ label: "Patient 1" });
  await page.getByRole("button", { name: "Szenario speichern", exact: true }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText(
    "Szenario gespeichert",
  );

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
