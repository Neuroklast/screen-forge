import { de } from "./de.ts";
import { en } from "./en.ts";

export type Locale = "de" | "en";
export type Params = Record<string, string | number>;

const dictionaries: Record<Locale, Record<string, string>> = { de, en };
const listeners = new Set<() => void>();

function initialLocale(): Locale {
  try {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "de" || fromUrl === "en") return fromUrl;
    const stored = localStorage.getItem("screenforge.locale");
    if (stored === "de" || stored === "en") return stored;
  } catch {
    /* no DOM / private mode */
  }
  return "en";
}

let current: Locale = initialLocale();

// Keep the document language in sync with the active locale so assistive tech
// and translation tools see the right language.
function applyDocumentLang(): void {
  try {
    document.documentElement.lang = current;
  } catch {
    /* no DOM / Node */
  }
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  try {
    localStorage.setItem("screenforge.locale", locale);
  } catch {
    /* noop */
  }
  applyDocumentLang();
  for (const fn of listeners) fn();
}

applyDocumentLang();

export function subscribeLocale(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// In-world content is art direction and must stay English in every locale
// (AGENTS.md: "Element content (scenes, blocks, field consoles) MUST be
// English"; concept U12 §7). These namespaces are never auto-translated:
// scenes, the operator/field shell, and the fictional device consoles.
// `device.preset.*` is trainer chrome even though it shares the `device.`
// prefix, so it stays translated.
const CONTENT_PREFIXES = [
  "scene.",
  "terminal.",
  "field.",
  "ordnance.",
  "beacon.",
  "camera.",
];
function isContentKey(key: string): boolean {
  if (key.startsWith("device.") && !key.startsWith("device.preset.")) return true;
  return CONTENT_PREFIXES.some((prefix) => key.startsWith(prefix));
}

// English is the default. Every locale must define the same keys (guarded by
// i18n.test.ts); a missing key falls back to the key itself so a gap is visible
// instead of silently mixing languages.
export function t(key: string, params?: Params): string {
  // Never fall back to another language: that would mix locales. A missing key
  // shows the key so the gap is obvious and testable. In-world content always
  // resolves English regardless of the active locale.
  const locale = isContentKey(key) ? "en" : current;
  const template = dictionaries[locale][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  );
}
