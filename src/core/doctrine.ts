import { z } from "zod";

export const marchSteps = ["M", "A", "R", "C", "H"] as const;
export const marchStatuses = ["assessed", "pending", "not-assessed"] as const;

export const doctrinePackSchema = z.object({
  doctrineId: z.string().max(40),
  version: z.number().int().min(1),
  effectiveDate: z.string().max(20),
  supportedTrainingObjectives: z
    .array(z.string().max(120))
    .max(20)
    .default([]),
  patientStateDefinitions: z.array(z.string().max(40)).max(40).default([]),
  interventionVocabulary: z.array(z.string().max(40)).max(40).default([]),
  evaluationRules: z.array(z.string().max(120)).max(40).default([]),
  displayTerminology: z.record(z.string(), z.string().max(80)).default({}),
  references: z.array(z.string().max(200)).max(20).default([]),
});
export type DoctrinePack = z.infer<typeof doctrinePackSchema>;

export const doctrinePacks: DoctrinePack[] = [
  doctrinePackSchema.parse({
    doctrineId: "medical",
    version: 1,
    effectiveDate: "2026-01-01",
    supportedTrainingObjectives: ["Triage", "Handover"],
    patientStateDefinitions: [
      "stable",
      "tachy",
      "brady",
      "desat",
      "trauma",
      "arrest",
      "recovered",
    ],
    interventionVocabulary: ["treated", "tourniquet", "oxygen", "evacuated"],
    evaluationRules: ["triage before treatment", "handover complete"],
    displayTerminology: { triage: "Sichtung" },
    references: ["fiction"],
  }),
];

// Missions pin a doctrine version so an old exercise stays reproducible after
// the pack is updated.
export function doctrine(id: string, version?: number): DoctrinePack {
  const matches = doctrinePacks.filter((p) => p.doctrineId === id);
  if (!matches.length) throw new Error(`Unknown doctrine pack: ${id}`);
  if (version !== undefined) {
    const pinned = matches.find((p) => p.version === version);
    if (!pinned) throw new Error(`Unknown ${id}@${version}`);
    return pinned;
  }
  return matches[matches.length - 1];
}

export type MarchStep = (typeof marchSteps)[number];
export type MarchStatus = (typeof marchStatuses)[number];
export type MarchAssessment = Partial<Record<MarchStep, MarchStatus>>;

// Assessment log only: records what was checked and when, never a procedure.
export function assessMarch(
  current: MarchAssessment,
  step: MarchStep,
  status: MarchStatus,
): MarchAssessment {
  return { ...current, [step]: status };
}

export function marchProgress(assessment: MarchAssessment): {
  assessed: number;
  total: number;
} {
  const assessed = marchSteps.filter(
    (step) => assessment[step] === "assessed",
  ).length;
  return { assessed, total: marchSteps.length };
}
