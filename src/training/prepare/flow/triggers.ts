import type { Inject } from "../../../core/training";
import { t } from "../../../i18n";

export const EVENT_TRIGGERS = [
  "timer",
  "zone",
  "manual",
  "prop",
  "signal",
  "intervention",
] as const;

export function triggerLabel(trigger: Inject["trigger"]): string {
  return t(`flow.event.${trigger === "timer" ? "time" : trigger}`);
}
