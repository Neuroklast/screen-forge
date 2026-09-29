import { describe, it, expect } from "vitest";
import { sessionFromSearch, stationUrl, wireRole } from "./session";

describe("session routing", () => {
  it("maps public role aliases to wire roles", () => {
    expect(sessionFromSearch("?role=excon").role).toBe("trainer");
    expect(sessionFromSearch("?role=trainer").role).toBe("trainer");
    expect(sessionFromSearch("?role=player").role).toBe("element");
    expect(sessionFromSearch("?role=element").role).toBe("element");
    expect(sessionFromSearch("?role=director").role).toBe("film");
    expect(sessionFromSearch("?role=film").role).toBe("film");
    expect(wireRole("hq")).toBe("hq");
  });

  it("treats bare and unknown URLs as the start page", () => {
    expect(sessionFromSearch("").explicit).toBe(false);
    expect(sessionFromSearch("").role).toBe("film");
    expect(sessionFromSearch("").mode).toBe("film");
    expect(sessionFromSearch("?role=unknown").explicit).toBe(false);
  });

  it("resolves mode, depth and demo", () => {
    expect(sessionFromSearch("?mode=training").role).toBe("trainer");
    expect(sessionFromSearch("?mode=training").explicit).toBe(true);
    expect(sessionFromSearch("?mode=film").role).toBe("film");
    expect(sessionFromSearch("?role=hq").mode).toBe("training");
    expect(sessionFromSearch("?role=hq&depth=advanced").depth).toBe("advanced");
    expect(sessionFromSearch("?role=hq").depth).toBeNull();
    expect(sessionFromSearch("?demo=1").demo).toBe(true);
    expect(sessionFromSearch("?demo=1").mode).toBe("demo");
  });

  it("keeps kiosk, room and station parsing", () => {
    const s = sessionFromSearch("?role=player&room=r1&station=st1&kiosk=1");
    expect(s.kiosk).toBe(true);
    expect(s.room).toBe("r1");
    expect(s.station).toBe("st1");
    expect(s.explicit).toBe(true);
    expect(stationUrl("http://x", "r1", "element", "st1")).toContain(
      "station=st1",
    );
  });
});
