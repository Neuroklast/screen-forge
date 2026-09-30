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
function options(
  base: Config,
  patch: {
    os?: Partial<Config["sceneOptions"]["os"]>;
    terminal?: Partial<Config["sceneOptions"]["terminal"]>;
    countdown?: Partial<Config["sceneOptions"]["countdown"]>;
  },
): Pick<Config, "sceneOptions"> {
  return {
    sceneOptions: {
      ...base.sceneOptions,
      os: { ...base.sceneOptions.os, ...patch.os },
      terminal: { ...base.sceneOptions.terminal, ...patch.terminal },
      countdown: { ...base.sceneOptions.countdown, ...patch.countdown },
    },
  };
}
export function showTemplates(base: Config): { name: string; show: Show }[] {
  const id = identityOf(base);
  const pin = base.pin || "2048";
  const term = scene(base, "terminal", id);
  const os = scene(base, "os", id);
  const track = scene(base, "tracking", id);
  const count = scene(base, "countdown", {
    ...id,
    ...options(base, { countdown: { variant: "antimatter" } }),
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
            ...options(term, { terminal: { actorMode: false } }),
            pinEnabled: true,
            pinMode: "alphanumeric",
            pin: "A7F3",
          },
        }),
        node(
          "Find locator file",
          scene(base, "os", {
            ...id,
            ...options(base, { os: { startupApp: "files" } }),
          }),
          {
            trigger: "signal",
            value: gate("file.found", "/archives/locator.beacon"),
            config: {
              ...os,
              ...options(os, { os: { startupApp: "files" } }),
              pinEnabled: false,
            },
          },
        ),
        node(
          "Locator handshake",
          scene(base, "terminal", {
            ...id,
            ...options(base, { os: { startupApp: "terminal" } }),
          }),
          {
            trigger: "signal",
            value: gate("shell.success"),
            config: {
              ...term,
              ...options(term, {
                os: { startupApp: "terminal" },
                terminal: {
                  actorMode: true,
                  commandsUntilSuccess: 1,
                  script: "locator handshake --id 12 --verify",
                },
              }),
              pinEnabled: false,
            },
          },
        ),
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
        node(
          "Find sealed volume",
          scene(base, "os", {
            ...id,
            ...options(base, { os: { startupApp: "files" } }),
          }),
          {
            trigger: "signal",
            value: gate("file.found", "/archives/sector-07.fragment"),
            config: {
              ...os,
              ...options(os, { os: { startupApp: "files" } }),
              pinEnabled: false,
            },
          },
        ),
        node(
          "Decrypt volume",
          scene(base, "os", {
            ...id,
            ...options(base, { os: { startupApp: "files" } }),
          }),
          {
            trigger: "signal",
            value: gate("file.decrypt", "/archives/sector-07.fragment"),
            config: {
              ...os,
              ...options(os, { os: { startupApp: "files" } }),
              pinEnabled: false,
            },
          },
        ),
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
        node(
          "COMMIT QUEUE",
          scene(base, "terminal", {
            ...id,
            ...options(base, { os: { startupApp: "terminal" } }),
          }),
          {
            trigger: "signal",
            value: gate("shell.success"),
            config: {
              ...term,
              ...options(term, {
                os: { startupApp: "terminal" },
                terminal: {
                  actorMode: true,
                  commandsUntilSuccess: 2,
                  script: "commit queue --image PKG08",
                },
              }),
              pinEnabled: false,
            },
          },
        ),
      ]),
    },
    {
      name: "Countermeasure",
      show: chain("Countermeasure", [
        node(
          "ISOLATE SESSION",
          scene(base, "terminal", {
            ...id,
            ...options(base, { os: { startupApp: "terminal" } }),
          }),
          {
            cue: "warning",
            trigger: "signal",
            value: gate("shell.success"),
            config: {
              ...term,
              ...options(term, {
                os: { startupApp: "terminal" },
                terminal: {
                  actorMode: true,
                  commandsUntilSuccess: 2,
                  script: "isolate session --force",
                },
              }),
            },
          },
        ),
        node(
          "RESTORE SHELL",
          scene(base, "terminal", {
            ...id,
            ...options(base, { os: { startupApp: "terminal" } }),
          }),
          {
            cue: "complete",
            trigger: "signal",
            value: gate("shell.success"),
            config: {
              ...term,
              ...options(term, {
                os: { startupApp: "terminal" },
                terminal: {
                  actorMode: true,
                  commandsUntilSuccess: 1,
                  script: "restore shell",
                },
              }),
            },
          },
        ),
      ]),
    },
    {
      name: "Door Lockdown",
      show: chain("Door Lockdown", [
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
        node(
          "OPEN DOSSIER",
          scene(base, "os", {
            ...id,
            ...options(base, { os: { startupApp: "personnel" } }),
          }),
          {
            trigger: "signal",
            value: "dossier.open",
            config: {
              ...os,
              ...options(os, { os: { startupApp: "personnel" } }),
              pinEnabled: false,
            },
          },
        ),
        node("PAGE DUTY", scene(base, "medical", id), {
          trigger: "signal",
          value: "medical.enable",
        }),
      ]),
    },
    {
      name: "Einrichtungsterminal",
      show: chain("Einrichtungsterminal", [
        node(
          "Find notes",
          scene(base, "os", {
            ...id,
            ...options(base, { os: { startupApp: "files" } }),
          }),
          {
            cue: "idle",
            trigger: "signal",
            value: gate("file.found", "/workspace/operator.notes"),
            config: {
              ...os,
              ...options(os, { os: { startupApp: "files" } }),
            },
          },
        ),
        node(
          "END SESSION",
          scene(base, "terminal", {
            ...id,
            ...options(base, { os: { startupApp: "terminal" } }),
          }),
          {
            cue: "idle",
            trigger: "signal",
            value: gate("shell.success"),
            config: {
              ...term,
              ...options(term, {
                os: { startupApp: "terminal" },
                terminal: {
                  actorMode: true,
                  commandsUntilSuccess: 1,
                  script: "status",
                },
              }),
            },
          },
        ),
      ]),
    },
  ];
}
export const showTemplateLabels = [
  "Ortungsbake aktivieren",
  "Sprengkopf-Wartung",
  "Archiv-Extraktion",
  "Service-Image laden",
  "Countermeasure",
  "Door Lockdown",
  "Medizinischer Notfall",
  "Einrichtungsterminal",
] as const;
