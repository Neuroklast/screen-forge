# 08 — Exercise Runtime

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Roles: [02-roles.md](02-roles.md). Entities: [06-entities-and-props.md](06-entities-and-props.md).

## Topology

- One **room** ("Übungsraum") holds one mission plus live state; server is authoritative.
- Server: Node process (`server/exercise.mjs` today) serving `dist/` + WebSocket `/exercise` on the LAN.
- Clients: EXCON console, HQ, field devices, assessor view. Film/demo run without the server.
- Tick: 250 ms; full state on change, clock-only ticks otherwise; deterministic simulation from `seed`.
- Data classes: commands (durable, deduplicated), domain events (server-sequenced, replayable), telemetry (latest-wins), media (WebRTC) — [../control/05-sync-and-durability.md](../control/05-sync-and-durability.md).

## Clock and lifecycle

| Phase | Meaning | Allowed actions |
| --- | --- | --- |
| `draft` | Mission being authored | Build/edit, provision devices |
| `ready` | Readiness checklist green | Start, edit (back to draft) |
| `running` | Clock runs | Injects, interventions, messages, abort |
| `paused` | Clock frozen | Edits allowed (bumps revision), resume |
| `aborted` | Safety/EXCON abort | Reset to baseline, debrief |
| `ended` | Time/objectives finished | Debrief, export, reset |

- `"Übung starten"` MUST require: ≥1 station, linter clean, at least one connected device (warning only if none).
- `reset` restores the baseline snapshot (mission + initial entity states) without losing the mission.
- Abort is distinct from pause: abort sets `aborted`, surfaces a full-screen banner on all devices, and cannot be resumed — only reset.
- Time model: `serverNow`, `exerciseElapsed`, `deadlineAtServer`, `clockState`, `clockRevision`; the display is a prediction, the server is authority ([../control/05-sync-and-durability.md](../control/05-sync-and-durability.md)).
- Durability: accepted commands become immutable, server-sequenced domain events in an append-only journal; clients resume from `lastServerSeq`.

## Injects (rules engine)

Trigger types: `timer`, `zone`, `intervention`, `prop`, `signal`, `manual`.

| Trigger | Fires when | Fields |
| --- | --- | --- |
| `timer` | clock reaches `at` (+ seeded `jitter`) | `at`, `jitter` |
| `zone` | entity/player enters/leaves zone | `zone`, `enter/leave` |
| `intervention` | player performs medical action | `station`, `intervention`, `unless` |
| `prop` | prop state changes | `prop`, `from`, `to` |
| `signal` | module event (unlock, diagnostic, camera, beacon) | `station`, `signal` |
| `manual` | EXCON fires it | — |

Action types: `patient`, `release`, `camera`, `objective`, `message`, `prop`, `lock`, `beacon`, `ordnance`, `sound`, `state` (warning/critical scene mood).

- An inject MAY have `unless` (skip if condition already met) and `enabled`.
- Each inject fires at most once per run; `fired[]` is server state; manual re-fire is explicit (`"erneut auslösen"`).
- Inject creation is advanced-mode; guided exposes time + one action only.

## Mission data sources

- `LIVE`: real device GPS, real clock; `SIG_LOST` after 10 s without position; camera feeds live.
- `PLAYBACK`: deterministic routes per station from mission; clock still real; GPS never requested.
- A mission MAY mix: LIVE positions with playback routes as fallback when GPS is denied.

## Provisioning & presence

- EXCON creates per-station one-time invites (QR/link, 10 min expiry, hashed at rest).
- Device redeems invite → session (7 d) → is bound to station + role (`hq`/`player`/`assessor`).
- Readiness checklist per station: connected, correct module rendered, permissions granted (GPS/camera), battery > 20 %.
- Presence: online/offline per station with last-seen; offline devices show `"OFFLINE"` in EXCON and HQ.
- Re-provision revokes the old session immediately; revoke-all is one action.

## State projection (redaction)

- Server sends role-scoped projections; clients never receive hidden data.
- `player`: own station, own team positions, released dossiers, own objectives, received messages.
- `hq`: all stations, all zones, all objectives, released dossiers, camera feeds; injects and codes hidden.
- `assessor`: everything except codes and future injects (configurable to full).
- `safety`: full state including injects and codes.
- `technician`: device metadata only.

## Comms

- Messages: station→HQ, HQ→station, EXCON→all; canned + free text; each message is logged and MAY be an inject trigger.
- Comms are text-first (tablet-friendly); optional sound cue; no real radio integration in scope.

## Debrief / AAR (after-action review)

- Event log: time-stamped, filterable (injects, interventions, objectives, messages, aborts).
- Timeline view: clock, objective states, patient states, prop states.
- Assessor notes: per event, free text; scores optional (1–5 per criterion defined in mission).
- Export: JSON (full) + CSV (log) + printable summary; take log for film rehearsal.
- Debrief MUST be available to `excon`, `safety`, `assessor`, `hq` (read-only for last two).

## Safety

- `"ABBRUCH"` reachable in ≤ 2 taps from any EXCON/safety surface; shows confirmation only for EXCON.
- Abort banner is visible on every connected device and cannot be dismissed by players.
- All destructive actions (reset, revoke, delete mission) are confirmed and logged with role + time.

## Non-functional requirements

| Area | Requirement |
| --- | --- |
| Offline | Full exercise works on isolated LAN; no internet calls; bundled fonts/media |
| Performance | Tick ≤ 50 ms server CPU at 40 stations; state payload ≤ 200 KB per role |
| Reliability | Server restart restores rooms from `.exercise-data/rooms.json` within 5 s |
| Security | WS same-origin only; tokens hashed; no secrets in client; EXERCISE watermark |
| Determinism | Same seed + same inputs = same simulation outcome (playback-grade) |
| Clock | Server clock is authoritative; clients show server time, not local; deadlines carry `clockRevision` |
| Durability | Accepted commands become journaled domain events; restart restores from snapshot + journal |
| Offline | Field commands queue in an IndexedDB outbox and reconcile on reconnect; control commands are never silently dropped |

## Edge cases

- EXCON laptop dies mid-exercise: safety keeps abort; server keeps ticking; EXCON reconnects with same key.
- Device clock drift: all timers derive from server ticks, never client `Date.now()`.
- Invite link scanned twice: second redemption fails with `"Bereits zugewiesen"` and shows the station name.
- Room file corrupt: server refuses to start, keeps a `.bak`, logs the error; no silent reset.
- Inject fires while clock paused: timers do not advance; manual injects are blocked while paused.
- Failure philosophy: a missed inject or error yields a new state (later information, degraded system, alternate route, trainer branch), never a game-over.

## Acceptance criteria

- [ ] Given a running exercise, when an inject timer fires, then all affected role projections update within 500 ms.
- [ ] Given `PLAYBACK`, when a device denies GPS, then routes still render and no permission prompt loops.
- [ ] Given abort by safety, then the banner appears on all devices and the log records role + time.
- [ ] Given server restart, then rooms, clock, and fired injects resume from persisted state.
