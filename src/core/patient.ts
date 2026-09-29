import { noise } from "./runtime";
export const patientKinds = [
  "stable",
  "tachy",
  "brady",
  "desat",
  "trauma",
  "arrest",
  "recovered",
] as const;
export type PatientKind = (typeof patientKinds)[number];
export type Patient = {
  id: string;
  name: string;
  kind: PatientKind;
  since: number;
};
export type Vitals = {
  hr: number;
  spo2: number;
  rr: number;
  sys: number;
  dia: number;
  temp: number;
  gcs: number;
  etco2: number;
};
export function createPatient(
  id = "alpha",
  name = "UNKNOWN / FIELD",
): Patient {
  return { id, name, kind: "stable", since: 0 };
}
export function vitalsOf(patient: Patient, time: number, seed: number): Vitals {
  const t = time + patient.since;
  const n = (k: number) => noise(Math.floor(t * 2) + k, seed);
  const wobble = (base: number, span: number, k: number) =>
    Math.round(base + (n(k) - 0.5) * span);
  switch (patient.kind) {
    case "tachy":
      return {
        hr: wobble(128, 10, 1),
        spo2: wobble(94, 3, 2),
        rr: wobble(24, 4, 3),
        sys: wobble(148, 8, 4),
        dia: wobble(92, 6, 5),
        temp: 37.4 + (n(6) - 0.5) * 0.4,
        gcs: 14,
        etco2: wobble(28, 4, 7),
      };
    case "brady":
      return {
        hr: wobble(46, 6, 1),
        spo2: wobble(91, 3, 2),
        rr: wobble(10, 2, 3),
        sys: wobble(88, 8, 4),
        dia: wobble(54, 6, 5),
        temp: 35.6 + (n(6) - 0.5) * 0.3,
        gcs: 12,
        etco2: wobble(42, 4, 7),
      };
    case "desat":
      return {
        hr: wobble(108, 8, 1),
        spo2: wobble(82, 5, 2),
        rr: wobble(28, 5, 3),
        sys: wobble(132, 10, 4),
        dia: wobble(78, 8, 5),
        temp: 36.2,
        gcs: 11,
        etco2: wobble(22, 4, 7),
      };
    case "trauma":
      return {
        hr: wobble(118, 12, 1),
        spo2: wobble(88, 4, 2),
        rr: wobble(26, 4, 3),
        sys: wobble(78, 10, 4),
        dia: wobble(48, 8, 5),
        temp: 35.1,
        gcs: 9,
        etco2: wobble(24, 5, 7),
      };
    case "arrest":
      return {
        hr: 0,
        spo2: wobble(62, 6, 2),
        rr: 0,
        sys: 0,
        dia: 0,
        temp: 34.8,
        gcs: 3,
        etco2: wobble(8, 3, 7),
      };
    case "recovered":
      return {
        hr: wobble(84, 6, 1),
        spo2: wobble(97, 2, 2),
        rr: wobble(16, 2, 3),
        sys: wobble(118, 6, 4),
        dia: wobble(74, 4, 5),
        temp: 36.8,
        gcs: 15,
        etco2: wobble(36, 3, 7),
      };
    default:
      return {
        hr: wobble(76, 6, 1),
        spo2: wobble(98, 2, 2),
        rr: wobble(14, 2, 3),
        sys: wobble(122, 6, 4),
        dia: wobble(76, 4, 5),
        temp: 36.7,
        gcs: 15,
        etco2: wobble(38, 3, 7),
      };
  }
}
export function ecgPath(kind: PatientKind, time: number) {
  const pts: string[] = [];
  for (let i = 0; i < 80; i++) {
    const x = i * 4;
    const phase = (time * (kind === "tachy" ? 4.2 : kind === "brady" ? 1.4 : 2.2) + i * 0.18) % 1;
    let y = 28;
    if (kind === "arrest") y = 28 + Math.sin(i * 0.7 + time) * 2;
    else if (phase < 0.08) y = 28 - phase * 40;
    else if (phase < 0.14) y = 12 + (phase - 0.08) * 280;
    else if (phase < 0.22) y = 28 - (0.22 - phase) * 80;
    else y = 28 + Math.sin(phase * 12) * 2;
    pts.push(`${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}
