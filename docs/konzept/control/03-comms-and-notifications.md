# Control — Comms & Notifications

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-control-model.md](00-control-model.md) · [../catalog/blocks/11-comms.md](../catalog/blocks/11-comms.md)

## Purpose

EXCON and HQ need to reach the field: task updates, warnings, requests, and acknowledgements. The product delivers this as text-first messages over the existing WebSocket, integrated with the comms module and the exercise log.

## Message model

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | unique |
| `at` | number | server clock |
| `from` | role/station | `excon`, `hq`, `player`, `safety` |
| `to` | station[] / team[] / `all` | recipients |
| `channel` | `command` / `coordination` / `medical` | matches comms plan |
| `priority` | `info` / `task` / `warning` / `urgent` | visual + optional sound |
| `text` | string | ≤ 280 chars |
| `canned` | string? | template id if from a template |
| `ack` | `{required, by[]}` | acknowledgement tracking |
| `expiresAt` | number? | auto-expire for time-critical tasks |

- Messages are delivered as events in the role projection; field devices show them in a message drawer and in the comms module log.
- `ack` required messages show `"Bestätigen"` on the device; missing acks appear in the EXCON panel.

## Canned messages (templates)

| Category | Examples |
| --- | --- |
| Task | `"Ziel aktualisiert"`, `"Route prüfen"`, `"Akte freigeben"` |
| Warning | `"Funkstille ab jetzt"`, `"Bereich verlassen"`, `"Zeitfenster läuft"` |
| Info | `"Transport bereit"`, `"Lage unverändert"` |
| Medical | `"MED-Kanal frei"`, `"Transport angefordert"` |

- Templates are mission data (editable in the builder); scenarios ship defaults ([../scenarios/01-exercise-anatomy-and-mel.md](../scenarios/01-exercise-anatomy-and-mel.md)).
- EXCON can send a template in ≤ 2 clicks (list + target); free text is always available.

## Notifications

| Event | Recipients | Default |
| --- | --- | --- |
| Objective completed | HQ, EXCON, assessor | on |
| Inject fired | EXCON, assessor | on |
| Inject fired (visible event) | affected players | mission-gated |
| Device offline/online | EXCON, safety, technician | on |
| Camera feed lost | HQ, EXCON | on |
| Message received | recipients | on |
| Silence window started | all | mission-gated |

- Notifications are distinct from messages: they are automatic, not authored.
- Every notification has a visual form; sound is optional and off by default on field devices.
- Notifications never reveal hidden data: a player only learns about events the mission marks visible.

## Silence windows

- A mission MAY define silence windows (`"Funkstille T+05:00–T+08:00"`).
- During a window: field devices block outgoing messages (with an explanation), incoming EXCON messages still deliver (safety first).
- Window start/end are injects and appear in the MEL.

## UI surfaces

| Surface | Contents |
| --- | --- |
| EXCON composer | channel, recipients, template/free text, priority, ack toggle, send |
| EXCON panel | sent messages, ack status, failed deliveries |
| HQ panel | inbox/outbox, channel filter, compose (mission-gated) |
| Field device | message drawer with unread badge, ack button, channel filter |
| Comms module | message log integrated with the waveform panel ([../catalog/blocks/11-comms.md](../catalog/blocks/11-comms.md)) |

## Rules

- Text-first, offline-capable: messages queue locally and flush on reconnect; no external service.
- Messages are part of the exercise log and the debrief export.
- No real frequencies, callsigns, or encryption claims; channel names are fictional labels.
- Messages MUST NOT leak hidden state (e.g. upcoming injects) to players.

## Target state (Soll)

- Implement the message model, composer, and device drawer; today `message` actions only append to the log and players receive an empty log.
- Implement canned templates per mission and quick-send in the EXCON header.
- Implement ack tracking with a missing-ack list.
- Implement silence windows and visible-inject notifications.

## Acceptance criteria

- [ ] Given an EXCON message, all targeted devices show it within one tick and it appears in the log.
- [ ] Given an ack-required message, unacknowledged stations are listed after 60 s.
- [ ] Given a silence window, players cannot send but still receive messages.
- [ ] Given a hidden inject, no player notification is generated.
