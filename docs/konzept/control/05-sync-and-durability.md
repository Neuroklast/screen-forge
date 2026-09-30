# Control — Sync & Durability

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-control-model.md](00-control-model.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md) · [../domain/11-data-model.md](../domain/11-data-model.md)

## Purpose

The exercise survives flaky field links, browser freezes, and server restarts without losing a
control action or double-applying one. The server stays authoritative; clients hold a durable
command outbox and a readable snapshot.

## Data classes

| Class | Semantics | Transport policy |
| --- | --- | --- |
| Command | one operator action | persisted, at-least-once, deduplicated by `commandId` |
| Domain event | authoritative change | immutable, server-sequenced, replayable |
| Telemetry | pulse, waveform, GPS, link quality | latest-wins; stale samples MAY be dropped/coalesced |
| Media | camera, audio | WebRTC, never through the domain state |

## Command envelope (client → server)

Every mutating message carries a stable identity and a base revision:

```text
eventId        UUID v4 (crypto.randomUUID)
deviceId       stable per browser/device
stationId      bound station (empty for control roles)
exerciseId     room
deviceSeq      monotonic per device
type           command kind
payload        command body
baseRevision   last authoritative revision the client saw
occurredAtLocal
```

- `eventId` identifies one logical action; retries MUST reuse it.
- `deviceSeq` detects gaps/reordering; `baseRevision` rejects commands against a changed world.
- The server adds `serverSeq`, `acceptedAt`, `exerciseTime`, `actor`, `result`.

## Idempotency layers

| Layer | Mechanism |
| --- | --- |
| Network retry | same `eventId` on every retry |
| UI single-flight | no second command while the first is pending |
| Server dedup | `eventId` already processed → return the previous result |
| Domain idempotency | transition already applied → no second mutation |

Semantics: client at-least-once, server idempotent consumption, domain exactly-once effect.

## ACK protocol (server → client)

- `ack { eventId, serverSeq, result }` for accepted commands. `serverSeq` mirrors the current
  journal position; an acknowledgement never consumes a new event sequence number, so `serverSeq`
  stays gap-free for replay and resume.
- `rejected { eventId, reason, serverSeq }` when preconditions fail (stale revision, phase,
  capability, expired domain state).
- A rejected/superseded outbox entry is surfaced to the user, never silently dropped.

## Event journal and snapshots

- The canonical order is an append-only per-room event log (`serverSeq` monotonic).
- Persistence: JSONL journal per room plus a periodic atomic snapshot (tmp + rename).
- On restart the server loads the latest snapshot and replays the journal tail.
- `rooms.json` remains a readable export/migration input, never the source of truth.
- Telemetry samples are NOT journaled; only domain-significant events.

## Resume protocol

Clients send `hello.lastServerSeq`; the server replies with either

```text
events serverSeq + 1 … current
```

or, when the gap is too large, `snapshot@serverSeq` followed by newer events.

- Role projection applies to events exactly as to state; hidden data never leaves the server.
- A client offline while EXCON paused cannot know the true exercise time and shows `SYNC UNKNOWN`.

## Offline outbox (client)

```text
CREATED → QUEUED → SENT → ACKED
                    └────→ REJECTED
QUEUED ───────────────→ SUPERSEDED (domain no longer applicable)
```

- Persisted in IndexedDB; a short ACK history is kept for diagnostics and AAR correlation.
- On reconnect: apply missing server events, rebase optimistic state, replay pending by `deviceSeq`,
  then wait for ACK.
- The outbox is NOT a blind FIFO: every replayed command is re-validated against the current state.

## Time model

```text
serverNow          server clock at send
exerciseElapsed    pausable exercise time
deadlineAtServer   absolute server epoch for wall deadlines
clockState         running | paused
clockRevision      bumped on every pause/resume
```

- `DISPLAY = prediction`, `SERVER = authority`; a local countdown never triggers a domain event.
- Clients estimate a `serverOffset` from multiple round-trips and render with a monotonic browser
  clock; on `visibilitychange`/focus they recompute from the authoritative deadline.

## CRDT scope

- Live exercise state, time, inject firing, patient state, props and objectives use the canonical
  server order — never CRDT merge.
- CRDTs MAY be used for assessor notes, draft comments, drawings and other non-critical annotations.

## Acceptance criteria

- [ ] Given a command sent, when the link drops before ACK, then after reconnect exactly one effect exists.
- [ ] Given the same `eventId` delivered 100 times, then exactly one domain transition occurs.
- [ ] Given a server restart mid-exercise, then state is reconstructed from snapshot + journal.
- [ ] Given a client clock off by ±5 min, then the displayed deadline matches the authoritative one.
- [ ] Given a 60 s frozen tab, then the countdown is correct immediately after resume.
