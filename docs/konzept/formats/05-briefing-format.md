# Formats — Mission Briefing (full text)

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/core/briefing.ts` (`missionBriefing`, `briefingFilename`) · Related: [../domain/07-templates.md](../domain/07-templates.md) · [../control/04-debrief-replay-aar.md](../control/04-debrief-replay-aar.md)

## Purpose

From a built mission, generate a **full-text briefing** in English, structured like an operational order (SMEAC/OPORD). It turns the mission data (stations, entities, objectives, injects, map, teams) into a readable command brief for the exercise force.

## Structure (normative)

```text
UNCLASSIFIED // EXERCISE
OPERATION <NAME> — MISSION BRIEFING
Reference: mission <slug> · Data source: LIVE|PLAYBACK · Seed <n>
Issued: <date>            (optional)

1. SITUATION
   a. General.   b. Terrain.   c. Opposing/environmental factors.   d. Friendly forces.
2. MISSION
3. EXECUTION
   a. Concept of operations.  b. Tasks.  c. Objectives.  d. Timeline (Master Event List).
4. SUPPORT / ADMINISTRATION & LOGISTICS
   a. Devices.  b. Casualties.  c. Equipment.
5. COMMAND & SIGNAL
   a. Command.  b. Signals.  c. Safety.

ANNEX A — Entity register
ANNEX B — Event purposes
END OF BRIEFING // EXERCISE
```

## Derivation rules

| Section | Derived from |
| --- | --- |
| Operation name | mission `name` (uppercased) |
| Reference | slug of `name`, `mode`, `seed` |
| 1.a General | station counts (field vs HQ) |
| 1.b Terrain | `map.lat/lng/zoom`, `zones` |
| 1.c Factors | `injects.length` |
| 1.d Friendly | `teams`, every station with its English module label |
| 2 Mission | objective names joined into one sentence |
| 3.b Tasks | each station + module label + bound entities |
| 3.c Objectives | `objectives[]` |
| 3.d Timeline | `injects[]` with `T+mm:ss` (timer) or trigger name |
| 4 Devices/Casualties/Equipment | `stations`, `patients`, `props` |
| Annex A | `dossiers`, `actors` |
| Annex B | `injects[]` actions |

## Rules

- English only; fictional framing: `UNCLASSIFIED // EXERCISE`, no real unit names, no tactical or weapons procedures.
- Deterministic: same mission + same date yields the same text.
- Module ids are mapped to readable English labels; unknown ids fall back to the id.
- The briefing is generated on demand (no storage); export as `.txt`, copy to clipboard.

## Target state (Soll)

- MUST follow the SMEAC/OPORD structure above and mark the output `EXERCISE`.
- MUST derive every line from mission data; never invent units, places or capabilities.
- SHOULD support an optional `date` and a printable variant.
- MAY offer a German companion text alongside the English briefing.

## Acceptance criteria

- [ ] Given a built mission, the briefing contains sections 1–5, Annexes A/B and the EXERCISE marks.
- [ ] Given objectives, stations and a timer inject, they appear in the correct sections.
- [ ] Given the same mission and date, the output is identical.
- [ ] The export filename is `briefing-<slug>.txt`.
