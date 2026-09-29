# ScreenForge Concept Set

> Target state (Soll) for ScreenForge: fictional screen surfaces for **Film & TV**, **Training**, and **Demo**.
> Status: concept, not implementation. Code status per feature: [domain/12-gap-analysis.md](domain/12-gap-analysis.md).
> Language: English prose, German UI labels quoted (`"Einsatz"`). Terms: [domain/01-glossary.md](domain/01-glossary.md).

## Why this set exists

- Recent implementation drifted: mission assembly is form-based, templates are fixed, a patient is effectively forced, and the film/training/demo split is not selectable.
- This set is the single source of truth for **what the product must be**; code MUST follow it or record a deviation.
- Coding agents MUST read the routed file before touching the matching area, and MUST NOT invent features outside this set.

## Domain concept

| # | File | Read when |
| --- | --- | --- |
| 0 | [domain/00-vision.md](domain/00-vision.md) | Always first |
| 1 | [domain/01-glossary.md](domain/01-glossary.md) | Any naming, UI copy, schema field |
| 2 | [domain/02-roles.md](domain/02-roles.md) | Auth, permissions, views |
| 3 | [domain/03-modes-and-entry.md](domain/03-modes-and-entry.md) | Start page, routing, mode selection |
| 4 | [domain/04-mission-builder.md](domain/04-mission-builder.md) | Building/editing missions, drag & drop |
| 5 | [domain/05-modules.md](domain/05-modules.md) | Device modules, station config |
| 6 | [domain/06-entities-and-props.md](domain/06-entities-and-props.md) | Patients, ordnance, beacons, payloads |
| 7 | [domain/07-templates.md](domain/07-templates.md) | Scenario templates, wizard content |
| 8 | [domain/08-exercise-runtime.md](domain/08-exercise-runtime.md) | Server, rules/injects, live exercise |
| 9 | [domain/09-film-tv.md](domain/09-film-tv.md) | Film studio, shows/takes, stage output |
| 10 | [domain/10-demo.md](domain/10-demo.md) | Demo mode, kiosk, onboarding |
| 11 | [domain/11-data-model.md](domain/11-data-model.md) | Schemas, versioning, migration |
| 12 | [domain/12-gap-analysis.md](domain/12-gap-analysis.md) | Planning implementation work |
| 13 | [domain/13-field-client.md](domain/13-field-client.md) | Field shell, background location, offline maps |

## Usability concept

| # | File | Read when |
| --- | --- | --- |
| U0 | [usability/00-principles.md](usability/00-principles.md) | Any UI/UX decision |
| U1 | [usability/01-start-page.md](usability/01-start-page.md) | Entry, mode/role selection |
| U2 | [usability/02-guided.md](usability/02-guided.md) | Wizard, defaults, guided flows |
| U3 | [usability/03-advanced.md](usability/03-advanced.md) | Expert layout, density, shortcuts |
| U4 | [usability/04-builder-interaction.md](usability/04-builder-interaction.md) | Drag & drop, bindings, touch |
| U5 | [usability/05-states-feedback.md](usability/05-states-feedback.md) | Empty/error/offline/locked states |
| U6 | [usability/06-copy-jargon.md](usability/06-copy-jargon.md) | German UI strings, tone, errors |
| U7 | [usability/07-accessibility-devices.md](usability/07-accessibility-devices.md) | Touch, tablets, HQ, stage, a11y |
| U8 | [usability/08-flows.md](usability/08-flows.md) | End-to-end journeys per mode |
| U9 | [usability/09-layout-contracts.md](usability/09-layout-contracts.md) | Any scene/block layout: grid, overflow, z-index, truncation, scaling |
| U10 | [usability/10-experience-profiles.md](usability/10-experience-profiles.md) | Easy/Advanced/Professional density, provenance, degradation |

## Catalog (scenes, components, assets)

