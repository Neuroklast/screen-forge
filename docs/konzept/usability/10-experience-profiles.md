# U10 — Experience Profiles

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Guided: [02-guided.md](02-guided.md) · Advanced: [03-advanced.md](03-advanced.md) · Fidelity: [../scenarios/00-realism-and-safety-framework.md](../scenarios/00-realism-and-safety-framework.md)

## Purpose

Easy, Advanced and Professional are **experience profiles over one runtime**, not three products.
They choose information density, guidance, error tolerance and symbology for the same tasks.

- The profile axis is orthogonal to the builder depth toggle (`guided`/`expert`) and to fidelity
  (`F1`–`F3`).
- A profile never changes the underlying data model or the server authority.

## Profile matrix

| Aspect | Easy | Advanced | Professional |
| --- | --- | --- | --- |
| Primary goal | acting / quick play | team coordination | training / EXCON / C2 |
| Information density | very low | medium | high, hierarchical |
| Main view | one task | task + map + status | map + roster + events + detail |
| Interaction target | ~56–64 CSS px | ~48–56 px | large touch plus mouse/keyboard |
| Navigation | linear | few tabs | role workspaces |
| Map | optional / simplified | GPS, zones, teams | common picture, source state, standard symbols |
| Symbols | plain text + pictograms | simplified tactical shapes | standard-profile symbology where needed |
| Telemetry | outcome only | trends and warnings | trends, source, age, quality, raw on request |
| Errors | automatic recovery | consequence + alternative | persistent degraded state |
| Countdown | large and unambiguous | synchronized | authoritative time + sync state |
| MEL | "now / next" | timeline + IFTTT | timeline + dependencies + audit |
| Offline | invisible retry | offline banner + queue | queue/sync/conflict state |
| EXCON | start/pause/inject | live MEL | live MEL, projections, AAR, overrides |
| Success | deterministic / trainer-controlled | action-dependent | objective state, no artificial game over |
| Misoperation | hard to trigger | undo / retry | audited, possibly irreversible |
| Raw data | hidden | optional | only where it serves a decision |

## Professional is provenance, not noise

Professional surfaces MUST show information quality, not decorative overload:

```text
source · observedAt · receivedAt · age · accuracy · confidence · classification · sync state · last revision
```

- `stale` is often more important than `offline`: a 90 s old position that still looks live is
  dangerous. Show `GPS 00:18 old`, `CAM-02 00:18 old`, `TEAM A LIVE`.
- Telemetry reads `HR 116 bpm ↑ / AGE 0.4 s / SOURCE MED-02 / QUALITY GOOD`, not a bare number.
- A bar is acceptable only when real progress is known; otherwise show state + timestamp.

## Entity state vs UI effect

An entity carries a semantic state (`critical`); the profile decides how that becomes color, icon,
text and motion. No component hardcodes "red means bad".

```text
Domain entity → semantic descriptor → profile renderer → screen symbol
```

## Failure philosophy

- A failure produces a new state (later information, harder objective, degraded system, alternate
  route, trainer branch) — never a game-over screen.
- Easy keeps recovery automatic and deterministic; Professional keeps the degraded state visible and
  audited until an explicit resolution.

## Acceptance criteria

- [ ] Given the same mission, switching profile changes density/symbology but not state or permissions.
- [ ] Given a stale source, then Professional shows its age; Easy does not surface raw telemetry.
- [ ] Given a failed inject in Easy, then the run recovers without a blocking error screen.
