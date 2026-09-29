# 02 — Roles & Permissions

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Terms: [01-glossary.md](01-glossary.md). Auth mechanics: [08-exercise-runtime.md](08-exercise-runtime.md).

## Role model

- A role is selected on the [start page](../usability/01-start-page.md) or passed by deep link (`?role=…`).
- A device session holds exactly one role; changing role re-authenticates.
- Roles are UI surfaces over one server; the server MUST enforce every permission, not the client.

| Role | Mode | Primary view | Auth | Purpose |
| --- | --- | --- | --- | --- |
| `director` (`"Regie"`) | film | Studio | none (local) / kiosk PIN for stage | Author and run shows, media, themes |
| `stage-operator` (`"Bühne"`) | film | Output-only stage | kiosk PIN | Operate stage devices, no authoring |
| `excon` (`"Übungsleitung"`) | training | Exercise Control | server key (12 h session) | Author mission, run exercise, debrief |
| `safety` (`"Sicherheit"`) | training | Safety console | server key or safety PIN | Pause/abort always, see all, no edits |
| `assessor` (`"Beobachter"`) | training | Assessor view | invite link | Observe, take notes, score, AAR |
| `hq` (`"Einsatzleitung"`) | training | HQ console | device invite | Operational picture, limited actions |
| `player` (`"Spieler"`) | training | Field device | device invite | Execute module tasks, GPS, interventions |
| `technician` (`"Technik"`) | all | Device admin | server key (scoped) | Provision, revoke, media, network |
| `presenter` (`"Vorführer"`) | demo | Demo hub | none | Drive guided tour, reset sandbox |
| `visitor` (`"Besucher"`) | demo | Demo view | none | Observe, optional sandbox interaction |

## Capability matrix

Rows are capabilities; columns are roles. `F` = film, `T` = training, `D` = demo.

| Capability | director | stage-op | excon | safety | assessor | hq | player | technician | presenter | visitor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View mission/show | F/T | F | T | T | T | T | partial | F/T | D | D |
| Edit mission | — | — | T | — | — | — | — | — | D sandbox | D sandbox |
| Edit show/takes | F | — | F rehearsal | — | — | — | — | — | D | — |
| Start / pause clock | F | F kiosk | T | T (pause) | — | — | — | — | D | — |
| Reset exercise | F | — | T | T | — | — | — | — | D | — |
| **Abort exercise** | F | F | T | **T** | — | — | — | — | D | — |
| Fire inject manually | — | — | T | — | — | — | — | — | D | — |
| Provision / revoke device | — | — | T | — | — | — | — | T | — | — |
| Release dossier | — | — | T | — | — | T if allowed | — | — | D | — |
| Send message (comms) | — | — | T | T | — | T | T | — | D | — |
| Complete objective | — | — | T | — | — | T if allowed | — | — | D | — |
| Patient intervention | — | — | T override | — | — | — | T at station | — | D | — |
| Module task (diagnose/unlock) | — | — | T preview | — | — | — | T | — | D | — |
| Add assessor note | — | — | T | T | T | — | — | — | — | — |
| Export debrief | F take log | — | T | T | T | T | — | — | D | — |
| Edit media / themes | F | — | T mission media | — | — | — | — | T | D | — |

## Rules

- Role SOP abstractions (what a role recognises, reports or documents) live in [../scenarios/11-role-sops.md](../scenarios/11-role-sops.md); they NEVER contain real procedures.
- `safety` MUST be able to pause and abort without EXCON confirmation; abort is logged and shown to all roles.
- `assessor` and `hq` NEVER mutate exercise state except explicitly allowed actions (notes, messages, dossier release, objective completion when enabled per mission).
- `player` sees only own station, own team, released dossiers, own objectives — enforced server-side by projection.
- `technician` MUST NOT see mission content beyond device metadata; provisioning is content-blind.
- Multiple `excon` sessions MAY exist; last write wins with revision check (see [04-mission-builder.md](04-mission-builder.md)).
- `visitor` interactions in demo are sandboxed to the demo room and reset by `presenter`.

## Auth and sessions

| Actor | Credential | Lifetime | Notes |
| --- | --- | --- | --- |
| EXCON / Technician | Server key (`EXERCISE_ADMIN_KEY`) | 12 h token | Printed at server start; never stored in client code |
| HQ / Player / Assessor | One-time invite token (QR/link) | 10 min to redeem, 7 d session | Hashed at rest; revocable per station |
| Safety | Server key or dedicated safety PIN | 12 h | MUST work even if EXCON offline |
| Stage (film) | Kiosk PIN (`instructorPin`) | until reload | Blocks exit from stage, not entry |
| Demo | none | — | No server, no persistence of visitor input |

## Edge cases

- Role link opened without invite: show assignment screen; never grant implicit access.
- Device re-provisioned while online: old session revoked immediately; screen shows `"Gerät neu zugewiesen"`.
- Safety abort while EXCON disconnected: abort MUST succeed (server-side capability, not session-dependent).
- Assessor link shared beyond intended person: invite expiry + revoke per device; assessor is read-mostly, low risk.
- Role downgrade (e.g. technician → player) on same device: full re-auth, local state cleared.

## Acceptance criteria

- [ ] Given a `player` device, when it requests full mission state, then rules, codes, unreleased dossiers, and other teams' data are absent from the payload.
- [ ] Given a running exercise, when `safety` presses abort, then the clock stops, all devices show `"Abbruch"`, and the event is in the log within one tick.
- [ ] Given a `technician` session, when it opens the device list, then no mission content (patient names, injects, codes) is visible.
- [ ] Given an expired invite, when a device opens the link, then it sees the assignment screen, not an error page.
