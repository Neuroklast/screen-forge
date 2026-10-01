# 16 — Team Templates, Roles and Callsigns

> ScreenForge concept set · Domain concept (target state) · Language: EN, UI labels DE
> Related: [01-glossary.md](01-glossary.md) · [11-data-model.md](11-data-model.md) · [../usability/11-preparation-ia.md](../usability/11-preparation-ia.md)

Teams are not "name + members". A team is a **template-driven composition** of roles, so `Team Alpha` is unambiguously a real element, not a label or a device assignment.

## 1. Role catalog (one owner)

Roles are defined **once** in [../../../src/core/roles.ts](../../../src/core/roles.ts) and reused by every template — a template never invents its own roles. A role is **not** a person and **not** a qualification: a person has one primary role plus zero or more qualifications.

| Semantic id | English | Deutsch (Bundeswehr-nah) | Category |
| --- | --- | --- | --- |
| `team_leader` | Team Leader | Truppführer | Leadership |
| `deputy_leader` | Deputy Team Leader | stv. Truppführer | Leadership |
| `senior_nco` | Senior NCO | erfahrener Unteroffizier | Leadership |
| `operations` | Operations Specialist | Operationsspezialist | Leadership |
| `intelligence` | Intelligence Specialist | Aufklärungsspezialist | Information |
| `communications` | Communications Specialist | Fernmeldespezialist | Communications |
| `medical` | Medical Specialist | Sanitätsspezialist | Medical |
| `technical` | Technical Specialist | Technischer Spezialist | Technical |
| `engineering` | Engineering Specialist | Technikspezialist | Technical |
| `observer` | Observation Specialist | Beobachtungsspezialist | Reconnaissance |
| `sensor_operator` | Sensor Operator | Sensorbediener | Reconnaissance |
| `uas_operator` | UAS Operator | UAS-Bediener | Reconnaissance |
| `k9_handler` | K9 Handler | Diensthundeführer | Special |
| `interpreter` | Interpreter | Sprachmittler | Support |
| `driver` | Driver | Kraftfahrer | Support |
| `logistics` | Logistics Specialist | Logistik | Support |
| `liaison` | Liaison | Verbindungspersonal | Leadership |
| `safety` | Safety Officer | Sicherheitsverantwortlicher | Exercise |
| `controller` | Exercise Controller | Controller | Exercise |
| `observer_controller` | Observer / Controller | Beobachter / Auswerter | Exercise |
| `simulation_operator` | Simulation Operator | Simulationsbediener | Exercise |

Labels resolve through the i18n layer (`role.<id>`); German never lives in core data.

## 2. Team templates

A template states a **recommended composition**, not doctrine. No single "special forces team size" is hardcoded; a compact core plus optional attachments replaces fixed variants.

```ts
type TeamRoleSlot = { roleId; min; recommended; max; required; capabilityTags[] };
type TeamTemplate = {
  id; label;
  category: "field" | "special-operations" | "recon" | "search-rescue"
          | "medical" | "technical" | "command" | "exercise-control" | "custom";
  doctrineProfile: "generic" | "nato" | "bundeswehr" | "custom";
  size: { min; recommended; max };
  roles: TeamRoleSlot[];
  optionalAttachments: TeamRoleSlot[];
  callsignScheme?; equipmentPacks?; tags[];
};
```

Built-ins (`src/core/teamTemplates.ts`):

| Template | Size (min–max) | Core roles |
| --- | --- | --- |
| Compact Field Team | 3–8 | Lead, Comms, Medical, Technical |
| Special Operations Team | 4–8 | Lead + three specialisms |
| SF Detachment Style | 8–16 | Leadership, Ops/Intel, doubled specialisms |
| Recon / Observation Team | 4–6 | Lead, Observer, Comms, Sensor, Medical optional |
| Search & Rescue Team | 4–6 | Lead, Search, Medical, Comms, Technical optional |
| Medical Response Team | 3–6 | Lead, Medical, Comms, Logistics optional |
| Technical Response Team | 3–5 | Lead, Technical, Sensor, Safety, Comms optional |
| Command / HQ Cell | 4–8 | Command, Ops, Information, Comms, Logistics/Liaison optional |
| Exercise Control Cell | 4–8 | Controller, Observer/Controller, Simulation, Safety, Ops, Technical optional |

`recommended` counts are **ScreenForge recommended composition**, never a claim about a real unit.

## 3. Callsigns (fictional)

A callsign is a **scheme**, not a raw string: `{ root, elementPattern, memberPattern }` renders `RAVEN 1`, `RAVEN 1-1`, `RAVEN 1 / LEAD`. Roots come from a neutral fictional list (`src/core/callsigns.ts`). ScreenForge **never** pre-fills real callsigns of real units.

## 4. Scenario identity (four separate names)

`exerciseName`, `scenarioName`, `operationNickname` and `callsign` are four distinct fields. `src/core/scenarioIdentity.ts` generates neutral two-word names; the rules are: no nationality, ethnicity, religion, real political actor, current operation, trademark or offensive meaning, and no duplicates inside a workspace.

## 5. Schema (additive, no migration)

- `team.templateId?`, `team.callsign?`, `team.parentTeamId?` — hierarchy (Team / Squad / Detachment / Cell / HQ / Task Group) without separate schemas.
- `station.roleId?`, `station.qualifications?[]` — a person's primary team role plus qualifications.

All fields are optional, so existing scenarios parse unchanged.

## 6. Authoring UX

- `"Team aus Vorlage"` opens a picker: scenario-relevant templates first, the rest behind `"Mehr…"`, each with size and core roles.
- Creating a team from a template generates a fictional callsign and one participant per recommended role slot; the team inspector shows `staffed / recommended` and per-role staffing.

## 7. Planned (not yet implemented)

- **Equipment**: capability packs, `status` and `linkedDeviceId` (physical asset → ScreenForge device) and the team readiness roll-up are implemented; still open are person-level assignment (`assignedTo`) and a scenario-wide readiness roll-up.
- **Scenario templates** with `intent`, `environment`, `organization`, `assets`, `scenario`, `flow`, `evaluation`, `control`, `review`, `defaults`. Variants are implemented as `base + overrides`: a `MissionVariant` carries a `ScenarioPatch`, `applyVariant(base, variant)` merges id-keyed entity arrays by id (replace existing, append new), merges nested objects shallowly and replaces scalars, then re-parses through `scenarioSchema`; nothing is ever deleted. The gallery lists each variant under its base card. Full sectioned templates remain open.
- **Guided integration**: ask for the team kind, offer the recommended composition, then only ask about deviations.

## Acceptance criteria

- [ ] A team can be created from a template with one click and a fictional callsign.
- [ ] The team inspector shows staffing against the template's recommended composition.
- [ ] No template invents a role outside the catalog.
- [ ] Role and template labels resolve through the i18n layer.
- [ ] Existing scenarios parse unchanged (all new fields optional).
