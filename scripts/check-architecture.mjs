// Architecture contract gate — see docs/architecture/README.md.
// Errors fail the run (exit 1); warnings never fail.
//
// Existing debt is tolerated via TOLERATED and may only shrink. A new violation
// in a file that is not tolerated fails CI. The rules are intentionally
// conservative heuristics; they catch the drift that actually happens, not every
// conceivable case. Widen the rule only with a matching contract note.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SRC = join(root, "src");

// rule id -> files whose existing behaviour is accepted (owner or debt).
// Keep this list shrinking; add an entry only with a recorded reason.
const TOLERATED = {
  // Shared React Flow canvases are the one graph rendering implementation.
  graph: new Set([
    "src/builder/WorkflowCanvas.tsx",
    "src/components/ShowGraph.tsx",
  ]),
  // Components that derive findings from the pure linter are accepted.
  "business-rule": new Set([
    "src/builder/MissionBuilder.tsx",
    "src/builder/WorkflowGraph.tsx",
    "src/builder/WorkflowCanvas.tsx",
    "src/training/guided/GuidedBuilder.tsx",
    "src/training/prepare/FlowSection.tsx",
    "src/training/prepare/ReviewSection.tsx",
    "src/training/prepare/flow/FlowInspector.tsx",
  ]),
  // Legacy builder imports. Frozen: demo sandbox only.
  "deprecated-import": new Set(["src/demo/DemoHub.tsx"]),
  // Existing inline live-control edits in the shell.
  "direct-mutation": new Set([]),
  "workspace-shell": new Set([]),
  "preview-renderer": new Set([]),
  "duplicate-capability": new Set([]),
};

// One component owns each shared capability (see docs/architecture/ownership.md).
const CAPABILITY_OWNERS = {
  timer: "src/components/Timer.tsx",
  codeentry: "src/components/CodeEntry.tsx",
  messageviewer: "src/components/MessageViewer.tsx",
  filebrowser: "src/components/FileBrowser.tsx",
};

const RULE_TEXT = {
  graph: "second graph implementation — use src/core/graphEdit.ts + the shared canvas",
  "business-rule": "domain logic defined in a React component — move it to src/core",
  "deprecated-import": "import of a deprecated module — use the replacement",
  "direct-mutation":
    "direct domain mutation outside the command API — use a command (docs/architecture/commands.md)",
  "workspace-shell":
    "second workspace shell — use src/ui/WorkspaceShell.tsx (docs/architecture/workspace.md)",
  "preview-renderer":
    "preview-only renderer — reuse the runtime renderer (docs/architecture/previews.md)",
  "duplicate-capability":
    "duplicate component for a capability that already has an owner (docs/architecture/ownership.md)",
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const errors = [];
const warnings = [];
const fileCache = new Map();
function source(file) {
  if (!fileCache.has(file))
    fileCache.set(file, readFileSync(file, "utf8"));
  return fileCache.get(file);
}

function report(rule, rel, detail) {
  const message = `${rel}: ${RULE_TEXT[rule]}${detail ? ` (${detail})` : ""}`;
  if (TOLERATED[rule]?.has(rel)) warnings.push(`${rule}: ${message}`);
  else errors.push(`${rule}: ${message}`);
}

function basename(rel) {
  return rel.slice(rel.lastIndexOf("/") + 1);
}

for (const file of walk(SRC)) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) continue;
  const text = source(file);
  const base = basename(rel);
  const lower = base.replace(/\.tsx?$/, "").toLowerCase();

  // 1. No second graph implementation.
  if (/from\s+["']@xyflow\/react["']/.test(text)) report("graph", rel);

  // 2. No second workspace shell / dock framework.
  if (
    rel !== "src/ui/WorkspaceShell.tsx" &&
    (/(?:export\s+)?function\s+(?:WorkspaceShell|WorkspaceLayout|WorkspaceFrame)\b/.test(
      text,
    ) ||
      /^(WorkspaceShell|DockArea|WindowManager)\.tsx$/.test(base))
  )
    report("workspace-shell", rel);

  // 3. No preview-only renderer for a capability that has a runtime renderer.
  if (
    /(?:^|[/])[A-Za-z0-9]*Preview\.tsx$/.test(rel) &&
    /(?:sceneComponents|from\s+["'][^"']*\/scenes\/)/.test(text)
  )
    report("preview-renderer", rel);

  // 4. No domain logic defined inside a React component.
  if (
    rel.endsWith(".tsx") &&
    /^(?:export\s+)?(?:async\s+)?function\s+(?:compute|apply|validate|derive|migrate|lint|resolve)[A-Z]/.test(
      text,
    )
  )
    report("business-rule", rel);

  // 5. No direct domain mutation outside the command API (UI layer only;
  //    pure src/core modules may construct model objects).
  if (
    rel.endsWith(".tsx") &&
    /\.(stations|workflows|props|patients|injects|nodes|edges)\s*=[^=]/.test(
      text,
    ) &&
    /\b(?:draft|scenario|mission|state)\b/.test(text)
  )
    report("direct-mutation", rel);

  // 6. No new dependency on a deprecated editor path.
  if (/from\s+["'][^"']*MissionBuilder["']/.test(text))
    report("deprecated-import", rel);

  // 7. No duplicate component for a capability that already has an owner.
  const owner = CAPABILITY_OWNERS[lower];
  if (owner && rel !== owner) report("duplicate-capability", rel, owner);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
console.log(
  `check-architecture: ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
