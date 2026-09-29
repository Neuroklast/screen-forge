import { identityOf, withScene, type Config } from "./config";
import { gate, type Show, type Step } from "./director";
function node(
  name: string,
  config: Config,
  extra: Partial<Step> = {},
): Omit<Step, "id" | "next"> {
  return {
    name,
    config,
    cue: "active",
    operation: "",
    trigger: "key",
    duration: 12,
    value: "Enter",
    onFail: "",
    timeout: 0,
    ...extra,
  };
}
function chain(name: string, parts: Omit<Step, "id" | "next">[]): Show {
  const steps: Step[] = parts.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    next: "",
  }));
  steps.forEach((s, i) => {
    s.next = i === steps.length - 1 ? "end" : steps[i + 1].id;
  });
  return { version: 2, name, steps };
}
function scene(
  base: Config,
  id: Config["scene"],
  extra: Partial<Config> = {},
): Config {
  return { ...withScene(base, id), ...extra, scene: id };
}
export function showTemplates(base: Config): { name: string; show: Show }[] {
  const id = identityOf(base);
  const pin = base.pin || "2048";
  const term = scene(base, "terminal", id);
  const track = scene(base, "tracking", id);
  const count = scene(base, "countdown", {
    ...id,
    device: "antimatter",
    duration: 180,
    pinEnabled: true,
    pin,
  });
  const corp = scene(base, "corporate", id);
  return [
    {
      name: "Ortungsbake aktivieren",
      show: chain("Ortungsbake", [
        node("TRANSPONDER ID", term, {
          cue: "idle",
          trigger: "pin",
          value: "A7F3",
          config: {
            ...term,
            pinEnabled: true,
            pinMode: "alphanumeric",
            pin: "A7F3",
            actorMode: false,
          },
        }),
        node("Find locator file", scene(base, "terminal", { ...id, osApp: "files" }), {
          trigger: "signal",
          value: gate("file.found", "/archives/locator.beacon"),
          config: {
            ...term,
            osApp: "files",
            pinEnabled: false,
            actorMode: false,
          },
        }),
        node("Locator handshake", scene(base, "terminal", { ...id, osApp: "terminal" }), {
          trigger: "signal",
          value: gate("shell.success"),
          config: {
            ...term,
            osApp: "terminal",
            pinEnabled: false,
            actorMode: true,
            commandsUntilSuccess: 1,
            script: "locator handshake --id 12 --verify",
          },
        }),
        node("HOLD SENSOR", track, {
          trigger: "signal",
          value: "track.lock",
        }),
      ]),
    },
    {
      name: "Sprengkopf-Wartung",
      show: chain("Sprengkopf-Wartung", [
        node("KEYPAD", scene(base, "lock", { ...id, pin, pinMode: "numeric" }), {
          cue: "idle",
          trigger: "signal",
          value: "lock.open",
        }),
        node("SLIDE", scene(base, "slide", id), {
          trigger: "signal",
          value: "slide.open",
        }),
        node("HOLD CONTAINMENT", count, {
          cue: "warning",
          trigger: "signal",
          value: "device.safe",
          config: { ...count, pinEnabled: false },
        }),
      ]),
    },
    {
      name: "Archiv-Extraktion",
      show: chain("Archiv-Extraktion", [
        node("BREAK SEAL", term, {
          cue: "idle",
          trigger: "pin",
          value: pin,
          config: {
            ...term,
            pinEnabled: true,
            pinMode: "numeric",
            pin,
          },
        }),
        node("Find sealed volume", scene(base, "terminal", { ...id, osApp: "files" }), {
          trigger: "signal",
          value: gate("file.found", "/archives/sector-07.fragment"),
          config: { ...term, osApp: "files", pinEnabled: false, actorMode: false },
        }),
        node("Decrypt volume", scene(base, "terminal", { ...id, osApp: "files" }), {
          trigger: "signal",
          value: gate("file.decrypt", "/archives/sector-07.fragment"),
          config: { ...term, osApp: "files", pinEnabled: false, actorMode: false },
        }),
      ]),
    },
    {
      name: "Service-Image laden",
      show: chain("Service-Image", [
        node("IMAGE CHECKSUM", term, {
          cue: "idle",
          trigger: "pin",
          value: "PKG08",
          config: {
            ...term,
            pinEnabled: true,
            pinMode: "alphanumeric",
            pin: "PKG08",
          },
        }),
        node("COMMIT QUEUE", scene(base, "terminal", { ...id, osApp: "terminal" }), {
          trigger: "signal",
          value: gate("shell.success"),
          config: {
            ...term,
            osApp: "terminal",
            pinEnabled: false,
            actorMode: true,
            commandsUntilSuccess: 2,
            script: "commit queue --image PKG08",
          },
        }),
      ]),
    },
    {
      name: "Gegenmaßnahme",
      show: chain("Gegenmaßnahme", [
        node("ISOLATE SESSION", scene(base, "terminal", { ...id, osApp: "terminal" }), {
          cue: "warning",
          trigger: "signal",
          value: gate("shell.success"),
          config: {
            ...term,
            osApp: "terminal",
            actorMode: true,
            commandsUntilSuccess: 2,
            script: "isolate session --force",
          },
        }),
        node("RESTORE SHELL", scene(base, "terminal", { ...id, osApp: "terminal" }), {
          cue: "complete",
          trigger: "signal",
          value: gate("shell.success"),
          config: {
            ...term,
            osApp: "terminal",
            actorMode: true,
            commandsUntilSuccess: 1,
            script: "restore shell",
          },
        }),
      ]),
    },
    {
      name: "Türverriegelung",
      show: chain("Türverriegelung", [
        node("Diagnostic key", term, {
          cue: "idle",
          trigger: "pin",
          value: pin,
          config: {
            ...term,
            pinEnabled: true,
            pinMode: "numeric",
            pin,
          },
        }),
        node("UNLATCH", scene(base, "access", id), {
          trigger: "signal",
          value: "access.open",
        }),
      ]),
    },
    {
      name: "Medizinischer Notfall",
      show: chain("Medizinischer Notfall", [
        node("ENABLE PROTOCOL", corp, {
          cue: "warning",
          trigger: "key",
          value: "e",
        }),
        node("OPEN DOSSIER", scene(base, "terminal", { ...id, osApp: "personnel" }), {
          trigger: "signal",
          value: "dossier.open",
          config: { ...term, osApp: "personnel", pinEnabled: false },
        }),
        node("PAGE DUTY", scene(base, "medical", id), {
          trigger: "signal",
          value: "medical.enable",
        }),
      ]),
    },
    {
      name: "Einrichtungsterminal",
      show: chain("Einrichtungsterminal", [
        node("Find notes", scene(base, "terminal", { ...id, osApp: "files" }), {
          cue: "idle",
          trigger: "signal",
          value: gate("file.found", "/workspace/operator.notes"),
          config: { ...term, osApp: "files", actorMode: false },
        }),
        node("END SESSION", scene(base, "terminal", { ...id, osApp: "terminal" }), {
          cue: "idle",
          trigger: "signal",
          value: gate("shell.success"),
          config: {
            ...term,
            osApp: "terminal",
            actorMode: true,
            commandsUntilSuccess: 1,
            script: "status",
          },
        }),
      ]),
    },
  ];
}
export const showTemplateLabels = [
  "Ortungsbake aktivieren",
  "Sprengkopf-Wartung",
  "Archiv-Extraktion",
  "Service-Image laden",
  "Gegenmaßnahme",
  "Türverriegelung",
  "Medizinischer Notfall",
  "Einrichtungsterminal",
] as const;