| # | File | Read when |
| --- | --- | --- |
| C1 | [catalog/scenes/01-corporate-system.md](catalog/scenes/01-corporate-system.md) | Corporate system scene |
| C2 | [catalog/scenes/02-operating-system.md](catalog/scenes/02-operating-system.md) | Operating system: desktop, windows, apps, photos |
| C3 | [catalog/scenes/03-os-sequences.md](catalog/scenes/03-os-sequences.md) | 14 OS sequences, sequence panel |
| C4 | [catalog/scenes/04-sequence-control.md](catalog/scenes/04-sequence-control.md) | Countdown/device console scene |
| C5 | [catalog/scenes/05-orbital-survey.md](catalog/scenes/05-orbital-survey.md) | Orbital tracking scene |
| C6 | [catalog/scenes/06-analysis-table.md](catalog/scenes/06-analysis-table.md) | Analysis table scene |
| C6b | [catalog/scenes/08-terminal.md](catalog/scenes/08-terminal.md) | Terminal: goal-driven command line |
| C7 | [catalog/blocks/07-lock.md](catalog/blocks/07-lock.md) | Lock block (keypad) |
| C8 | [catalog/blocks/08-access.md](catalog/blocks/08-access.md) | Access block (interlock) |
| C9 | [catalog/blocks/09-medical.md](catalog/blocks/09-medical.md) | Medical block (bio monitor) |
| C10 | [catalog/blocks/10-camera.md](catalog/blocks/10-camera.md) | Camera block (optics) |
| C11 | [catalog/blocks/11-comms.md](catalog/blocks/11-comms.md) | Comms block (radio) |
| C12 | [catalog/blocks/12-slide.md](catalog/blocks/12-slide.md) | Slide block (latch, releases) |
| C12b | [catalog/blocks/13-clock.md](catalog/blocks/13-clock.md) | Clock block (new) |
| C12c | [catalog/blocks/14-rotary.md](catalog/blocks/14-rotary.md) | Rotary block (new) |
| C12d | [catalog/blocks/15-code-table.md](catalog/blocks/15-code-table.md) | Code table block (new) |
| C12e | [catalog/blocks/16-data-sheet.md](catalog/blocks/16-data-sheet.md) | Data sheet / schematic viewer (new) |
| C13 | [catalog/components/13-input.md](catalog/components/13-input.md) | CodePad, StageKeys, GestureSurface |
| C14 | [catalog/components/14-branding-frames.md](catalog/components/14-branding-frames.md) | BrandMark, HudFrame, SceneHeader |
| C15 | [catalog/components/15-media-pipeline.md](catalog/components/15-media-pipeline.md) | Media store, example media, limits |
| C16 | [catalog/components/16-show-editor.md](catalog/components/16-show-editor.md) | SequenceEditor, director, show templates |
| C17 | [catalog/components/17-design-controls.md](catalog/components/17-design-controls.md) | ThemeEditor, TokenEditor, SystemProfiles |
| C18 | [catalog/components/18-training-controls.md](catalog/components/18-training-controls.md) | Training views and components |
| C19 | [catalog/19-themes.md](catalog/19-themes.md) | All 11 themes, custom themes, rules |
| C20 | [catalog/20-companies-and-brands.md](catalog/20-companies-and-brands.md) | 14 companies, 8 brand marks, profiles |
| C21 | [catalog/21-dossiers.md](catalog/21-dossiers.md) | Personnel files, templates, photos |
| C22 | [catalog/22-sounds.md](catalog/22-sounds.md) | 16 sounds, triggers, policies |
| C23 | [catalog/23-asset-and-catalog-gaps.md](catalog/23-asset-and-catalog-gaps.md) | Asset findings and measures |
| C24 | [catalog/components/19-symbology.md](catalog/components/19-symbology.md) | Symbol semantic descriptor → versioned renderer |

## Scenario library (exercise-design realism, fiction only)

