import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("terminology settings", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to professional terminology and operational density", async () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const settings = await import("./settings");
    expect(settings.getTerminology()).toBe("professional");
    expect(settings.getDensity()).toBe("operational");
  });

  it("persists and notifies terminology and density independently", async () => {
    vi.stubGlobal("localStorage", memoryStorage());
    const settings = await import("./settings");
    const listener = vi.fn();
    const off = settings.subscribePreferences(listener);

    settings.setTerminology("military");
    expect(settings.getTerminology()).toBe("military");
    expect(settings.getDensity()).toBe("operational");

    settings.setDensity("full");
    expect(settings.getDensity()).toBe("full");
    expect(listener).toHaveBeenCalledTimes(2);

    expect(localStorage.getItem("screenforge.terminology")).toBe("military");
    expect(localStorage.getItem("screenforge.ui-density")).toBe("full");
    off();
  });

  it("ignores invalid stored values", async () => {
    const store = memoryStorage();
    store.setItem("screenforge.terminology", "nonsense");
    store.setItem("screenforge.ui-density", "nonsense");
    vi.stubGlobal("localStorage", store);
    const settings = await import("./settings");
    expect(settings.getTerminology()).toBe("professional");
    expect(settings.getDensity()).toBe("operational");
  });
});
