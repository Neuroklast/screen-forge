// Fictional scenario identity (docs/konzept/domain/16-team-templates.md). Four
// separate names: exercise, scenario, operation nickname and team callsign are
// distinct fields, never one string. The generator uses neutral two-word names:
// no nationality, ethnicity, religion, real political actor, current operation,
// trademark or offensive meaning. Callers deduplicate inside a workspace.
export const identityFirstWords = [
  "STEADFAST",
  "SILENT",
  "NORTHERN",
  "GREEN",
  "IRON",
  "QUIET",
  "BRIGHT",
  "DEEP",
] as const;

export const identitySecondWords = [
  "LANTERN",
  "HARBOR",
  "SUMMIT",
  "VECTOR",
  "CEDAR",
  "ORBIT",
  "SHIELD",
  "BEACON",
] as const;

function pick(words: readonly string[], rng: () => number): string {
  return words[Math.floor(rng() * words.length)] ?? words[0];
}

export function generateIdentityName(rng: () => number = Math.random): string {
  return `${pick(identityFirstWords, rng)} ${pick(identitySecondWords, rng)}`;
}

export const generateExerciseName = generateIdentityName;
export const generateOperationNickname = generateIdentityName;

// Generates a name that is not already taken in the workspace.
export function uniqueIdentityName(
  taken: Iterable<string>,
  rng: () => number = Math.random,
): string {
  const used = new Set(taken);
  for (let attempt = 0; attempt < 40; attempt++) {
    const name = generateIdentityName(rng);
    if (!used.has(name)) return name;
  }
  return `${generateIdentityName(rng)} ${used.size + 1}`;
}
