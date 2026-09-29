import { useEffect, useRef, useState } from "react";
import { StageKeys } from "../../components/StageKeys";
import { playSound } from "../../core/sound";
import type { SceneProps } from "../Scenes";
import "./terminal.css";

type ChainStep = { command: string; outputs: string[]; hint: string };

// Default goal chain: bypass a legacy login. Fictional commands and outputs only.
const CHAIN: ChainStep[] = [
  {
    command: "status",
    outputs: [
      "relay-07 · link established",
      "session: guest / restricted",
      "auth service: legacy",
    ],
    hint: "Start with `status`.",
  },
  {
    command: "scan --local",
    outputs: ["ports: 3 open", "service: auth v2.1", "note: default token policy"],
    hint: "Scan the local node: `scan --local`.",
  },
  {
    command: "inspect auth",
    outputs: [
      "auth service v2.1",
      "weakness: default maintenance token",
      "token id: 07-RELAY",
    ],
    hint: "Inspect the auth service.",
  },
  {
    command: "login --token 07-RELAY",
    outputs: ["token accepted", "elevating session ...", "ACCESS GRANTED"],
    hint: "Use the maintenance token to log in.",
  },
];

function signal(value: string) {
  window.dispatchEvent(
    new CustomEvent("screenforge:input", { detail: { type: "signal", value } }),
  );
}

export function Terminal({ config, cue, onCue, onPlay }: SceneProps) {
  const options = config.sceneOptions.terminal;
  const chain = options.steps.length ? options.steps : CHAIN;
  const steps = options.steps.length
    ? chain
    : chain.slice(
        0,
        Math.max(1, Math.min(options.commandsUntilSuccess, chain.length)),
      );
  const [log, setLog] = useState<string[]>([
    `${options.prompt} · ${options.goal}`,
    "Type `help` for available commands.",
  ]);
  const [value, setValue] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const append = (lines: string[]) =>
    setLog((old) => [...old, ...lines].slice(-200));

  const submit = (raw: string) => {
    const command = raw.trim();
    if (!command) return;
    append([`${options.prompt} $ ${command}`]);
    setValue("");
    if (done) return;
    if (command === "help") {
      append(["commands: status, scan --local, inspect auth, login --token …"]);
      return;
    }
    const expected = steps[step];
    if (!expected || command !== expected.command) {
      playSound("fail");
      setAttempts((n) => n + 1);
      append([
        `error: unknown or ineffective command`,
        attempts + 1 >= 2 ? `hint: ${expected?.hint ?? ""}` : "",
      ].filter(Boolean));
      return;
    }
    playSound("newline");
    append(expected.outputs);
    const next = step + 1;
    setStep(next);
    if (next >= steps.length) {
      setDone(true);
      append([options.successText]);
      onCue("complete");
      signal("shell.success");
      signal("terminal.bypass");
    }
  };

  return (
    <div className="terminal-scene scene-inner">
      <header className="terminal-header">
        <strong>{config.title}</strong>
        <span>
          {options.goal} · Schritt {Math.min(step + 1, steps.length)}/{steps.length}
          {cue === "complete" || done ? " · ABGESCHLOSSEN" : ""}
        </span>
      </header>
      <div
        className="terminal-log"
        role="log"
        aria-label="Terminalausgabe"
        ref={logRef}
      >
        {log.map((line, i) => (
          <div key={i} className={line.startsWith("error") ? "is-error" : ""}>
            {line}
          </div>
        ))}
      </div>
      <form
        className="terminal-input"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
          onPlay?.();
          input.current?.focus();
        }}
      >
        <span>{options.prompt} $</span>
        <input
          ref={input}
          aria-label="Terminaleingabe"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            playSound("type");
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit">Enter</button>
        {options.actorMode && !done && (
          <button
            type="button"
            onClick={() => {
              setValue(steps[step]?.command ?? "");
              input.current?.focus();
            }}
          >
            Vorbereitet tippen
          </button>
        )}
      </form>
      <StageKeys
        onKey={(key) => {
          if (key === "Enter") {
            submit(value);
            return;
          }
          if (key === "Backspace") {
            setValue((v) => v.slice(0, -1));
            return;
          }
          setValue((v) => (v.length < 120 ? v + key : v));
          playSound("type");
        }}
        disabled={done}
      />
    </div>
  );
}
