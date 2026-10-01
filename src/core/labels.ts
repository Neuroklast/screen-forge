import { scenes } from "./config";
import { t } from "../i18n";

// Control-UI label layer. Internal ids and enum values must never be rendered
// directly in the German/English chrome; they go through `labelFor`. Fictional
// in-world stage content is art direction and stays as designed.
export type LabelDomain =
  | "scene"
  | "cue"
  | "trigger"
  | "mode"
  | "osApp"
  | "propKind"
  | "propState"
  | "phase"
  | "triage"
  | "patientKind";

const MAPS: Record<Exclude<LabelDomain, "scene">, Record<string, string>> = {
  cue: {
    idle: "studio.cue.idle",
    active: "studio.cue.active",
    warning: "studio.cue.warning",
    complete: "studio.cue.complete",
  },
  trigger: {
    time: "sequence.triggerTime",
    key: "sequence.triggerKey",
    pin: "sequence.triggerPin",
    signal: "sequence.triggerSignal",
  },
  mode: {
    LIVE: "mode.live",
    PLAYBACK: "mode.playback",
  },
  osApp: {
    overview: "os.app.overview",
    terminal: "os.app.terminal",
    files: "os.app.files",
    personnel: "os.app.personnel",
    clusters: "os.app.clusters",
    dimension: "os.app.dimension",
    messages: "os.app.messages",
  },
  propKind: {
    ordnance: "module.ordnance",
    beacon: "module.beacon",
  },
  propState: {
    off: "state.off",
    active: "state.active",
    interference: "state.interference",
    armed: "state.armed",
    bypassed: "state.bypassed",
    disarmed: "state.disarmed",
    tampered: "state.tampered",
  },
  phase: {
    ready: "phase.ready",
    running: "phase.running",
    aborted: "phase.aborted",
  },
  triage: {
    green: "triage.green",
    yellow: "triage.yellow",
    red: "triage.red",
    black: "triage.black",
  },
  patientKind: {
    stable: "patient.kind.stable",
    tachy: "patient.kind.tachy",
    brady: "patient.kind.brady",
    desat: "patient.kind.desat",
    trauma: "patient.kind.trauma",
    arrest: "patient.kind.arrest",
    recovered: "patient.kind.recovered",
  },
};

export function labelFor(domain: LabelDomain, id: string): string {
  if (domain === "scene") return t(`scene.${id}`);
  return t(MAPS[domain][id] ?? id);
}

// Every key `labelFor` can resolve, exposed for the dictionary guard.
export function labelKeys(): string[] {
  return [
    ...scenes.map((scene) => `scene.${scene.id}`),
    ...Object.values(MAPS).flatMap((map) => Object.values(map)),
  ];
}
