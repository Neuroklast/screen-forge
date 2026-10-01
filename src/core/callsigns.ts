// Fictional callsign system (docs/konzept/domain/16-team-templates.md). ScreenForge
// NEVER pre-fills real callsigns of real units; the roots are neutral nouns and
// the rendered callsign is generated from a scheme, never typed as a raw string.
export type CallsignScheme = {
  root: string;
  elementPattern: string;
  memberPattern: string;
};

export const callsignRoots = [
  "RAVEN",
  "VECTOR",
  "CEDAR",
  "ORBIT",
  "ATLAS",
  "NOMAD",
  "EMBER",
  "SUMMIT",
  "POLARIS",
  "HARBOR",
  "LANTERN",
  "QUARRY",
] as const;

export const defaultCallsignScheme: CallsignScheme = {
  root: "RAVEN",
  elementPattern: "{root} {n}",
  memberPattern: "{base}-{m}",
};

export function randomCallsignRoot(rng: () => number = Math.random): string {
  return callsignRoots[Math.floor(rng() * callsignRoots.length)];
}

// `element` is the team number (1..n), `member` the sub-element number.
export function renderCallsign(
  scheme: CallsignScheme,
  element: number,
  member?: number,
): string {
  const base = scheme.elementPattern
    .replace("{root}", scheme.root)
    .replace("{n}", String(element));
  if (member === undefined) return base;
  return scheme.memberPattern
    .replace("{base}", base)
    .replace("{m}", String(member));
}
