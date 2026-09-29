# 00 — Vision

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)

## One-liner

ScreenForge turns arbitrary screens (tablets, laptops, monitors, TVs) into believable fictional system surfaces for **film & TV production**, **realistic training exercises**, and **demonstrations** — from one shared scene and module engine.

## Problem

- Productions and training teams need many distinct, believable screen UIs fast; building each from scratch is expensive.
- Training needs a live, reactive world (devices, patients, ordnance, beacons, comms, injects), not static graphics.
- Existing tools split into two useless extremes: pure graphics tools (no runtime) or rigid exercise suites (no free composition).
- The current ScreenForge drifted into a fixed wizard: templates with forced stations and a forced patient, no free assembly, no demo mode, no clear mode/role entry.

## Product pillars

1. **One engine, three modes.** Film & TV, Training, Demo share scenes, modules, theming, media, and stage rendering.
2. **Free composition.** A mission ("Einsatz") is assembled by drag & drop from a palette: 1..n devices, entities only when needed. No forced patient, no forced ordnance.
3. **Templates, not cages.** Scenario templates (bomb disposal, data exfiltration, beacon activation, search & rescue, …) are starting points that remain fully editable.
4. **Two depths.** Guided mode (wizard, defaults, safe paths) and advanced mode (builder, raw bindings, injects) — same data, different UI.
5. **Selectable entry.** A start page routes by mode → purpose → role → template; deep links (QR, kiosk) keep working.
6. **Safe fiction.** All systems are fictional; training UI is watermarked `EXERCISE`; no real weapon or tactic detail.

## Goals (MUST)

- A user with no prior knowledge can start a working exercise from a template in ≤ 5 minutes (guided).
- An experienced user can build a mission with 1..n devices and zero entities in ≤ 10 minutes (advanced).
- Every mission runs in training (live) and film (playback) contexts without re-authoring.
- All roles (EXCON, Safety, Assessor, HQ, Player, Actor, Director, Technician, Presenter, Visitor) have a defined, selectable entry and view.
- Demo mode runs fully offline, without server or login, and cannot leave the device.

## Non-goals

- No real weapons/explosives procedures, no real frequencies, no classified content.
- No cloud account system, no internet dependency for a running exercise.
- No 3D engine, no hand tracking, no video export in scope of this concept (roadmap only).
- No attempt to be a full incident command system; ScreenForge supplies surfaces, not doctrine.

## Principles

| # | Principle | Consequence |
| --- | --- | --- |
| P1 | Fiction with discipline | Fictional names, no real CBRN/EOD detail, EXERCISE marking on all training surfaces |
| P2 | One concept, one name | Glossary is normative; UI, code, docs use the same terms |
| P3 | Composition over configuration | Drag & drop first; forms are fallback for precise values |
| P4 | Optional means optional | Entities exist only if the mission needs them; validation blocks start, not construction |
| P5 | Safe by default | Guided defaults are harmless; destructive actions need confirmation; abort is always reachable |
| P6 | Deterministic and offline | Seeded simulation, LAN operation, no hidden network calls |
| P7 | Rehearsable | Every live exercise can be replayed as playback for rehearsal and demo |
| P8 | Progressive disclosure | Guided shows less, advanced shows all; switching never loses data |

## Success criteria

- A template can be run end-to-end (build → provision → start → injects → debrief) without touching advanced mode.
- A blank mission can be built with 0 entities and 1 device; adding a medical device prompts for a patient instead of blocking construction.
- Film, Training, and Demo are reachable from the start page in one click each, and by deep link without the start page.
- Removing a patient, prop, or device never requires deleting the mission; the linter explains what to fix.
- A coding agent can implement any feature in this set without asking product questions (files are self-contained).

## Open questions (tracked, not blockers)

- Should Film & TV and Training share a single mission file format long-term, or two linked formats? Current answer: shared `Mission`, mode-specific runtime. See [11-data-model.md](11-data-model.md).
- Multi-user concurrent editing of one mission: out of scope; single EXCON editor, revision-based.
