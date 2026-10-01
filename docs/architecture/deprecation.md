# Contract — Deprecation

## Purpose

Legacy code does not accumulate forever. Every replacement has an owner, a removal condition and a target milestone.

## Rules

- Any replacement MUST define:
  - old path
  - new path
  - migration owner
  - removal condition
  - target removal milestone
- No indefinite compatibility layer. No "keep for now" without a removal condition.
- Do not add new functionality to a deprecated component. Only compatibility fixes are allowed there.
- When a replacement reaches parity, delete the old path in the same change; do not leave both.

## Register

| Deprecated | Replacement | Owner | Removal condition | Target |
| --- | --- | --- | --- | --- |
| `src/builder/MissionBuilder.tsx` | Preparation six sections + Device Builder | preparation | demo sandbox parity / sandbox removal | after Device Builder slice |
| Inline `TrainerView` live-control patches | section command modules | preparation | live-control section migrates | next editor |
| `src/builder/WorkflowGraph.tsx` legacy canvas | `src/training/prepare/FlowSection.tsx` | flow | already superseded in preparation | keep for demo sandbox only |

## Allowed dependencies

- Deprecated modules may import stable core code; they must not be imported by new code.

## Forbidden dependencies

- New code importing a deprecated module.
- Extending a deprecated module with new behaviour.

## Extension points

- Add a row here before introducing any temporary compatibility path.

## Known exceptions

- `MissionBuilder` survives as the **demo sandbox builder** (`/?demo=1` → Sandbox), an offline showcase. It is frozen and allowlisted.

## Migration notes

- The architecture gate fails on a **new** import of a deprecated module. Existing imports are allowlisted.
