export type SymbologyProfile = "simple" | "mil2525" | "authorized-app6";

export type SymbolDescriptor = {
  affiliation: "friend" | "hostile" | "neutral" | "unknown";
  status: "present" | "planned" | "critical";
  dimension: "ground" | "air" | "sea" | "subsurface";
  type: string;
  modifiers?: string[];
};

export type SymbologyProvider = {
  profile: SymbologyProfile;
  standardVersion: string;
};

// Semantics live on the entity; the provider only decides the rendering. A
// status is always readable without color (text modifier).
export function statusModifier(status: SymbolDescriptor["status"]): string {
  if (status === "critical") return "!";
  if (status === "planned") return "~";
  return "";
}

export function renderSymbol(
  descriptor: SymbolDescriptor,
  provider: SymbologyProvider,
): string {
  const base = `${descriptor.affiliation[0].toUpperCase()}${descriptor.dimension[0].toUpperCase()}-${descriptor.type}`;
  if (provider.profile === "simple") return descriptor.type;
  if (provider.profile === "mil2525")
    return `${base}${statusModifier(descriptor.status)}`;
  return `${base}${statusModifier(descriptor.status)}@${provider.standardVersion}${
    descriptor.modifiers?.length ? ":" + descriptor.modifiers.join(",") : ""
  }`;
}
