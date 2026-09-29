# Plan 14 — Offline Map Spike

> ScreenForge · Implementation plan · Phase 8 · Language: EN
> Concept: [../konzept/domain/13-field-client.md](../konzept/domain/13-field-client.md) · Backlog: [13-backlog-durable-engine.md](13-backlog-durable-engine.md)

## Purpose

Decide between the current Leaflet stack and a vector map (MapLibre/Mapbox GL) from measurements,
not from appearance. Adapter abstraction: `src/map/adapters.ts`.

## Measurements to capture (target hardware)

| # | Measurement | Pass condition |
| --- | --- | --- |
| 1 | Fully offline cold start | map renders with no network |
| 2 | Local basemap package size | documented per region |
| 3 | Zoom/pan performance | ≥ 30 fps at exercise zoom |
| 4 | GPU / thermal behaviour | no sustained throttling over 30 min |
| 5 | Licensing + tile attribution | compatible with offline distribution |
| 6 | Tile update workflow | documented and reproducible |

## Decision rule

- Offline required → `offline` adapter (local package).
- Rich vector + online desktop HQ only → `vector` adapter (WebGL2).
- Otherwise → `leaflet` adapter (current).

## Status

- Abstraction and selection logic: implemented and tested.
- Measurement execution: pending target hardware (rugged field tablet + desktop HQ).
- No new map dependency is added before the spike passes.
