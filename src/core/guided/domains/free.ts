import type { DomainPack } from "../types.ts";

// Free pack: an explicit empty canvas. The domain exists so the user can author
// without any domain guidance; it contributes no questions or suggestions.
export const freePack: DomainPack = {
  id: "free",
  token: "free",
  scenarioType: "custom",
  questions: [],
  rules: [],
};
