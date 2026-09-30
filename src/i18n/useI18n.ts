import { useSyncExternalStore } from "react";
import { getLocale, setLocale, subscribeLocale, t, type Locale } from "./index";

// React binding: components re-render when the locale changes.
export function useI18n(): {
  t: typeof t;
  locale: Locale;
  setLocale: typeof setLocale;
} {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { t, locale, setLocale };
}
