import { useEffect, useState } from "react";
import { playSound } from "../core/sound";
import { CodeEntry, type CodeEntryMode } from "./CodeEntry";

export function CodePad({
  code,
  title,
  heading,
  onUnlock,
  mode = "numeric",
  fake = false,
  embedded = false,
  attempts,
}: {
  code: string;
  title: string;
  heading: string;
  onUnlock: () => void;
  mode?: CodeEntryMode;
  fake?: boolean;
  embedded?: boolean;
  attempts?: number;
}) {
  const [denied, setDenied] = useState(0);
  const [pad, setPad] = useState<CodeEntryMode>(mode);
  const locked = attempts !== undefined && denied >= attempts;
  useEffect(() => {
    playSound("prompt");
  }, []);
  const submit = (value: string) => {
    const ok = fake
      ? value.length >= 4
      : value.toUpperCase() === code.toUpperCase();
    if (ok) {
      window.dispatchEvent(
        new CustomEvent("screenforge:input", {
          detail: { type: "pin", value },
        }),
      );
      onUnlock();
      return true;
    }
    setDenied((n) => n + 1);
    return false;
  };
  const status = locked
    ? "LOCKED / TOO MANY ATTEMPTS"
    : denied
      ? "SIGNATURE MISMATCH / RETRY"
      : fake
        ? "ENTER ANY 4–8 CHAR KEY"
        : pad === "numeric"
          ? "ENTER NUMERIC OPERATOR CODE"
          : "ENTER ALPHANUMERIC DIAGNOSTIC KEY";
  return (
    <div className={embedded ? "codepad-embed" : "codepad-shade"}>
      <section
        className={`codepad ${pad === "alphanumeric" ? "is-alpha" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={heading}
      >
        <span className="micro">
          {title} / {fake ? "LOCAL OVERRIDE" : "ACCESS CONTROL"}
          {attempts !== undefined
            ? ` / ${Math.max(0, attempts - denied)} ATTEMPTS`
            : ""}
        </span>
        <h2>{heading}</h2>
        <CodeEntry
          mode={mode}
          denied={denied}
          disabled={locked}
          onModeChange={setPad}
          onSubmit={submit}
        />
        <p role="status">{status}</p>
      </section>
    </div>
  );
}
