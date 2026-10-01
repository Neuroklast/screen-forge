import { afterEach, describe, expect, it, vi } from "vitest";
import { de } from "./de";
import { en } from "./en";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

// One language at a time, never mixed: every locale must define the same keys,
// otherwise `t()` silently falls back to German inside an English UI.
describe("i18n dictionaries", () => {
  it("define exactly the same keys in every locale", () => {
    const deKeys = new Set(Object.keys(de));
    const enKeys = new Set(Object.keys(en));
    const missingInEn = [...deKeys].filter((key) => !enKeys.has(key));
    const missingInDe = [...enKeys].filter((key) => !deKeys.has(key));
    expect({ missingInEn, missingInDe }).toEqual({
      missingInEn: [],
      missingInDe: [],
    });
  });
});

// English is the canonical default product language; a stored locale still wins.
describe("i18n locale default", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("defaults to English when nothing is stored", async () => {
    vi.resetModules();
    vi.stubGlobal("location", { search: "" });
    vi.stubGlobal("localStorage", memoryStorage());
    const i18n = await import("./index");
    expect(i18n.getLocale()).toBe("en");
  });

  it("restores a stored locale", async () => {
    vi.resetModules();
    const store = memoryStorage();
    store.setItem("screenforge.locale", "de");
    vi.stubGlobal("location", { search: "" });
    vi.stubGlobal("localStorage", store);
    const i18n = await import("./index");
    expect(i18n.getLocale()).toBe("de");
  });
});
