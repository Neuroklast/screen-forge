# 17 — Equipment Capability Packs

> ScreenForge concept set · Domain concept (target state) · Language: EN, UI labels DE
> Related: [16-team-templates.md](16-team-templates.md) · [11-data-model.md](11-data-model.md) · [../catalog/components/18-training-controls.md](../catalog/components/18-training-controls.md)

Equipment is stored **capability-based**, not as a per-person item list. Real equipment changes by organization, mission and period; capabilities do not.

## 1. Capability packs

A pack declares the capabilities it provides and the items it suggests. Packs live in `src/core/equipment.ts`:

| Pack | Capabilities | Suggested items |
| --- | --- | --- |
| Field communications | communications, navigation | Radio, antenna |
| Navigation | navigation | Navigation unit, map set |
| Medical (basic / advanced) | medical | Medical pack; monitor (advanced) |
| Sensor | sensor | Sensor, tablet |
| Observation | observation | Optics, observation log |
| Mobility | mobility | Vehicle |
| Protective equipment | protection | Protective equipment |
| Technical | technical | Tool kit, test set |
| Command | command, planning | Command terminal |
| Search | search | Search kit |
| Exercise control | control, evaluation | Control set, observer set |

## 2. Items

```ts
type EquipmentItem = {
  id; packId; name; category; quantity;
  assignedTo: { teamId?; personId? };
  required: boolean;
  status: "ready" | "limited" | "unavailable";
  linkedDeviceId?;
};
```

- `assignedTo` is a **team** or a **person**, never both silently.
- `required` distinguishes a must-have from a suggestion.
- `status` is the readiness of the real asset.
- `linkedDeviceId` links a **real/physical asset** to a **ScreenForge device**: e.g. a sensor tablet assigned to `RAVEN 1` drives the `Tracking Display 2` interface.

## 3. Templates suggest, never force

A team template references packs (`equipmentPacks`). Creating a team turns them into items assigned to that team — **suggestions**, not rigid objects. Removing a team unassigns its equipment (referential integrity) instead of orphaning it.

## 4. Authoring UX

- The team inspector lists the team's equipment with an editable status (`Bereit` / `Eingeschränkt` / `Nicht verfügbar`), a **person picker** (`assignedTo.personId`, members of that team) and a **device picker** that ties the item to a ScreenForge device (`linkedDeviceId`).
- A **readiness roll-up** shows `"Ausrüstung bereit"` or `"{n} erforderliche Ausrüstung nicht bereit"`, counting required items whose status is not `ready`. The same `equipmentReadiness()` helper drives the per-team line and the **scenario-wide** line (`"Ausrüstung gesamt — {ready} / {total} bereit"`), so the two can never disagree.
- Equipment is edited through `forceCommands.updateEquipment` (pure `Scenario → Scenario`), so undo/redo covers it.
- Referential integrity: removing a team unassigns its equipment (`removeTeam`); removing a participant or moving them to another team clears `assignedTo.personId` (`removeParticipant`/`updateParticipant`, and the guided `cleanReferences` path). Clearing a now-invalid pointer is a deliberate exception to the "generated-unmodified only" rule — the item itself is never deleted or otherwise edited.

## 5. Guided integration

Guided mode asks for the team kind, offers the template's recommended composition (one participant per recommended role slot), and only asks about deviations afterwards (`Wie empfohlen` / `Kleiner` / `Größer`). See [16-team-templates.md](16-team-templates.md) §7.

## Acceptance criteria

- [x] Every team template's `equipmentPacks` resolve to a known pack.
- [x] Creating a team from a template creates its equipment items assigned to the team.
- [x] Removing a team unassigns its equipment (no dangling reference).
- [x] Equipment status is editable and localized.
- [x] An item can be linked to a ScreenForge device, and the team shows an equipment readiness roll-up.
- [x] An item can be assigned to a person within its team.
- [x] A scenario-wide readiness roll-up uses the same helper as the per-team roll-up.
