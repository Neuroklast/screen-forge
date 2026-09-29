import { noise } from "../../core/runtime";
export const armingStages = [
  {
    at: 0,
    code: "01",
    title: "INITIATE_AIRGAP_PROTOCOL",
    sub: "EXTERNAL_TELEMETRY_SEVERED",
  },
  {
    at: 0.2,
    code: "02",
    title: "SUPERCONDUCTOR_COOLING_HALTED",
    sub: "INITIATING_CONTROLLED_QUENCH_SEQUENCE",
  },
  {
    at: 0.4,
    code: "03",
    title: "ION_GETTER_PUMPS_OFFLINE",
    sub: "PERMITTING_MICRO_ANNIHILATIONS",
  },
  {
    at: 0.6,
    code: "04",
    title: "AXIAL_FIELD_COMPRESSION_ACTIVE",
    sub: "QUADRUPOLE_POTENTIAL_FLATTENED",
  },
  {
    at: 0.8,
    code: "05",
    title: "PRIMARY_POWER_SHUNT_ARMED",
    sub: "TIMED_CIRCUIT_BREAKER_ACTUATION",
  },
] as const;
export function armingProgress(time: number, duration: number, safe: boolean) {
  if (safe) return 0;
  return Math.max(0, Math.min(1, time / Math.max(1, duration)));
}
export function armingStage(progress: number) {
  let stage: (typeof armingStages)[number] = armingStages[0];
  for (const s of armingStages) if (progress >= s.at) stage = s;
  return stage;
}
export function generateTelemetry(
  progress: number,
  time: number,
  seed: number,
) {
  const tick = Math.floor(time * 14);
  const j = (k: number) => (noise(tick + k, seed) - 0.5) * 0.004;
  const p = Math.max(0, (progress - 0.08) / 0.92);
  const p2 = p * p;
  return {
    bField: Math.max(0.002, 7.502 + j(1) * 2 - p * 7.49),
    cryo: 4.15 + j(2) * 8 + p2 * 38,
    vacuum: 1.2e-12 * Math.pow(10, p * 7.2),
    pbar: 8.4e10 * (1 + p * 3.1),
    annihil: 0.04 + j(3) * 2 + p2 * 48,
    eBeam: Math.max(0.1, 5.5 + j(4) - p * 5.2),
    margin: Math.max(0.02, 2.4 * (1 - p)),
    gamma: p > 0.4 ? 0.0002 + p * 0.511 : 0,
  };
}
const logPool = [
  "[TRAP_CTRL] INFO: Penning trap axial potential normalized.",
  "[UHV_PUMP] INFO: Ion getter pump 4 holding at 1.2E-12 Torr.",
  "[DIAG] CHECK: Positronium formation rate nominal.",
  "[CRYO_SYS] INFO: He-3 circulation flow steady.",
  "[TRAP_CTRL] INFO: Axial frequency lock 1.27 MHz.",
  "[AUTH] ALERT: LOCAL_ADMIN_PRIVILEGES_FORCED",
  "[SYS] COMMAND_RECV: INITIATE_AIRGAP_PROTOCOL",
  "[TRAP_CTRL] WARN: External telemetry sync severed.",
  "[CRYO_SYS] WARN: Helium flow rate restricted by override.",
  "[CRYO_SYS] CRITICAL: LHE temp rising. Superconductor quench imminent.",
  "[MAG_SYS] WARN: B_FIELD_AXIAL degrading.",
  "[UHV_PUMP] CRITICAL: Vacuum degradation detected.",
  "[DIAG] ALARM: ANNIHILATION_BG spiking. Gamma flash 0.511 MeV.",
  "[TRAP_CTRL] ALERT: QUADRUPOLE_POTENTIAL_FLATTENED.",
  "[SYS] STATUS: TOTAL_FIELD_COLLAPSE sequence locked.",
  "[SYS] STATUS: Waiting for timer actuation (SHUNT_CIRCUIT_BREAK).",
];
export function armingLog(progress: number, time: number, seed: number) {
  const n = 6;
  const head = Math.min(
    logPool.length,
    4 + Math.floor(progress * (logPool.length - 4)),
  );
  const start = Math.max(0, head - n);
  return logPool.slice(start, head).map((line, i) => {
    const t = Math.max(0, time - (n - 1 - i) * 0.18);
    const ms = String(Math.floor((t % 1) * 1000)).padStart(3, "0");
    const s = Math.floor(t);
    const stamp = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${ms}`;
    return `[${stamp}] ${line}`;
  });
}
export function hexDump(progress: number, time: number, seed: number) {
  const tick = Math.floor(time * 6);
  const row = (addr: number, k: number) =>
    Array.from({ length: 8 }, (_, i) =>
      Math.floor(noise(tick + k * 8 + i, seed) * 256)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase(),
    ).join(" ");
  const fault = progress > 0.72;
  return [
    `0x7FFF00  ${row(0, 1)}`,
    `0x7FFF10  ${row(1, 2)}`,
    fault ? "0x7FFF20  [FAULT] SECTOR_4_MEM_ERR" : `0x7FFF20  ${row(2, 3)}`,
    `0x7FFF30  ${row(3, 4)}`,
  ];
}
export function sci(n: number, digits = 1) {
  const [m, e] = n.toExponential(digits).split("e");
  return `${m}E${e.replace("+", "")}`;
}
