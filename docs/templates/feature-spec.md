# Template — Feature Spec

> Copy into the project (or the phase file). Keep it short and executable.
> An agent must be able to implement this without follow-up questions.
> Related: [../plan/README.md](../plan/README.md) · [../konzept/domain/01-glossary.md](../konzept/domain/01-glossary.md)

## Summary

- What:
- Why:
- Concept reference (SSOT): <!-- docs/konzept/... -->
- Phase / backlog task: <!-- e.g. B7 -->

## Problem

One paragraph max. What is broken or missing, and for whom.

## Acceptance criteria

- [ ] Given <precondition>, when <action>, then <observable result>.
- [ ] Denied path: Given <unauthorized/edge>, when <action>, then <safe result>.
- [ ] Empty/error state: Given <no data/failure>, then <defined state with next action>.

## Scope

- In:
- Out:

## Technical notes

- Files/modules:
- Schema/API (mission v2, server protocol, formats):
- Auth/roles and projection (server-enforced):
- Offline behavior:
- No new dependency unless:

## Test plan

- Unit (Vitest `src/core`):
- Server (`server/exercise.test.mjs`):
- E2E (Playwright `tests/`):
- Manual (touch/stage/LAN):

## Risks

| Risk | Mitigation |
| --- | --- |
| | |

## Docs

- Concept file to update:
- Gap analysis row:
- Lesson if surprising:
