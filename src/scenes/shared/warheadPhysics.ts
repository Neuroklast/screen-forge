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
function stamp(t: number) {
  const ms = String(Math.floor((t % 1) * 1000)).padStart(3, "0");
  const s = Math.max(0, Math.floor(t));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${ms}`;
}
export function armingLog(progress: number, time: number, seed: number) {
  const tel = generateTelemetry(progress, time, seed);
  const fz = (1.274 - progress * 0.41).toFixed(3);
  const ig = (4.18 - progress * 3.1).toFixed(2);
  const dT = (0.002 + progress * 0.11).toFixed(3);
  const rows = [
    `[TRAP_CTRL] B_FIELD_AXIAL ${tel.bField.toFixed(4)} T  f_z=${fz} MHz  Q=${(12.4 - progress * 9).toFixed(1)}`,
    `[UHV_PUMP] P=${sci(tel.vacuum, 2)} Torr  I_getter=${ig} mA  stage=${progress < 0.4 ? "HOLD" : "OFFLINE"}`,
    `[CRYO_SYS] T_LHe=${tel.cryo.toFixed(3)} K  dT/dt=${dT} K/s  He-3 flow=${(1.02 - progress * 0.9).toFixed(2)} g/s`,
    `[DIAG] ANNIHILATION_BG ${tel.annihil.toFixed(3)} cps  E_gamma=${tel.gamma.toFixed(3)} MeV  n_flash=${Math.floor(progress * 48)}`,
    `[MAG_SYS] CONTAINMENT_MARGIN ${tel.margin.toFixed(3)} mm  I_coil=${(182 - progress * 170).toFixed(1)} A`,
    `[BEAM] E_e=${tel.eBeam.toFixed(3)} MeV  n_pbar=${sci(tel.pbar, 2)} cm-3  T_perp=${(8.2 + progress * 40).toFixed(1)} K`,
    `[SYS] AIRGAP=${progress >= 0.05 ? "OPEN" : "CLOSED"}  QUENCH=${progress >= 0.2 ? "ARMED" : "INHIBIT"}  SHUNT=${progress >= 0.8 ? "TIMED" : "SAFE"}`,
    `[TRAP_CTRL] quadrupole V_r=${(42.0 * (1 - progress * 0.94)).toFixed(2)} V  plasma r/R=${(0.12 + progress * 0.81).toFixed(3)}`,
  ];
  if (progress >= 0.4)
    rows.push(
      `[DIAG] GAMMA_FLASH ${tel.gamma.toFixed(4)} MeV  positronium rate ${sci(2.1e3 * (1 + progress * 40), 1)} /s`,
    );
  if (progress >= 0.8)
    rows.push(
      `[SYS] PRIMARY_POWER_SHUNT_ARMED  T_break=${(1 - progress).toFixed(2)}  WAITING CIRCUIT_BREAKER`,
    );
  const n = 10;
  const tick = Math.floor(time * 5);
  return Array.from({ length: n }, (_, i) => {
    const idx = (tick + i) % rows.length;
    const t = Math.max(0, time - (n - 1 - i) * 0.2);
    return `[${stamp(t)}] ${rows[idx]}`;
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
