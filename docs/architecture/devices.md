# Contract — Devices, Assets and Surfaces

## Purpose

The authoring UI reasons about four understandable concepts; the storage shape of `TrainingStation` is an implementation detail and never leaks into the normal editor.

```text
Person / Force     a participant, actor or patient
Asset / Device     an interface the operator uses
World Object       a prop (ordnance, beacon, payload, …)
Interface/Surface  what an asset actually displays
```

A participant is currently a station with `player: true`; that stays storage. The UI projects it through a derived view model and never presents a person as a device.

## Owner

- Derived authoring view: `src/training/prepare/assetView.ts` (`assetView`, `assetDetail`). Pure projection — never persisted, never a second source of truth.
- Runtime surface dispatch: `src/training/DeviceSurface.tsx` (one decision point for field and preview).
- Scene rendering: `src/views/StageFrame.tsx` + `src/scenes/Scenes.tsx`.

## Rules

- A person is never shown as an asset. A player station renders as its asset profile with `"Assigned to: <person>"`.
- A prop and its bound interface are one logical thing in the navigator (prop row + interface child), not two unrelated siblings.
- The normal editor does not expose `module`, `scene`, `presentation`, `capabilities`, `bindings` or `role`; they live behind `"Advanced"`. The user picks a profile; ScreenForge decides the module, the required world object and sensible defaults.
- One renderer per capability: `DeviceSurface` is the single dispatch for field and preview.

## Surface resolution (started)

`deviceSurfaceKind` (`src/training/deviceSurfaceKind.ts`) is the single pure mapping from a device + runtime state + host to a surface kind (`workflow`/`connect`/`map`/`camera`/`console`/`ordnance`/`beacon`/`datasheet`/`scene`). `DeviceSurface` switches on the result instead of cascading on `module`. This is the first step toward the profile+surface model; the runtime behaviour is unchanged.

## Target — profile + surface (not yet implemented)

The full target model:

```text
Device
  profile        // capability + defaults ("Ordnance console", "Field terminal")
  bindings       // world objects / people
  surface        // what renders (integrated display, service console, …)
  presentation   // look/identity
```

- A **profile** sets the defaults (module, required world object, default surface).
- A **surface** determines what renders; the runtime renders the surface.
- A logical device may have several plausible surfaces without new `if (module === …)` cascades.

Migration: introduce profiles incrementally behind the existing `DeviceSurface` dispatch; never create a second renderer; keep the field behaviour identical while a profile is adopted.

## Known exceptions

- `DeviceSurface` still dispatches on `module`/scene; the profile/surface split is a planned migration, not a current guarantee.

## Migration notes

- Add a profile only when a device archetype needs it; extend `assetView` for authoring, not the schema.
