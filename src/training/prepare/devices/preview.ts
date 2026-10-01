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
