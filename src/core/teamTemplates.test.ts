import { describe, expect, it } from "vitest";
import { callsignRoots, randomCallsignRoot, renderCallsign } from "./callsigns";
import { teamRole, teamRoleLabel, teamRoles } from "./roles";
import { generateIdentityName, uniqueIdentityName } from "./scenarioIdentity";
import {
  recommendedStaffing,
  splitTeamTemplates,
  teamTemplate,
  teamTemplates,
} from "./teamTemplates";
import { blankScenario, scenarioSchema } from "./training";

describe("role catalog", () => {
  it("has unique ids and both language labels", () => {
    const ids = new Set(teamRoles.map((role) => role.id));
    expect(ids.size).toBe(teamRoles.length);
    for (const role of teamRoles) {
      expect(role.label, role.id).toBeTruthy();
      expect(teamRoleLabel(role.id), role.id).not.toBe(`role.${role.id}`);
    }
  });
});

describe("team templates", () => {
  it("reference only catalog roles", () => {
    const missing: string[] = [];
    for (const template of teamTemplates)
      for (const slot of [...template.roles, ...template.optionalAttachments])
        if (!teamRole(slot.roleId))
          missing.push(`${template.id}.${slot.roleId}`);
    expect(missing).toEqual([]);
  });

  it("stay within their declared size", () => {
    for (const template of teamTemplates) {
      const recommended = recommendedStaffing(template);
      expect(recommended, template.id).toBeGreaterThanOrEqual(template.size.min);
      expect(recommended, template.id).toBeLessThanOrEqual(template.size.max);
    }
  });

  it("ranks recommended templates per scenario type", () => {
    expect(splitTeamTemplates("medical").recommended[0].id).toBe(
      "medical-response",
    );
    expect(splitTeamTemplates("sar").recommended[0].id).toBe("search-rescue");
    expect(splitTeamTemplates("disposal").recommended[0].id).toBe(
      "special-operations",
    );
  });
});

describe("callsigns", () => {
  const scheme = {
    root: "RAVEN",
    elementPattern: "{root} {n}",
    memberPattern: "{base}-{m}",
  };

  it("renders element and member callsigns", () => {
    expect(renderCallsign(scheme, 1)).toBe("RAVEN 1");
    expect(renderCallsign(scheme, 1, 2)).toBe("RAVEN 1-2");
  });

  it("picks a fictional root", () => {
    expect(callsignRoots).toContain(randomCallsignRoot(() => 0));
  });
});

describe("scenario identity", () => {
  it("generates neutral two-word names", () => {
    expect(generateIdentityName(() => 0.5).split(" ")).toHaveLength(2);
  });

  it("avoids duplicates inside a workspace", () => {
    const taken = [generateIdentityName(() => 0.5)];
    expect(uniqueIdentityName(taken, () => 0.5)).not.toBe(taken[0]);
  });
});

describe("team schema extension", () => {
  it("accepts template, callsign, role and qualifications without migration", () => {
    const scenario = blankScenario("custom");
    const parsed = scenarioSchema.parse({
      ...scenario,
      teams: [
        {
          id: "t1",
          name: "RAVEN 1",
          templateId: "compact-field",
          callsign: "RAVEN 1",
        },
      ],
      stations: [
        {
          id: "s1",
          name: "A",
          role: "element",
          module: "tracking",
          player: true,
          team: "t1",
          roleId: "communications",
          qualifications: ["medical"],
        },
      ],
    });
    expect(parsed.teams[0].templateId).toBe("compact-field");
    expect(parsed.teams[0].callsign).toBe("RAVEN 1");
    expect(parsed.stations[0].roleId).toBe("communications");
    expect(parsed.stations[0].qualifications).toEqual(["medical"]);
  });

  it("keeps the built-in templates resolvable by id", () => {
    expect(teamTemplate("exercise-control")?.category).toBe("exercise-control");
    expect(teamTemplate("missing")).toBeUndefined();
  });
});
