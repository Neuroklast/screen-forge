# 13 — Field Client

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Runtime: [08-exercise-runtime.md](08-exercise-runtime.md) · Sync: [../control/05-sync-and-durability.md](../control/05-sync-and-durability.md)

## Purpose

Decide per deployment whether a plain PWA is enough or a native wrapper is required. One React
application, two shells — never two code bases.

## Shell matrix

| Deployment | Shell | Reason |
| --- | --- | --- |
| Film terminal | PWA | local, deterministic, no background needs |
| EXCON / HQ / trainer laptop | PWA | stationary, mains power |
| Foreground field terminal | PWA | screen is active |
| Simple airsoft | PWA | short sessions |
| Sustained background location | native wrapper | OS background location rules |
| Managed rugged hardware | native wrapper | device policy, foreground service |

- A native wrapper (e.g. Capacitor) reuses the same UI/domain code and adds native lifecycle,
  background location and optional NFC.
- Wake Lock is a usability hint, NOT an execution guarantee; a manually locked screen still stops a
  browser app.

## Provisioning

- QR carries a short-lived enrollment token, not a permanent credential:

```text
QR → short-lived enrollment token → server redemption → device credential → QR token invalidated
```

- Payload: `exerciseId, assignmentId, stationId, role, expiresAt, nonce, signature`.
- NFC (where available) uses the **same** payload and validation; it is an accelerator, not a second
  protocol.

## Performance profile (field mode)

```text
reduced animations · decorative shaders off · video only when visible
reduced map redraws · adaptive GPS · coalesced telemetry · minimal background tasks
```

- GPS rate is derived from the training goal, not from an aesthetic target.
- Media is WebRTC and separate from the control plane; feeds are subscribed selectively and show a
  clear stale/offline state. A fixed multi-camera wall is not a default.

## Map adapters

```text
MapAdapter
  ├── LeafletAdapter   (current)
  ├── VectorMapAdapter (later, desktop HQ)
  └── OfflineMapAdapter (tile packages)
```

- A vector map (MapLibre/Mapbox GL) is adopted only after a spike measures offline start, tile package
  size, zoom performance, GPU/thermal cost and licensing.

## Acceptance criteria

- [ ] Given a foreground field device, the PWA is sufficient and stays offline-capable.
- [ ] Given a background-location requirement, the native shell is documented as required.
- [ ] Given a QR scan, the token is single-use and expires.
- [ ] Given no network, the map renders from a local package and makes no tile requests.
