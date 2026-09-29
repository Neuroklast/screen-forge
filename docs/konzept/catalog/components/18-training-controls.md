# Catalog — Components: Training Controls

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/training/*` (9 components), `src/views/*` (4), `src/core/useExercise.tsx`, `session.ts`, `training.ts`, `patient.ts`
> Runtime: [../../domain/08-exercise-runtime.md](../../domain/08-exercise-runtime.md) · Control: [../../control/00-control-model.md](../../control/00-control-model.md)

## Views

| View | Role | Purpose | Code |
| --- | --- | --- | --- |
| `TrainerView` | `excon` | 5 tabs: Übersicht, Geräte vorbereiten, Live-Steuerung, Szenario bearbeiten, Personalakten + wizard entry | `TrainerView.tsx` (516) |
| `HqView` | `hq` | Read-only picture: map, objectives, stations, patients, camera feeds, released dossiers, log | `HqView.tsx` (82) |
| `ElementView` | `player` | Station routing: map / camera publish / dossier cards / shunt terminal / medical / stage | `ElementView.tsx` (126) |
| `StageFrame` | training stage | Renders a real scene with `defaults(scene)`, exercise clock, overlays, EXERCISE mark | `StageFrame.tsx` (89) |

## Training components

| Component | Purpose | Key limits | Code |
| --- | --- | --- | --- |
| `ConnectionGate` | Auth gate: EXCON key or device invite; offline banner; back to studio | 10 s auth timeout, 4003 re-auth | `ConnectionGate.tsx` (95) |
| `DeviceTools` | GPS share (player + LIVE), wake lock, fullscreen, logout | GPS only while visible; queue 120 samples | `DeviceTools.tsx` (142) |
| `PatientControl` | EXCON live patient editing: 7 kinds, 8 vital overrides, triage, injuries | Full-object send; resets `since` | `PatientControl.tsx` (103) |
| `TacticalMap` | Leaflet map: zones, positions, accuracy, `SIG_LOST` after 10 s | Tiles only in LIVE + HTTPS; view-only | `TacticalMap.tsx` (110) |
| `CameraFeed` | WebRTC publish (element) / view (HQ); EXCON cut | ICE via env; no TURN; retry every 5 s | `CameraFeed.tsx` (216) |
| `TrainingTerminal` | Shunt terminal: STATUS / DIAGNOSTICS / ISOLATION | Diagnostic required before unlock; 3 s lockout | `TrainingTerminal.tsx` (152) |
| `DossierEditor` / `DossierCards` | Personnel files: fields, events, photo, release flag | Photo ≤ 300 k chars; 40 dossiers | `Dossiers.tsx` (229) |
| `ScenarioWizard` | 5-step guided setup from 4 templates | Seeds 3 dossiers; fixed stations | `ScenarioWizard.tsx` (239) |
| `ScenarioEditor` | Form-based scenario editing: devices, patients, rules, map | 820 lines, no drag & drop; defaults to medical | `ScenarioEditor.tsx` (820) |

## Signal bridge

- Scenes emit `screenforge:input` signals; `ElementView` forwards only the whitelisted `moduleEvents` (`comms.channel`, `comms.ptt`, `slide.open`, `analysis.complete`, `identity.confirmed`) — all other signals are dropped (`ElementView.tsx:13-26`, `training.ts:30-35`).
- Training module UIs differ from film scenes: tracking → map, camera → WebRTC, terminal → dossiers, countdown/access/lock → shunt terminal.

## Target state (Soll)

- MUST replace the wizard's fixed templates with the template library ([../../domain/07-templates.md](../../domain/07-templates.md)) and the editor with the builder ([../../domain/04-mission-builder.md](../../domain/04-mission-builder.md)).
- MUST add the safety role surface (abort in ≤ 2 taps) and the assessor view ([../../domain/02-roles.md](../../domain/02-roles.md)).
- SHOULD automate readiness (permissions, battery, module render) instead of the static checklist ([../../control/02-readiness-monitoring.md](../../control/02-readiness-monitoring.md)).
- SHOULD extend the signal whitelist with new module events (prop, beacon, ordnance) and remove the dead HQ GPS toggle.

## Edge cases

- Invite expired on scan: assignment screen with a request-new-code hint (already implemented).
- Device offline during a module task: task controls disable with a reason; queued GPS still flushes later.
- EXCON reconnect after a crash: session key required again (12 h token, not persisted) — Soll improves this.
- Two devices redeem one invite: second redemption rejected with `"Bereits zugewiesen"`.

## Acceptance criteria

- [ ] Given a QR invite, a tablet reaches its station module in ≤ 60 s.
- [ ] Given `player` role, no rules, codes, or unreleased dossiers appear in any payload.
- [ ] Given safety abort, every connected view shows the abort banner within one tick.
- [ ] Given readiness checks, the start button is gated by automated green states.
