# Plan 17 — Legacy MissionBuilder Parity & Removal

> ScreenForge concept set · Implementation plan · Status: audit complete, removal blocked
> Related: [../konzept/usability/11-preparation-ia.md](../konzept/usability/11-preparation-ia.md) · [../konzept/domain/04-mission-builder.md](../konzept/domain/04-mission-builder.md)

The legacy `MissionBuilder` plan view (`src/builder/MissionBuilder.tsx`) is
reachable only under Szenario → `"Expertenmodus (Legacy)"` (`showFlow={false}`)
and as the demo sandbox. It must be removed once every capability below is
available through the six preparation sections. It must not be kept indefinitely
as a second mental model.

## Parity checklist

| Capability | Six sections | Legacy only | Action |
| --- | --- | --- | --- |
| Scenario name / type / mode | Szenario | — | done |
| Capabilities, zones, objectives | Szenario | — | done |
| Teams, participants, actors, patients, triage | Teilnehmer | — | done |
| Patient state (kind) editing | Teilnehmer | — | done |
| Dossiers per person | Teilnehmer (`DossierEditor`) | — | done |
| Devices, owner, presentation | Geräte | — | done |
| Prop kind / ordnance type binding | Geräte | raw kind + ordnance select | verify in Geräte |
| Station role, module, code, duration | Geräte | raw fields | verify in Geräte |
| Workflow graph + events | Ablauf | graph tab (demo only) | done (Ablauf owns topology) |
| Validation findings | Prüfen | linter panel | done |
| Briefing, template export, start | Prüfen | — | done |
| **Undo / redo** | — | Ctrl+Z / Ctrl+Y, 50 steps | **gap** |
| Raw MEL / inject structure | Ablauf → `"Rohdaten"` (collapsed) | — | done |
| Multi-select / drag binding | — | drag chip → device | optional |

## Exit condition

Remove `MissionBuilder`, `WorkflowGraph` and `builder.css` when:

1. Undo/redo exists for preparation edits (draft history) **or** is explicitly
   declared out of scope.
2. The station role/module/code/duration and prop/ordnance bindings are editable
   in Geräte (verified by an e2e journey, not by inspection).
3. The demo sandbox no longer imports `MissionBuilder` (route it through the six
   sections or a read-only plan summary).

Until then the legacy view stays read/write-compatible and gets no new UX.

## Hard rule

There must not be two ways to edit the same scenario topology. The legacy view
already hides its flow tab in preparation (`showFlow={false}`); it must never
regain topology editing.
