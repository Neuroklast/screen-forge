# Lessons — Index & Format

> ScreenForge project lessons · Append-only · Language: EN
> Related: [../../AGENTS.md](../../AGENTS.md) · [../plan/08-tests-and-dod.md](../plan/08-tests-and-dod.md)

Load for: adding a lesson, promoting a recurring lesson into a rule.

## Files

| File | Area |
| --- | --- |
| [lessons.md](lessons.md) | All project lessons (append-only table) |

## Format

Append-only table rows:

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| YYYY-MM | short area | one actionable sentence (what to do, not what happened) | low/med/high |

Rules:

- Write the **rule**, not the story: "Keep a concept SSOT before implementing", not "an agent broke the concept".
- One row per lesson. Deduplicate: search before adding.
- Severity: `high` = data loss / security / user-visible breakage; `med` = rework or bug risk; `low` = ergonomics.
- Areas: `Concept`, `Naming`, `Docs`, `Assets`, `Runtime`, `Tests`, `Process`, `Tooling`.

## Promotion path

1. New lesson → row in [lessons.md](lessons.md).
2. Lesson repeats (2+ occurrences) → promote into the matching rule file:
   - behavior rules → [../konzept/domain/](../konzept/domain/00-vision.md)
   - process rules → [../plan/00-guardrails.md](../plan/00-guardrails.md)
   - UI rules → [../konzept/usability/00-principles.md](../konzept/usability/00-principles.md)
3. Lesson becomes a structural gate → add a check to [../plan/08-tests-and-dod.md](../plan/08-tests-and-dod.md) or CI.

Promotion does not delete the row (history stays append-only). After promotion, the rule file is canonical; the row remains as its origin.

## Rules for agents

- After any incident, regression, or "that surprised me" moment: add the lesson in the same session.
- NEVER rewrite or delete history rows; supersede with a new dated row.
- Keep it project-specific; generalizable lessons may be proposed to the central collection, but only with explicit approval.
