import { useSyncExternalStore } from "react";
import {
  getLocale,
  setLocale,
  subscribeLocale,
  type Locale,
} from "../../i18n";
import { term, termPhrase } from "../../core/terminology";
import {
  getDensity,
  getTerminology,
  preferencesSnapshot,
  setDensity,
  setTerminology,
  subscribePreferences,
} from "../../core/terminology/settings";
import type {
  PhraseParams,
  TermForm,
  TerminologySetting,
  UiDensity,
} from "../../core/terminology/types";

// React binding for the terminology layer. Subscribes to both the locale store
// and the terminology/density preferences so a change re-renders consumers.
function subscribe(onStoreChange: () => void): () => void {
  const offLocale = subscribeLocale(onStoreChange);
  const offPreferences = subscribePreferences(onStoreChange);
  return () => {
    offLocale();
    offPreferences();
  };
}

function snapshot(): string {
  return `${getLocale()}|${preferencesSnapshot()}`;
}

export type TerminologyContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  terminology: TerminologySetting;
  setTerminology: (value: TerminologySetting) => void;
  density: UiDensity;
  setDensity: (value: UiDensity) => void;
  term: (id: string, options?: { form?: TermForm }) => string;
  termPhrase: (id: string, params?: PhraseParams) => string;
  version: string;
};

export function useTerminology(): TerminologyContextValue {
  const version = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    locale: getLocale(),
    setLocale,
    terminology: getTerminology(),
    setTerminology,
    density: getDensity(),
    setDensity,
    term,
    termPhrase,
    version,
  };
}
