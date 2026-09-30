import { describe, expect, it } from "vitest";
import { isModelAsset } from "./media";

describe("media model detection", () => {
  it("accepts self-contained binary glTF", () => {
    expect(
      isModelAsset({ name: "part.glb", type: "model/gltf-binary" }),
    ).toBe(true);
    expect(isModelAsset({ name: "PART.GLB", type: "" })).toBe(true);
  });

  it("rejects .gltf with external buffers and non-models", () => {
    expect(
      isModelAsset({ name: "part.gltf", type: "model/gltf+json" }),
    ).toBe(false);
    expect(isModelAsset({ name: "photo.png", type: "image/png" })).toBe(false);
  });
});
