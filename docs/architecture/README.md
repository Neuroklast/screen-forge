# Architecture Contracts

> ScreenForge · Implementation contracts (how the code is allowed to be structured) · Language: EN
> Product/UX target state: [../konzept/README.md](../konzept/README.md) · Plan: [../plan/README.md](../plan/README.md)
> Read the contract that owns the area you are about to change **before** changing it.

The concept set says *what* ScreenForge must be. The plan says *what we are building next*. These contracts say *how the code must be structured* so the product does not drift into several parallel implementations of the same thing.

Each contract states: purpose, owner, allowed dependencies, forbidden dependencies, extension points, known exceptions, migration notes.

| Contract | Owns |
| --- | --- |
| [workspace.md](workspace.md) | The shared editor shell and its panes |
| [editor-state.md](editor-state.md) | Selection, transient vs. persistent state, the single model |
| [commands.md](commands.md) | The only write path for editor mutations |
| [previews.md](previews.md) | Live preview, runtime renderer reuse, preview states |
| [ownership.md](ownership.md) | One owner per responsibility (renderer, domain, validator, terminology, graph, workspace) |
| [terminology.md](terminology.md) | Semantic label resolution and the i18n boundary |
| [deprecation.md](deprecation.md) | Replacement, removal criteria and the no-new-features rule |

## Rules that apply to all contracts

- **One owner per responsibility.** If a capability already has an owner, extend it; do not fork it.
- **Do not fork behaviour for convenience.** Extend a shared abstraction only when the semantic capability is genuinely the same; create a new abstraction only when the domain concept is genuinely different.
- **Every new abstraction must either replace duplication or establish a reusable product primitive.** If it does neither, do not add it.
- **Existing debt is allowlisted; new violations fail CI.** `scripts/check-architecture.mjs` tolerates current offenders and fails on new ones. The allowlist only shrinks.
- **Do not optimise for finishing the current screen.** Optimise for preserving one coherent product architecture after the next 50 screens.
- **A feature is not done until** it uses the shared primitives, has no duplicated domain logic or renderer, is undoable, previews through the runtime renderer, is keyboard reachable, has empty/loading/error states, has no hardcoded terminology, and updates these contracts when the architecture changes.
