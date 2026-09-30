import { useEffect, useRef, useState } from "react";
import { StageKeys } from "../../components/StageKeys";
import { scriptedInput } from "../../core/runtime";
import { playSound } from "../../core/sound";
import { terminalScript, terminalScripts } from "../../core/terminalScripts";
import type { SceneProps } from "../Scenes";
import "./terminal.css";

// Fallback chain when no preset and no custom steps are configured.
const FALLBACK = terminalScripts[0].steps;

function signal(value: string) {
  window.dispatchEvent(
    new CustomEvent("screenforge:input", { detail: { type: "signal", value } }),
  );
}

export function Terminal({ config, cue, onCue, onPlay }: SceneProps) {
  const options = config.sceneOptions.terminal;
  const preset = terminalScript(options.preset);
  const chain = options.steps.length ? options.steps : (preset?.steps ?? FALLBACK);
  const steps =
    options.steps.length || preset
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
  const [flash, setFlash] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), 160);
    return () => window.clearTimeout(id);
  }, [flash]);
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
          {options.goal} · Step {Math.min(step + 1, steps.length)}/{steps.length}
          {cue === "complete" || done ? " · COMPLETE" : ""}
        </span>
      </header>
      <div
        className="terminal-log"
        role="log"
        aria-label="Terminal output"
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
          aria-label="Terminal input"
          value={value}
          onKeyDown={(e) => {
            if (e.key.length === 1) setFlash(e.key.toUpperCase());
            else if (e.key === "Backspace" || e.key === "Enter")
              setFlash(e.key);
            if (!options.actorMode || done) return;
            if (e.key.length === 1 || e.key === "Backspace") {
              e.preventDefault();
              if (e.key.length === 1) playSound("type");
              setValue((v) =>
                scriptedInput(steps[step]?.command ?? "", v, e.key),
              );
            }
          }}
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
            Prepared typing
          </button>
        )}
      </form>
      <StageKeys
        active={flash}
        onKey={(key) => {
          setFlash(key);
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
