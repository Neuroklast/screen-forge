export type TakeEvent = {
  at: number;
  kind: "ok" | "fail" | "timeout";
  gate: string;
};
export function appendTake(
  log: TakeEvent[],
  event: TakeEvent,
  cap = 200,
): TakeEvent[] {
  return [...log, event].slice(-cap);
}
export function downloadTakeLog(name: string, log: TakeEvent[]) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ name, log }, null, 2)], {
      type: "application/json",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `screenforge-take.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
