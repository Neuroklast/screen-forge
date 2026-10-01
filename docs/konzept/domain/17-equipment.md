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

- The team inspector lists the team's equipment with its status (`Bereit` / `Eingeschränkt` / `Nicht verfügbar`).
- Equipment is edited through `forceCommands.updateEquipment` (pure `Scenario → Scenario`), so undo/redo covers it.

## 5. Planned (not yet implemented)

- A person-level assignment view and a `linkedDeviceId` picker that ties an item to a device in the Assets workspace.
- A readiness roll-up: a team or scenario is only "ready" when required equipment is `ready`.
- Guided integration: choose a team kind, accept the recommended packs, then only ask about deviations.

## Acceptance criteria

- [x] Every team template's `equipmentPacks` resolve to a known pack.
- [x] Creating a team from a template creates its equipment items assigned to the team.
- [x] Removing a team unassigns its equipment (no dangling reference).
- [x] Equipment status is editable and localized.