| # | File | Read when |
| --- | --- | --- |
| S0 | [scenarios/00-realism-and-safety-framework.md](scenarios/00-realism-and-safety-framework.md) | Any scenario design decision |
| S1 | [scenarios/01-exercise-anatomy-and-mel.md](scenarios/01-exercise-anatomy-and-mel.md) | MEL, timing, roles, comms plan |
| S2 | [scenarios/02-hostage-rescue.md](scenarios/02-hostage-rescue.md) | Hostage-situation command exercise |
| S3 | [scenarios/03-objective-clearance.md](scenarios/03-objective-clearance.md) | Systematic search / facility security |
| S4 | [scenarios/04-vip-protection.md](scenarios/04-vip-protection.md) | Route and protection coordination |
| S5 | [scenarios/05-recon-surveillance.md](scenarios/05-recon-surveillance.md) | Observation and reporting |
| S6 | [scenarios/06-eod-disposal.md](scenarios/06-eod-disposal.md) | Fictional ordnance disposal coordination |
| S7 | [scenarios/07-medical-casualty-response.md](scenarios/07-medical-casualty-response.md) | Casualty response drill |
| S8 | [scenarios/08-convoy-route.md](scenarios/08-convoy-route.md) | Convoy and route coordination |
| S9 | [scenarios/09-counter-intrusion.md](scenarios/09-counter-intrusion.md) | Intrusion detection and response |
| S10 | [scenarios/10-evaluation-and-aar.md](scenarios/10-evaluation-and-aar.md) | Criteria, assessor workflow, AAR |
| S11 | [scenarios/11-role-sops.md](scenarios/11-role-sops.md) | Role SOP abstractions (operator, access, medic, EOD) |
| S12 | [scenarios/12-safety-profile.md](scenarios/12-safety-profile.md) | Safety profile, props, deconfliction |
| S13 | [scenarios/13-doctrine-packs.md](scenarios/13-doctrine-packs.md) | Versioned doctrine packs, patient model split |

## Data formats

| # | File | Read when |
| --- | --- | --- |
| F0 | [formats/00-format-family.md](formats/00-format-family.md) | Format overview, naming, versioning |
| F1 | [formats/01-mission-format.md](formats/01-mission-format.md) | Mission v2 schema and example |
| F2 | [formats/02-package-format.md](formats/02-package-format.md) | `.sfpack` layout, manifest, hashes |
| F3 | [formats/03-show-theme-profile-formats.md](formats/03-show-theme-profile-formats.md) | Show, preset, theme, profile files |
| F4 | [formats/04-import-export-migration.md](formats/04-import-export-migration.md) | Import pipeline, migration, security |
| F5 | [formats/05-briefing-format.md](formats/05-briefing-format.md) | Full-text mission briefing (SMEAC/OPORD) |

## Control & orchestration

| # | File | Read when |
| --- | --- | --- |
| K0 | [control/00-control-model.md](control/00-control-model.md) | Phases, authority, safety, audit |
| K1 | [control/01-inject-orchestration.md](control/01-inject-orchestration.md) | MEL scheduler, manual fire, macros |
| K2 | [control/02-readiness-monitoring.md](control/02-readiness-monitoring.md) | Readiness checks, alerts, multi-room |
| K3 | [control/03-comms-and-notifications.md](control/03-comms-and-notifications.md) | Messages, canned texts, notifications |
| K4 | [control/04-debrief-replay-aar.md](control/04-debrief-replay-aar.md) | Timeline, replay, notes, exports |
| K5 | [control/05-sync-and-durability.md](control/05-sync-and-durability.md) | Commands/events, outbox, resume, clock, transport classes |

## Conventions in this set

- **MUST / SHOULD / MAY / NEVER** are normative. MUST violations are bugs.
- Every feature has: purpose, rules, edge cases, acceptance criteria.
- German UI labels are normative for the product; English terms are normative for code/schema.
- Scenes are functional surfaces; companies are identities ([catalog/20](catalog/20-companies-and-brands.md)). Never name a scene after a company.
- No real-world weapons or tactics detail: ordnance, warheads, and systems are fictional props with a safety framing.
- Files are split by concern (≤150 lines each) so agents read only what the task needs.

## Non-goals of this set

- No implementation plan, no ticket breakdown, no estimates.
- No real CBRN/explosive procedures, frequencies, or operational security content.
- No cloud/multi-tenant SaaS design; ScreenForge stays a local/LAN production and training tool.
