# Lessons — ScreenForge

> Append-only. Newest at the bottom. Format and rules: [README.md](README.md).

| Date | Area | Lesson | Severity |
| --- | --- | --- | --- |
| 2026-09 | Concept | Coding agents drift product concepts without a written SSOT — write the concept (and a gap analysis) before implementing, and make docs part of the DoD. | high |
| 2026-09 | Naming | Never name a scene after a company: `VESPER`/`BLACKLINE`/`AEON` are brand titles; scenes are functional (`corporate`, `terminal`, …). Enforce via the glossary. | high |
| 2026-09 | Docs | Large concept sets stay readable when split into ≤150-line files with a router/index and a link check; monolithic docs rot fast. | med |
| 2026-09 | Assets | Runtime-critical assets that are untracked (`public/media/`, `secret data/`) break fresh clones — track a curated pack or ship media in `.sfpack`, and ignore masters. | high |
| 2026-09 | Docs | Catalogs must be code-anchored (`file:line`); pure prose invents facts and misleads the next agent. | med |
| 2026-09 | Process | Before generating a large document set, gate on explicit questions (location, language, scope, granularity) — it prevents rework. | med |
| 2026-09 | Runtime | Redaction must be enforced server-side per role; a UI-only hide is not a control. | high |
| 2026-09 | Tests | Add a redaction test for every new role or data class, or hidden data leaks silently. | high |
| 2026-09 | Docs | Keep the concept's gap analysis and the plan backlog in sync with code in the same change; drift is worse than missing docs. | med |
| 2026-09 | Tooling | Non-interactive test runs only in agent sessions (no watch mode); kill stale dev servers before e2e. | low |
| 2026-09 | Process | Keep `AGENTS.md` a router (≤120 lines) that links topic files; never grow it into an encyclopedia or dump docs into tool instructions. | med |
| 2026-09 | Assets | Selectable-but-inert options (fonts without consumers, unused sounds) erode trust — wire them or remove them. | low |
| 2026-09 | Tooling | Never bulk-rewrite UTF-8 source files with PowerShell 5.1 `Get-Content`/`Set-Content` without explicit encoding — it mangles umlauts into mojibake. Use the editor tools or `-Encoding utf8` on both read and write. | med |
| 2026-09 | Tests | Triage failing tests before blaming your change: check whether the expectation still matches app text. Three e2e failures predated Phase 1 (OS modal label, trainer save notice, invite-expiry alert) and were unrelated to the start page. | med |
| 2026-09 | Tooling | NEVER name PowerShell helpers `rd`/`wr`/`mv`/`cp` — they collide with built-in aliases (`rd` = Remove-Item) and can delete files. Use verb-noun names or inline `[IO.File]` calls, and verify with `git diff --stat` after any scripted edit. | high |
| 2026-09 | Tooling | For bulk renames prefer the editor tools, or `[IO.File]::ReadAllText`/`WriteAllText` with an explicit UTF-8 no-BOM encoding. Tracked files are recoverable with `git checkout --`, but uncommitted working-tree edits are not. | med |
| 2026-09 | UI | HTML5 drag & drop does not work on touch — always ship a tap/keyboard path (palette click to add, inspector to bind) alongside DnD. | med |
| 2026-09 | Tests | The Playwright config runs the exercise server on a fixed port with `reuseExistingServer: false`; a leftover process from an aborted run blocks e2e. Kill port 8787 before re-running. | low |
| 2026-09 | Config | When reusing a scene id for a new meaning, version-gate the migration (config v1 `terminal` → `os`, v2 keeps `terminal` for the new CLI) — a value-based migration would make the new scene unreachable. | high |
| 2026-09 | UI | FUI layouts never reflow: fixed stage + `transform: scale()`, grid over `flex-wrap`, no visible scrollbars, capped data lists, and the central z-index registry (`--sf-z-*`) instead of local magic numbers. Gate: `npm run check:layout`. | high |
| 2026-09 | Scenes | A new scene is not usable in training until it is also a training module: add it to `modules`, `moduleEvents` and the builder palette, or missions cannot select it (the data-sheet gap). | med |
| 2026-09 | UI | Element content (scenes, blocks, field consoles) is English; German belongs to the studio/training chrome only. Keep `Firmenportal` / `Betriebssystem` / `Terminal` distinct — the old "Konzernsystem vs Betriebssystem" naming confused users. | high |
| 2026-09 | Tooling | Node's type-stripping runs the server against `.ts` sources, so any shared module the server imports must use explicit `.ts` extensions on its own relative imports (`./training.ts`), or `node --test` fails with `ERR_MODULE_NOT_FOUND`. | high |
| 2026-09 | Runtime | Restart safety comes from a snapshot plus an append-only event journal, not from the full-state broadcast; keep telemetry out of the journal and replay only records newer than the snapshot's `serverSeq`. | med |
| 2026-09 | Data | Additive Zod fields with `.default()` keep mission `version: 2` backward compatible; MEL v2 shipped without a version bump because every new field is optional. | med |
