import { describe, expect, it } from "vitest";
import { chainFor, profileFor } from "./profiles";

describe("terminology profiles", () => {
  it("orders the de-spezkr chain with fallback to de-bundeswehr", () => {
    expect(chainFor("de-spezkr")).toEqual([
      "de-spezkr",
      "de-bundeswehr",
      "de-professional",
      "de-general",
      "en-professional",
      "en-general",
    ]);
  });

  it("orders the en-military chain", () => {
    expect(chainFor("en-military")).toEqual([
      "en-military",
      "en-professional",
      "en-general",
    ]);
  });

  it("keeps the same-language professional fallback for de-general", () => {
    expect(chainFor("de-general")).toEqual([
      "de-general",
      "de-professional",
      "en-professional",
      "en-general",
    ]);
  });

  it("maps language + terminology settings to profiles", () => {
    expect(profileFor("en", "general")).toBe("en-general");
    expect(profileFor("en", "professional")).toBe("en-professional");
    expect(profileFor("en", "military")).toBe("en-military");
    expect(profileFor("en", "spezkr")).toBe("en-military");
    expect(profileFor("de", "general")).toBe("de-general");
    expect(profileFor("de", "professional")).toBe("de-professional");
    expect(profileFor("de", "military")).toBe("de-bundeswehr");
    expect(profileFor("de", "spezkr")).toBe("de-spezkr");
  });
});
