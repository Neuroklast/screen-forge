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

// English is the default. Every locale must define the same keys (guarded by
// i18n.test.ts); a missing key falls back to the key itself so a gap is visible
// instead of silently mixing languages.
export function t(key: string, params?: Params): string {
  // Never fall back to another language: that would mix locales. A missing key
  // shows the key so the gap is obvious and testable.
  const template = dictionaries[current][key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  );
}
