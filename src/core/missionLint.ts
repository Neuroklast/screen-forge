import type { Scenario } from "./training";

export type Severity = "error" | "warning" | "info";
export type Collection =
  | "stations"
  | "patients"
  | "props"
  | "dossiers"
  | "zones"
  | "objectives"
  | "teams"
  | "actors"
  | "injects";
export type Finding = {
  id: string;
  severity: Severity;
  message: string;
  path: { collection: Collection; id?: string };
};

const CODE_MODULES = ["terminal", "access", "lock"];

// Live mission linter. Errors block start, warnings recommend, info explains.
// Mirrors the acceptance criteria in docs/konzept/domain/04-mission-builder.md.
export function lintMission(s: Scenario): Finding[] {
  const out: Finding[] = [];
  const error = (
    id: string,
    message: string,
    collection: Collection,
    target?: string,
  ) => out.push({ id, severity: "error", message, path: { collection, id: target } });
  const warn = (id: string, message: string, collection: Collection, target?: string) =>
    out.push({ id, severity: "warning", message, path: { collection, id: target } });
  const info = (id: string, message: string, collection: Collection, target?: string) =>
    out.push({ id, severity: "info", message, path: { collection, id: target } });

  if (s.stations.length < 1)
    error("stations-min", "Mindestens ein Gerät erforderlich.", "stations");

  const codes = new Map<string, number>();
  for (const st of s.stations) {
    codes.set(st.code, (codes.get(st.code) || 0) + 1);
    if (
      st.module === "medical" &&
      !s.patients.some((p) => p.id === st.bindings.patient)
    )
      error(
        `med-${st.id}`,
        `Modul Medizin benötigt einen Patienten (${st.name}).`,
        "stations",
        st.id,
      );
    if (st.role === "hq" && st.module !== "tracking")
      error(
        `hq-${st.id}`,
        `Einsatzleitung benötigt das Modul Karte (${st.name}).`,
        "stations",
        st.id,
      );
    if (
      st.bindings.patient &&
      !s.patients.some((p) => p.id === st.bindings.patient)
    )
      error(
        `patient-${st.id}`,
        `Unbekannter Patient an ${st.name}.`,
        "stations",
        st.id,
      );
    if (st.bindings.prop && !s.props.some((p) => p.id === st.bindings.prop))
      error(
        `prop-${st.id}`,
        `Unbekannte Requisite an ${st.name}.`,
        "stations",
        st.id,
      );
    if (CODE_MODULES.includes(st.module) && !st.code)
      error(
        `code-${st.id}`,
        `Terminal benötigt einen Zugangscode (${st.name}).`,
        "stations",
        st.id,
      );
  }
  for (const [code, count] of codes)
    if (count > 1)
      warn("code-dup", `Zugangscode ${code} wird mehrfach verwendet.`, "stations");

  if (s.objectives.length === 0)
    warn("no-objective", "Kein Einsatzziel definiert.", "objectives");

  for (const p of s.patients)
    if (!s.stations.some((st) => st.bindings.patient === p.id))
      info(`unused-patient-${p.id}`, `Patient ohne Gerät: ${p.name}.`, "patients", p.id);
  for (const p of s.props)
    if (!s.stations.some((st) => st.bindings.prop === p.id))
      info(`unused-prop-${p.id}`, `Requisite ohne Gerät: ${p.name}.`, "props", p.id);
  for (const r of s.injects)
    if (!r.enabled)
      info(`inject-off-${r.id}`, `Ereignis deaktiviert: ${r.name}.`, "injects", r.id);

  return out;
}

export function findingCounts(findings: Finding[]) {
  return {
    error: findings.filter((f) => f.severity === "error").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}
