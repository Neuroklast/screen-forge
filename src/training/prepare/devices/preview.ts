import type { Cue } from "../../../core/runtime";
import { TelemetryStore } from "../../../core/telemetry";
import { newState, type Scenario, type TrainingState } from "../../../core/training";
import type { ExerciseValue } from "../../../core/useExercise";

// Editor preview sandbox (docs/architecture/previews.md): the preview derives
// from the draft scenario and feeds the real runtime components a synthetic,
// inert exercise value. Nothing here is persisted and nothing is sent.

export type PreviewState =
  | "normal"
  | "warning"
  | "critical"
  | "offline"
  | "safe";

export const previewStates: PreviewState[] = [
  "normal",
  "warning",
  "critical",
  "offline",
  "safe",
];

// A preview scenario is a labelled situation. The generic editor states are
// always available; a surface can add situations that mean something specific
// for it (a tracking device has "signal lost" and "objective reached"). The
// scenario maps back to a generic state for the cue and chrome, so there is
// still one preview model (docs/architecture/previews.md).
export type PreviewScenario = { id: string; labelKey: string };

const SURFACE_SCENARIOS: Partial<
  Record<string, { id: string; state: PreviewState; labelKey: string }[]>
> = {
  tracking: [
    { id: "tracking.signalLost", state: "offline", labelKey: "preview.tracking.signalLost" },
    { id: "tracking.objective", state: "safe", labelKey: "preview.tracking.objective" },
  ],
  medical: [
    { id: "medical.critical", state: "critical", labelKey: "preview.medical.critical" },
  ],
  countdown: [
    { id: "countdown.expired", state: "warning", labelKey: "preview.countdown.expired" },
  ],
};

export function previewScenarios(
  module: string,
  scene?: string,
): PreviewScenario[] {
  const specific =
    SURFACE_SCENARIOS[scene ?? module] ?? SURFACE_SCENARIOS[module] ?? [];
  return [
    ...specific.map((row) => ({ id: row.id, labelKey: row.labelKey })),
    ...previewStates.map((state) => ({
      id: state,
      labelKey: `prep.devices.state.${state}`,
    })),
  ];
}

export function previewStateFor(module: string, scene: string | undefined, id: string): PreviewState {
  if ((previewStates as string[]).includes(id)) return id as PreviewState;
  const specific =
    SURFACE_SCENARIOS[scene ?? module] ?? SURFACE_SCENARIOS[module] ?? [];
  return specific.find((row) => row.id === id)?.state ?? "normal";
}

// WARNING/CRITICAL reach the renderer as the warning cue; SAFE as complete.
// NORMAL and OFFLINE keep the idle cue and add editor-only chrome.
export function previewCue(preview: PreviewState): Cue {
  if (preview === "warning" || preview === "critical") return "warning";
  if (preview === "safe") return "complete";
  return "idle";
}

export function previewTrainingState(
  scenario: Scenario,
  stationId: string,
  preview: PreviewState,
): TrainingState {
  const state = newState("preview", scenario);
  const station = scenario.stations.find((row) => row.id === stationId);
  state.frozen = true;
  state.phase = "ready";
  state.workflows = {};
  // A representative clock so countdown/terminal surfaces show plausible
  // content instead of an expired timer.
  state.clock = station ? Math.round(station.duration * 0.35) : 0;
  state.presence = {
    [stationId]: { online: preview !== "offline", lastSeen: 0 },
  };
  state.cameraOffline = preview === "offline" ? { [stationId]: true } : {};
  state.moduleEvents =
    preview === "safe" ? { [stationId]: ["preview.safe"] } : {};
  if (preview === "critical" && station?.bindings.prop)
    state.propStates[station.bindings.prop] = "tampered";
  return state;
}

export function previewExercise(
  state: TrainingState,
  stationId: string,
): ExerciseValue {
  return {
    state,
    online: true,
    authenticated: true,
    error: "",
    setError: () => {},
    send: () => false,
    login: () => {},
    logout: () => {},
    invitation: null,
    diagnostic: null,
    gpsAck: 0,
    savedRevision: -1,
    serverSeq: 0,
    clockRevision: 0,
    serverBuild: null,
    buildMismatch: false,
    serverNow: () => 0,
    telemetry: new TelemetryStore(),
    pendingCount: 0,
    subscribe: () => () => {},
    role: "trainer",
    station: stationId,
    room: "preview",
  };
}
