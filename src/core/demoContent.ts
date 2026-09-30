import { defaults } from "./config";
import { showSchema, type Show } from "./director";
import { showTemplates } from "./showTemplates";
import { buildMission } from "./templates";
import { scenarioSchema, type Scenario } from "./training";

// Bundled demo content (concept 10-demo). Nothing is fetched; a fresh clone of
// this seed is the reset target. Both payloads are validated by their schemas.
export type DemoLogEntry = { at: number; message: string };
export type DemoState = {
  show: Show;
  mission: Scenario;
  log: DemoLogEntry[];
};

export function seedDemoState(): DemoState {
  const base = defaults("intranet");
  const templates = showTemplates(base);
  const chosen =
    templates.find((t) => t.name === "Activate Locator Beacon") ?? templates[0];
  const show = showSchema.parse(structuredClone(chosen.show));
  const mission = scenarioSchema.parse(
    structuredClone(buildMission("eod-disposal")),
  );
  return { show, mission, log: [] };
}
