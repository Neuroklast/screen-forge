export type ExperienceProfileId = "easy" | "advanced" | "professional";

export type ExperienceProfile = {
  id: ExperienceProfileId;
  guidance: "high" | "medium" | "minimal";
  informationCompleteness: "full" | "asymmetric" | "role-limited";
  sensorNoise: "none" | "simulated" | "scenario";
  timingTolerance: "generous" | "standard" | "strict";
  failureModel: "recoverable" | "persistent" | "scenario-driven";
  telemetryDetail: "interpreted" | "mixed" | "raw-available";
  symbology: "simple" | "tactical" | "standard-profile";
  confirmations: "strong" | "normal" | "minimal";
  showProvenance: boolean;
};

export const profiles: Record<ExperienceProfileId, ExperienceProfile> = {
  easy: {
    id: "easy",
    guidance: "high",
    informationCompleteness: "full",
    sensorNoise: "none",
    timingTolerance: "generous",
    failureModel: "recoverable",
    telemetryDetail: "interpreted",
    symbology: "simple",
    confirmations: "strong",
    showProvenance: false,
  },
  advanced: {
    id: "advanced",
    guidance: "medium",
    informationCompleteness: "asymmetric",
    sensorNoise: "simulated",
    timingTolerance: "standard",
    failureModel: "persistent",
    telemetryDetail: "mixed",
    symbology: "tactical",
    confirmations: "normal",
    showProvenance: false,
  },
  professional: {
    id: "professional",
    guidance: "minimal",
    informationCompleteness: "role-limited",
    sensorNoise: "scenario",
    timingTolerance: "strict",
    failureModel: "scenario-driven",
    telemetryDetail: "raw-available",
    symbology: "standard-profile",
    confirmations: "minimal",
    showProvenance: true,
  },
};

export function profile(id: string): ExperienceProfile {
  return profiles[id as ExperienceProfileId] ?? profiles.easy;
}

export type Provenance = {
  source: string;
  observedAt: number;
  receivedAt: number;
  accuracy?: number;
  confidence?: number;
};

// Age in ms, computed against an authoritative server time (never a bare
// local clock). "stale" is more important than "offline".
export function provenanceAge(
  value: Provenance,
  serverNow: number,
): { ageMs: number; stale: boolean } {
  const ageMs = Math.max(0, serverNow - value.observedAt);
  return { ageMs, stale: ageMs > 30000 };
}

export function formatAge(ageMs: number): string {
  const seconds = Math.round(ageMs / 1000);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
