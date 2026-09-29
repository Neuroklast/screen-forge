# U5 — States & Feedback

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Principles: [00-principles.md](00-principles.md). Copy: [06-copy-jargon.md](06-copy-jargon.md).

## State inventory

| State | Where | Display | Exit |
| --- | --- | --- | --- |
| `empty` | Builder, devices, dossiers, log | Illustration + one sentence + primary action | User action |
| `loading` | App start, room join, media | Skeleton ≤ 400 ms, then spinner + `"Lädt…"` | Data arrives |
| `saving` | Builder header | Chip `"Speichere…"`, controls stay usable | Saved/conflict |
| `saved` | Builder header | Chip `"Gespeichert 12:04"` (relative after 1 min) | Next edit |
| `dirty` | Builder header | Chip `"Ungespeichert"` + dot | Save |
| `conflict` | Builder | Modal: `"Neu laden"` / `"Als Kopie speichern"` | User choice |
| `offline` | All modes | Banner `"Offline — lokale Funktionen aktiv"` + what still works | Reconnect |
| `permission-denied` | GPS, camera, notifications | Inline card with reason + `"Erneut fragen"` + manual alternative | Grant or dismiss |
| `locked` | Builder while running | Read-only overlay per pane + `"Pause"` shortcut | Pause/end |
| `SIG_LOST` | HQ/EXCON map | Gray marker + `"Signalverlust seit 12 s"` | New position |
| `aborted` | All training surfaces | Full-width red banner `"ÜBUNG ABGEBROCHEN"` + time + role | Reset by EXCON |
| `error` | Any action | Inline message + retry; toast only as duplicate | Retry/back |
| `reconnecting` | Devices | `"Verbindung verloren — versuche erneut (3/10)"` | Reconnect |

## Feedback timing rules

- ≤ 100 ms: visual pressed/active state on every control.
- ≤ 400 ms: optimistic update for local edits (builder, notes); no spinner before this.
- One server tick (250 ms): authoritative confirmation (clock, inject, task state).
- ≥ 2 s operations (export, big import): progress with percentage or indeterminate bar + cancel where safe.
- Never block the UI on the server; queue and show pending state.

## Error message format

```text
<Was ist passiert>. <Warum>. <Was jetzt>.
"Gerät konnte nicht verbunden werden. Der Einladungscode ist abgelaufen. Fordere einen neuen Code bei der Übungsleitung an."
```

- First sentence plain German, no codes; technical detail collapsible (`"Details"`).
- Buttons: primary = fix action (`"Neuen Code anfordern"`), secondary = dismiss.
- Validation errors name the field and the fix, never `"Ungültige Eingabe"` alone.

## Confirmations

| Action | Confirmation |
| --- | --- |
| Abort exercise | Safety: none (immediate, logged). EXCON: confirm dialog |
| Reset exercise | Confirm with consequence text: `"Setzt Uhr und Zustände zurück. Einsatz bleibt erhalten."` |
| Delete mission | Typed confirm of mission name |
| Revoke device | Confirm + shows station name |
| Remove bound entity | Simple confirm `"Bindung wird gelöst"` |
| Demo reset | None |

## Toasts and banners

- Toast: bottom-left, max 1, 4 s, dismissible; used for confirmations (`"Gespeichert"`, `"Code erneuert"`).
- Banner: top, persistent until resolved; used for `offline`, `aborted`, `conflict`, `reconnecting`.
- Banners stack max 2; critical (`aborted`) replaces others.
- All toast content MUST also exist inline where the action happened.

## Presence and connection

- Device presence dot: green ≤ 10 s, yellow ≤ 30 s, gray beyond (`"offline seit 2 min"`).
- Reconnect: exponential backoff 1/2/4/8/16 s, max 10 attempts, then `"Erneut verbinden"` button.
- Queued actions while offline: GPS batches, messages, notes; UI marks them `"ausstehend"`.
- Film/demo: offline is normal; no banner.

## Progress and long operations

| Operation | Feedback |
| --- | --- |
| Mission export | Instant download + toast |
| Debrief export | Progress bar if > 2 s; success toast with file name |
| Media import | Per-file progress list; failures listed with reason |
| Server restart restore | Start page status `"Server startet…"`, auto-retry |

## Acceptance criteria

- [ ] Given a failed save due to revision, then the conflict modal appears and no local edit is lost without choice.
- [ ] Given a running exercise, then the builder is visibly locked and `"Pause"` is one click away.
- [ ] Given GPS denied on a field device, then an inline card explains the fallback (playback route) and offers retry.
- [ ] Given an abort, then every role sees the banner within one tick and cannot dismiss it.
