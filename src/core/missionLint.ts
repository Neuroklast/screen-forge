import type { Scenario } from "./training";
import { lintGraph } from "./graph";
import { t } from "../i18n";

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
    error("stations-min", t("lint.stationsMin"), "stations");

  const codes = new Map<string, number>();
  for (const st of s.stations) {
    codes.set(st.code, (codes.get(st.code) || 0) + 1);
    if (
      st.module === "medical" &&
      !s.patients.some((p) => p.id === st.bindings.patient)
    )
      error(
        `med-${st.id}`,
        t("lint.medPatient", { name: st.name }),
        "stations",
        st.id,
      );
    if (st.role === "hq" && st.module !== "tracking")
      error(
        `hq-${st.id}`,
        t("lint.hqTracking", { name: st.name }),
        "stations",
        st.id,
      );
    if (
      st.bindings.patient &&
      !s.patients.some((p) => p.id === st.bindings.patient)
    )
      error(
        `patient-${st.id}`,
        t("lint.unknownPatient", { name: st.name }),
        "stations",
        st.id,
      );
    if (st.bindings.prop && !s.props.some((p) => p.id === st.bindings.prop))
      error(
        `prop-${st.id}`,
        t("lint.unknownProp", { name: st.name }),
        "stations",
        st.id,
      );
    if (CODE_MODULES.includes(st.module) && !st.code)
      error(
        `code-${st.id}`,
        t("lint.codeRequired", { name: st.name }),
        "stations",
        st.id,
      );
  }
  for (const [code, count] of codes)
    if (count > 1)
      warn("code-dup", t("lint.codeDup", { code }), "stations");

  if (s.objectives.length === 0)
    warn("no-objective", t("lint.noObjective"), "objectives");

  for (const p of s.patients)
    if (!s.stations.some((st) => st.bindings.patient === p.id))
      info(`unused-patient-${p.id}`, t("lint.unusedPatient", { name: p.name }), "patients", p.id);
  for (const p of s.props)
    if (!s.stations.some((st) => st.bindings.prop === p.id))
      info(`unused-prop-${p.id}`, t("lint.unusedProp", { name: p.name }), "props", p.id);
  for (const r of s.injects)
    if (!r.enabled)
      info(`inject-off-${r.id}`, t("lint.injectOff", { name: r.name }), "injects", r.id);

  out.push(...lintGraph(s));
  return out;
}

export function findingCounts(findings: Finding[]) {
  return {
    error: findings.filter((f) => f.severity === "error").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };
}
