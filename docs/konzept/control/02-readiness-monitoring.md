# Control — Readiness & Monitoring

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-control-model.md](00-control-model.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)

## Purpose

Before the exercise: know that every device, permission, and module is ready. During the exercise: see the health of the technical setup, get alerts for failures, and fix devices remotely. No surprises from technology while training is running.

## Readiness checks (automated)

| Check | Source | Green when |
| --- | --- | --- |
| Device online | presence | seen ≤ 10 s |
| Module rendered | device ACK | module reports ready after load |
| Permissions | device ACK | GPS (player, LIVE) / camera granted or explicitly skipped |
| Battery | device report | > 20 % (warning < 35 %) |
| App version | device hello | matches server version (warning on mismatch) |
| Clock sync | device report | server-clock offset < 2 s |
| Station binding | mission data | station exists and role matches |

- The readiness panel shows one row per station with red/yellow/green and a fix hint (`"Standort erlauben"`, `"Neu laden"`).
- `"Übung starten"` is gated: errors block, warnings require confirmation.
- Readiness re-evaluates live; a device dropping after green turns red immediately.

## Monitoring (during exercise)

| Signal | Alert | Severity |
| --- | --- | --- |
| Device offline | `"Terminal 01 offline"` | warning |
| Camera feed lost | `"Kamera 02: kein Signal"` | warning |
| GPS stale (`SIG_LOST`) | map marker gray + list entry | info |
| Inject fired | timeline entry, optional sound | info |
| Objective completed | toast + timeline | info |
| Wrong code lockout | `"Terminal 01: Sperre aktiv"` | info |
| Server tick slow (> 100 ms) | status chip in header | warning |
| Persistence failure | banner `"Speicherung fehlgeschlagen"` | error |

- Alerts appear in a single feed with filters (severity, station); they are distinct from the event log.
- Alerts MUST also appear on the safety surface (device drops are safety-relevant).

## Remote device actions (technician/EXCON)

| Action | Effect | Guard |
| --- | --- | --- |
| Reload module | device re-fetches mission revision | paused or explicit confirm while running |
| Push module change | device switches module after revision bump | paused only |
| Lock screen | device shows `"Gesperrt durch Übungsleitung"` | any phase |
| Wake/fullscreen | best-effort via wake lock / fullscreen API | any phase |
| Reset station state | clears local UI state, keeps session | any phase |
| Revoke session | device returns to assignment screen | any phase, logged |

- Remote actions are commands over the existing WebSocket; devices acknowledge and report results.

## Multi-room dashboard

- Room list with: name, mission, phase, clock, connected devices, last activity.
- Actions: create, open, duplicate (mission copy, fresh state), delete (confirm + export first), export debrief.
- Per-room isolation stays as today (one mission per room); the dashboard is read-mostly plus lifecycle actions.
- The dashboard MUST work on the same server key; per-room keys are out of scope for now.

## Server health

| Metric | Display |
| --- | --- |
| Uptime, version | header |
| Rooms / sockets | dashboard |
| Tick duration (avg/p95) | dashboard |
| Persistence status + last save | dashboard |
| Invite/credential counts | dashboard |

- Health data is local only; no external monitoring service.

## Target state (Soll)

- Implement device ACK protocol (module ready, permissions, battery, version) — today none exists.
- Implement the readiness panel with gating; replace the static checklist.
- Implement alerts and the remote action set.
- Implement the multi-room dashboard; today rooms exist server-side but have no UI.

## Acceptance criteria

- [ ] Given a device without GPS permission in a LIVE exercise, readiness shows red with a fix hint.
- [ ] Given a device drop, an alert appears on EXCON and safety within 5 s.
- [ ] Given a remote lock, the device shows the lock screen within one tick.
- [ ] Given two rooms, the dashboard shows both with live phase and device counts.
