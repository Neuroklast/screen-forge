// Layout contract gate — see docs/konzept/usability/09-layout-contracts.md.
// Errors fail the run (exit 1); warnings never fail.
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = ["src"];
const errors = [];
const warnings = [];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name.endsWith(".css")) out.push(path);
  }
  return out;
}

for (const root of roots) {
  let files = [];
  try {
    files = await walk(root);
  } catch {
    continue;
  }
  for (const file of files) {
    const rel = relative(process.cwd(), file).replace(/\\/g, "/");
    const lines = (await readFile(file, "utf8")).split(/\r?\n/);
    lines.forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      const z = line.match(/z-index:\s*(\d+)/);
      if (z) {
        const value = Number(z[1]);
        if (value >= 10)
          errors.push(`${at} raw z-index ${value} — use var(--sf-z-*)`);
        else if (value > 2)
          warnings.push(`${at} z-index ${value} below the registry — prefer tokens`);
      }
      if (/flex-wrap\s*:/.test(line))
        warnings.push(`${at} flex-wrap breaks the bento contract`);
      if (/overflow(-[xy])?\s*:\s*(auto|scroll)/.test(line))
        warnings.push(`${at} scroll container — hide the scrollbar and cap the data`);
    });
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
console.log(
  `check-layout: ${errors.length} error(s), ${warnings.length} warning(s)`,
);
process.exit(errors.length ? 1 : 0);
