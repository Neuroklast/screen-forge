import type { Scenario } from "./training";

const MODULE_EN: Record<string, string> = {
  medical: "Medical monitor",
  camera: "Camera feed",
  tracking: "Tracking / map",
  os: "Operating system",
  terminal: "Terminal",
  countdown: "Countdown device",
  access: "Access control",
  comms: "Comms",
  corporate: "Corporate system",
  hologram: "Analysis table",
  lock: "Lock",
  slide: "Slide",
  ordnance: "Ordnance console",
  beacon: "Beacon",
  clock: "Clock",
  rotary: "Rotary control",
  "code-table": "Code table",
  "data-sheet": "Data sheet",
};
const moduleLabel = (id: string) => MODULE_EN[id] ?? id;
const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "mission";
const tPlus = (seconds: number) =>
  `T+${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    Math.round(seconds % 60),
  ).padStart(2, "0")}`;
const objectiveLine = (name: string, i: number) => `   ${i + 1}. ${name}`;

// Generate a full-text mission briefing in the structure of an operational
// order (SMEAC/OPORD). Deterministic; all content is fictional.
export function missionBriefing(
  s: Scenario,
  options: { date?: string } = {},
): string {
  const lines: string[] = [];
  const push = (...rows: string[]) => lines.push(...rows);
  const hq = s.stations.filter((st) => st.role === "hq");
  const field = s.stations.filter((st) => st.role !== "hq");
  const teams = s.teams.length
    ? s.teams.map((t) => t.name)
    : [...new Set(s.stations.map((st) => st.team))];
  const objectives = s.objectives.map((o) => o.name);
  const missionVerb = objectives.length
    ? objectives.join(", ")
    : "conduct the assigned exercise";

  push(
    "UNCLASSIFIED // EXERCISE",
    `OPERATION ${s.name.toUpperCase()} — MISSION BRIEFING`,
    `Reference: mission ${slug(s.name)} · Data source: ${s.mode} · Seed ${s.seed}`,
  );
  if (options.date) push(`Issued: ${options.date}`);
  push("", "1. SITUATION", "   a. General.");
  push(
    `      A fictional facility and its systems form the exercise area. The`,
    `      exercise force operates ${field.length} field station(s) and`,
    `      ${hq.length} command station(s) against the scenario conditions.`,
  );
  push("   b. Terrain.");
  push(
    `      Map centre ${s.map.lat.toFixed(4)} / ${s.map.lng.toFixed(4)}, zoom ${s.map.zoom}.`,
  );
  if (s.zones.length)
    push(
      `      Zones: ${s.zones
        .map((z) => `${z.name} (r=${z.radius} m)`)
        .join(", ")}.`,
    );
  push("   c. Opposing / environmental factors.");
  push(
    `      ${s.injects.length} planned event(s) shape the situation (Annex B).`,
  );
  push("   d. Friendly forces.");
  if (teams.length) push(`      Teams: ${teams.join(", ")}.`);
  for (const st of s.stations)
    push(
      `      - ${st.name} [${st.role === "hq" ? "HQ" : "FIELD"}] — ${moduleLabel(st.module)}${st.player ? " (GPS player)" : ""}.`,
    );

  push("", "2. MISSION");
  push(
    `   The exercise force is to ${missionVerb} in the assigned sector,`,
    `   on order, in order to train information handling, timing and`,
    `   reporting under exercise conditions.`,
  );

  push("", "3. EXECUTION");
  push("   a. Concept of operations.");
  push(
    `      Command element (${hq.map((st) => st.name).join(", ") || "HQ"}) maintains the`,
    `      operational picture; field elements execute station tasks and report.`,
    `      Exercise control (EXCON) runs the master event list and may inject.`,
  );
  push("   b. Tasks.");
  for (const st of s.stations) {
    const bound = [
      st.bindings.patient && `patient ${st.bindings.patient}`,
      st.bindings.prop && `prop ${st.bindings.prop}`,
      st.bindings.objective && `objective ${st.bindings.objective}`,
    ]
      .filter(Boolean)
      .join(", ");
    push(
      `      - ${st.name}: operate ${moduleLabel(st.module)}${bound ? ` (bound: ${bound})` : ""}.`,
    );
  }
  push("   c. Objectives.");
  if (objectives.length)
    objectives.forEach((name, i) => push(objectiveLine(name, i)));
  else push("      (none defined)");
  push("   d. Timeline (Master Event List).");
  if (s.injects.length)
    for (const r of s.injects)
      push(
        `      ${r.trigger === "timer" ? tPlus(r.at) : r.trigger.toUpperCase()} — ${r.name}${r.enabled ? "" : " (inactive)"}.`,
      );
  else push("      (no planned events)");

  push("", "4. SUPPORT / ADMINISTRATION & LOGISTICS");
  push(
    `   a. Devices. ${s.stations.length} station(s): ${s.stations
      .map((st) => moduleLabel(st.module))
      .join(", ")}.`,
  );
  push(
    `   b. Casualties. ${s.patients.length ? s.patients.map((p) => `${p.name} (${p.kind})`).join(", ") : "none"}.`,
  );
  push(
    `   c. Equipment. ${s.props.length ? s.props.map((p) => `${p.name} [${p.kind}]`).join(", ") : "none"}.`,
  );

  push("", "5. COMMAND & SIGNAL");
  push(
    `   a. Command. EXCON holds exercise authority; safety officer may pause or`,
    `      abort at any time.`,
  );
  push(
    `   b. Signals. Fictional channels only (command / coordination / medical).`,
    `      Station completion signals are logged and visible to EXCON.`,
  );
  push(
    `   c. Safety. All systems are fictional; surfaces carry the EXERCISE mark.`,
    `      Abort is reachable in two taps and independent of EXCON availability.`,
  );

  push("", "ANNEX A — Entity register");
  push(
    `   Dossiers: ${s.dossiers.length ? s.dossiers.map((d) => `${d.name} (${d.released ? "released" : "held"})`).join(", ") : "none"}.`,
  );
  push(
    `   Actors: ${s.actors.length ? s.actors.map((a) => `${a.name}${a.character ? ` as ${a.character}` : ""}`).join(", ") : "none"}.`,
  );
  push("", "ANNEX B — Event purposes");
  if (s.injects.length)
    for (const r of s.injects)
      push(
        `   - ${r.name}: ${r.actions
          .map((a) =>
            a.type === "message"
              ? `message "${a.text}"`
              : `${a.type} → ${a.target}`,
          )
          .join("; ")}.`,
      );
  else push("   (none)");
  push("", "END OF BRIEFING // EXERCISE");
  return lines.join("\n");
}

export const briefingFilename = (s: Scenario) =>
  `briefing-${slug(s.name)}.txt`;
