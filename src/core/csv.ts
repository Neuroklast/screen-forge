// One CSV encoder for every export. Scenario-authored text may start with a
// spreadsheet formula character (`=`, `+`, `-`, `@`, tab, CR); a leading
// apostrophe keeps the exported cell inert when opened in a spreadsheet.
export function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function csvRow(cells: readonly (string | number)[]): string {
  return cells.map(csvCell).join(",");
}
