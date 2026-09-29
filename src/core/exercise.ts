import { sceneIds, type SceneId } from "./config";
import { createPatient, patientKinds, type Patient, type PatientKind } from "./patient";
export type StationRole = "hq" | "element";
export type Station = {
  id: string;
  name: string;
  role: StationRole;
  scene: SceneId;
};
export type Binding = { from: string; to: string };
export type RoomState = {
  room: string;
  frozen: boolean;
  clock: number;
  stations: Station[];
  bindings: Binding[];
  patient: Patient;
  cameras: string[];
};
export type ExerciseMsg =
  | { type: "hello"; role: string; station: string; room: string }
  | { type: "state"; state: RoomState }
  | { type: "inject"; kind: PatientKind | "freeze" | "play" }
  | { type: "join"; station: Station }
  | { type: "bind"; from: string; to: string }
  | { type: "clock"; clock: number };
export function createRoom(room = "default"): RoomState {
  return {
    room,
    frozen: false,
    clock: 0,
    stations: [
      { id: "med-1", name: "Casualty monitor", role: "element", scene: "medical" },
      { id: "cam-1", name: "Optics", role: "element", scene: "camera" },
      { id: "radio-1", name: "Relay", role: "element", scene: "comms" },
      { id: "files-1", name: "SSE terminal", role: "element", scene: "terminal" },
      { id: "hq", name: "HQ", role: "hq", scene: "tracking" },
    ],
    bindings: [
      { from: "casualty:alpha", to: "station:med-1" },
      { from: "webcam:0", to: "station:cam-1" },
    ],
    patient: createPatient(),
    cameras: [],
  };
}
export function applyExercise(state: RoomState, msg: ExerciseMsg): RoomState {
  if (msg.type === "inject") {
    if (msg.kind === "freeze") return { ...state, frozen: true };
    if (msg.kind === "play") return { ...state, frozen: false };
    if ((patientKinds as readonly string[]).includes(msg.kind))
      return {
        ...state,
        patient: { ...state.patient, kind: msg.kind, since: state.clock },
      };
  }
  if (msg.type === "join") {
    const rest = state.stations.filter((s) => s.id !== msg.station.id);
    return { ...state, stations: [...rest, msg.station] };
  }
  if (msg.type === "bind") {
    const rest = state.bindings.filter(
      (b) => !(b.from === msg.from && b.to === msg.to),
    );
    return { ...state, bindings: [...rest, { from: msg.from, to: msg.to }] };
  }
  if (msg.type === "clock") return { ...state, clock: msg.clock };
  return state;
}
export function stationOf(state: RoomState, id: string) {
  return state.stations.find((s) => s.id === id);
}
export function isSceneId(id: string): id is SceneId {
  return (sceneIds as readonly string[]).includes(id);
}
