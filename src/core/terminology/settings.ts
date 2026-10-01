import {
  isTerminologySetting,
  isUiDensity,
} from "./profiles";
import type { TerminologySetting, UiDensity } from "./types";

// UI preferences for terminology and density. Language stays owned by the i18n
// store; these two are separate so terminology, language and density can never
// collapse into a single "tactical mode" switch.

export const TERMINOLOGY_KEY = "screenforge.terminology";
export const DENSITY_KEY = "screenforge.ui-density";

export const DEFAULT_TERMINOLOGY: TerminologySetting = "professional";
export const DEFAULT_DENSITY: UiDensity = "operational";

const listeners = new Set<() => void>();

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // No DOM / private mode.
    return null;
  }
}

function initialTerminology(): TerminologySetting {
  const stored = readStored(TERMINOLOGY_KEY);
  return stored && isTerminologySetting(stored) ? stored : DEFAULT_TERMINOLOGY;
}

function initialDensity(): UiDensity {
  const stored = readStored(DENSITY_KEY);
  return stored && isUiDensity(stored) ? stored : DEFAULT_DENSITY;
}

let currentTerminology: TerminologySetting = initialTerminology();
let currentDensity: UiDensity = initialDensity();

function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

function notify(): void {
  for (const fn of listeners) fn();
}

export function getTerminology(): TerminologySetting {
  return currentTerminology;
}

export function setTerminology(value: TerminologySetting): void {
  if (value === currentTerminology) return;
  currentTerminology = value;
  persist(TERMINOLOGY_KEY, value);
  notify();
}

export function getDensity(): UiDensity {
  return currentDensity;
}

export function setDensity(value: UiDensity): void {
  if (value === currentDensity) return;
  currentDensity = value;
  persist(DENSITY_KEY, value);
  notify();
}

export function subscribePreferences(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// Primitive snapshot for useSyncExternalStore; value equality makes it stable.
export function preferencesSnapshot(): string {
  return `${currentTerminology}|${currentDensity}`;
}
