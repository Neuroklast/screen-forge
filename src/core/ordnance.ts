import { z } from "zod";

// Fictional ordnance catalogue. Entries model exercise states, methods and
// failure modes only — never real wiring, chemistry or render-safe procedures.
export const ordnanceOutcomes = ["ignition", "degrade", "lockout"] as const;
export type OrdnanceOutcome = (typeof ordnanceOutcomes)[number];

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const line = z.string().trim().min(1).max(120);

export const ordnanceMethodSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  steps: z.array(line).min(1).max(12),
});
export type OrdnanceMethod = z.infer<typeof ordnanceMethodSchema>;

export const ordnanceFailureSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  trigger: z.string().trim().min(1).max(160),
  outcome: z.enum(ordnanceOutcomes),
});
export type OrdnanceFailure = z.infer<typeof ordnanceFailureSchema>;

export const ordnanceTypeSchema = z.object({
  id,
  category: z.string().trim().min(1).max(40),
  designation: z.string().trim().min(1).max(80),
  summary: z.string().max(400).default(""),
  stages: z.array(line).min(1).max(12),
  methods: z.array(ordnanceMethodSchema).min(1).max(6),
  failures: z.array(ordnanceFailureSchema).max(8).default([]),
  datasheetId: z.string().max(40).default(""),
});
export type OrdnanceType = z.infer<typeof ordnanceTypeSchema>;

const CATALOG: OrdnanceType[] = [
  {
    id: "cb-09",
    category: "containment",
    designation: "CB-09 Containment Assembly",
    summary:
      "Fictional containment assembly used for staged isolation exercises.",
    stages: [
      "Isolate control shunt",
      "Verify containment seal",
      "Transfer charge to safe state",
      "Confirm inert",
    ],
    methods: [
      {
        id: "remote",
        name: "Remote isolation",
        steps: [
          "Confirm area is clear",
          "Enable remote control link",
          "Run stages in order",
          "Confirm inert readout",
        ],
      },
      {
        id: "manual",
        name: "Manual transfer",
        steps: [
          "Confirm area is clear",
          "Enable manual control link",
          "Run stages in order",
          "Confirm inert readout",
        ],
      },
    ],
    failures: [
      {
        id: "stage-order",
        name: "Stage out of order",
        trigger: "A stage is started before the previous one completes",
        outcome: "ignition",
      },
      {
        id: "shunt-bridged",
        name: "Shunt bridged",
        trigger: "Control shunt is bypassed during transfer",
        outcome: "ignition",
      },
      {
        id: "timer",
        name: "Timer expiry",
        trigger: "Countdown reaches zero before the last stage",
        outcome: "ignition",
      },
    ],
    datasheetId: "09-C",
  },
  {
    id: "sm-02",
    category: "spaltmaterial",
    designation: "SM-02 Spaltmaterial Assembly",
    summary:
      "Fictional core assembly for containment and transfer coordination drills.",
    stages: [
      "Isolate control shunt",
      "Verify coolant loop",
      "Transfer core to safe state",
      "Confirm inert",
    ],
    methods: [
      {
        id: "controlled",
        name: "Controlled transfer",
        steps: [
          "Confirm area is clear",
          "Enable controlled transfer link",
          "Run stages in order",
          "Confirm inert readout",
        ],
      },
    ],
    failures: [
      {
        id: "coolant-loss",
        name: "Coolant loss",
        trigger: "Coolant loop fails during transfer",
        outcome: "degrade",
      },
      {
        id: "stage-order",
        name: "Stage out of order",
        trigger: "A stage is started before the previous one completes",
        outcome: "ignition",
      },
    ],
    datasheetId: "SM-02",
  },
  {
    id: "pk-01",
    category: "payload",
    designation: "PK-01 Payload Core",
    summary: "Fictional data-core prop for access and lockout exercises.",
    stages: ["Isolate control shunt", "Release payload interlock", "Confirm inert"],
    methods: [
      {
        id: "keycard",
        name: "Keycard release",
        steps: [
          "Confirm area is clear",
          "Present valid keycard",
          "Run stages in order",
          "Confirm inert readout",
        ],
      },
    ],
    failures: [
      {
        id: "interlock",
        name: "Interlock engaged",
        trigger: "Payload interlock is forced",
        outcome: "lockout",
      },
    ],
    datasheetId: "PK-01",
  },
].map((entry) => ordnanceTypeSchema.parse(entry));

export function ordnanceTypes(): OrdnanceType[] {
  return CATALOG;
}

export function ordnanceType(ordnanceId: string): OrdnanceType | undefined {
  return CATALOG.find((entry) => entry.id === ordnanceId);
}

// Custom types defined by a mission override the built-in catalogue entry.
export function resolveOrdnanceType(
  ordnanceId: string,
  custom: OrdnanceType[] = [],
): OrdnanceType | undefined {
  return custom.find((entry) => entry.id === ordnanceId) ?? ordnanceType(ordnanceId);
}

export function ignitionFailures(entry: OrdnanceType): OrdnanceFailure[] {
  return entry.failures.filter((failure) => failure.outcome === "ignition");
}
