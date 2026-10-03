import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "./csv";

describe("csvCell", () => {
  it("quotes and escapes embedded quotes", () => {
    expect(csvCell('a "b"')).toBe('"a ""b"""');
  });

  it("neutralises spreadsheet formula injection", () => {
    for (const value of ["=1+1", "+cmd", "-2", "@SUM", "\tx", "\rx"])
      expect(csvCell(value), value).toBe(`"'${value}"`);
  });

  it("leaves plain values untouched", () => {
    expect(csvCell("normal")).toBe('"normal"');
    expect(csvRow(["a", 12])).toBe('"a","12"');
  });
});
