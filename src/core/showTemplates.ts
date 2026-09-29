import { identityOf, withScene, type Config } from "./config";
import type { Show, Step } from "./director";
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
  return { version: 1, name, steps };
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
        node("Locator handshake", term, {
          operation: "beacon",
          trigger: "signal",
          value: "shell.submit",
          config: {
            ...term,
            pinEnabled: false,
            actorMode: true,
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
        node("ACCESS", count, {
          cue: "idle",
          trigger: "pin",
          value: pin,
          config: { ...count, pinEnabled: true, pinMode: "numeric", pin },
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
        node("COPY VOLUME", term, {
          operation: "theft",
          trigger: "signal",
          value: "shell.submit",
          config: {
            ...term,
            pinEnabled: false,
            actorMode: true,
            script: "extract --sealed 04 --read-only",
          },
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
        node("COMMIT QUEUE", term, {
          operation: "payload",
          trigger: "key",
          value: "c",
          config: { ...term, pinEnabled: false, actorMode: false },
        }),
      ]),
    },
    {
      name: "Gegenmaßnahme",
      show: chain("Gegenmaßnahme", [
        node("ISOLATE SESSION", term, {
          operation: "counterhack",
          cue: "warning",
          trigger: "key",
          value: "x",
        }),
        node("RESTORE SHELL", term, {
          cue: "complete",
          trigger: "key",
          value: "y",
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
        node("UNLATCH", term, {
          operation: "door",
          trigger: "key",
          value: "o",
          config: { ...term, pinEnabled: false },
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
        node("PAGE DUTY", term, {
          operation: "medical",
          trigger: "key",
          value: "p",
        }),
      ]),
    },
    {
      name: "Einrichtungsterminal",
      show: chain("Einrichtungsterminal", [
        node("Directory", term, {
          operation: "facility",
          cue: "idle",
          trigger: "key",
          value: "n",
          config: { ...term, actorMode: true, script: "ls /facility" },
        }),
        node("END SESSION", term, {
          cue: "idle",
          trigger: "key",
          value: "q",
          config: { ...term, actorMode: true, script: "status" },
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
