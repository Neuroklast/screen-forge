import type { DomainPack, GuidedIntent } from "../types.ts";
import { disposalPack } from "./disposal.ts";
import { filmPack } from "./film.ts";
import { freePack } from "./free.ts";
import { medicalPack } from "./medical.ts";
import { searchRescuePack } from "./searchRescue.ts";
import { technicalPack } from "./technical.ts";

// Registered packs. The engine never hardcodes a domain; every domain has a
// pack, `free` deliberately contributes nothing.
export const domainPacks: readonly DomainPack[] = [
  searchRescuePack,
  medicalPack,
  technicalPack,
  disposalPack,
  filmPack,
  freePack,
];

// Primary domain first, then enabled packs in declaration order. Duplicates
// collapse so a domain is never evaluated twice.
export function packsForIntent(
  intent: GuidedIntent,
  registry: readonly DomainPack[] = domainPacks,
): DomainPack[] {
  const seen = new Set<string>();
  const packs: DomainPack[] = [];
  for (const id of [intent.primaryDomain, ...intent.enabledDomains]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const pack = registry.find((candidate) => candidate.id === id);
    if (pack) packs.push(pack);
  }
  return packs;
}
