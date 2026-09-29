import { describe, expect, it } from "vitest";
import { leafletAdapter, selectAdapter, vectorAdapter } from "./adapters";

describe("map adapters", () => {
  it("prefers a local package when offline is required", () => {
    const adapter = selectAdapter({ offline: true, richVector: true });
    expect(adapter.offlineCapable).toBe(true);
    expect(adapter.tiles).toBe("local-package");
  });

  it("uses a vector adapter only when rich vectors are needed and offline is not", () => {
    expect(selectAdapter({ offline: false, richVector: true })).toBe(
      vectorAdapter,
    );
    expect(selectAdapter({ offline: false, richVector: false })).toBe(
      leafletAdapter,
    );
  });

  it("marks the vector adapter as WebGL2-only", () => {
    expect(vectorAdapter.requiresWebGL2).toBe(true);
    expect(leafletAdapter.requiresWebGL2).toBe(false);
  });
});
