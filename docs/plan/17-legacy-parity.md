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
| Prop kind / ordnance type binding | Geräte (kind + ordnance type) | raw kind + ordnance select | done |
| Station role, module, code, duration | Geräte | raw fields | done |
| Workflow graph + events | Ablauf | graph tab (demo only) | done (Ablauf owns topology) |
| Validation findings | Prüfen | linter panel | done |
| Briefing, template export, start | Prüfen | — | done |
| Undo / redo | header buttons + Ctrl+Z / Ctrl+Y, 50 steps | 50 steps | done |
| Raw MEL / inject structure | Ablauf → `"Rohdaten"` (collapsed) | — | done |
| Multi-select / drag binding | — | drag chip → device | optional |

## Status

The legacy **preparation** surface is removed: `ScenarioSection` no longer embeds
`MissionBuilder`. Preparation parity is complete (undo/redo, ordnance type and
device bindings all editable in the six sections).

`MissionBuilder`, `WorkflowGraph` and `builder.css` remain in the repo **only as
the demo sandbox builder** (`DemoHub`). Removing them is a demo-scope decision,
not a preparation-parity blocker:

- Replace the demo sandbox with a read-only plan summary or a demo-scoped
  builder, then delete the legacy components; **or**
- keep them documented as demo-only.

The e2e verification of the Geräte bindings is still pending (run the artifact
suite).

## Hard rule

There must not be two ways to edit the same scenario topology. The legacy view
already hides its flow tab in preparation (`showFlow={false}`); it must never
regain topology editing.
