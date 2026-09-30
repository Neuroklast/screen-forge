import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { playSound } from "../core/sound";

// One implementation of the code-entry capability (SSOT: never two). Used by
// the studio/Lock CodePad and by the workflow code-challenge surface. The host
// owns attempts/lockout and status copy; this component owns the buffer, the
// keypad, keyboard input, sounds and the denied shake.
export type CodeEntryMode = "numeric" | "alphanumeric";

const NUMERIC = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];
const QWERTY = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function CodeEntry({
  length = 8,
  minLength = 1,
  mode = "numeric",
  mask = false,
  denied = 0,
  disabled = false,
  showModeSwitch = true,
  labels,
  onKey,
  onSubmit,
  onModeChange,
}: {
  length?: number;
  minLength?: number;
  mode?: CodeEntryMode;
  mask?: boolean;
  denied?: number;
  disabled?: boolean;
  showModeSwitch?: boolean;
  labels?: { clear?: string; enter?: string };
  onKey?: (key: string) => void;
  // Return true for accepted (plays `load`), false for denied (plays `fail`),
  // or nothing when the host derives acceptance from external state.
  onSubmit: (value: string) => boolean | void;
  onModeChange?: (mode: CodeEntryMode) => void;
}) {
  const [value, setValue] = useState("");
  const [pad, setPad] = useState<CodeEntryMode>(mode);
  const enter = (key: string) => {
    if (disabled) return;
    if (key === "clear") {
      playSound("click");
      setValue("");
      return;
    }
    if (key === "enter") {
      if (value.length < minLength) return;
      const accepted = onSubmit(value);
      setValue("");
      if (accepted === true) playSound("load");
      else if (accepted === false) playSound("fail");
      return;
    }
    playSound("type");
    onKey?.(key);
    setValue((v) => (v + key).slice(0, length));
  };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (disabled) return;
      const k = e.key.toUpperCase();
      if (pad === "numeric" ? /^[0-9]$/.test(e.key) : /^[A-Z0-9]$/.test(k)) {
        e.preventDefault();
        enter(pad === "numeric" ? e.key : k);
      } else if (e.key === "Enter") {
        e.preventDefault();
        enter("enter");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setValue((v) => v.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  const setMode = (next: CodeEntryMode) => {
    setPad(next);
    onModeChange?.(next);
  };
  return (
    <>
      {showModeSwitch && (
        <div className="codepad-modes">
          <button
            className={pad === "numeric" ? "active" : ""}
            onClick={() => setMode("numeric")}
          >
            NUMERIC
          </button>
          <button
            className={pad === "alphanumeric" ? "active" : ""}
            onClick={() => setMode("alphanumeric")}
          >
            ALPHANUMERIC
          </button>
        </div>
      )}
      <motion.div
        className="codepad-value"
        key={denied}
        initial={denied ? { x: -10 } : false}
        animate={{ x: 0 }}
      >
        {value ? (mask ? "•".repeat(value.length) : value) : "— — — —"}
      </motion.div>
      {pad === "numeric" ? (
        <div className="codepad-grid">
          {NUMERIC.map((k) => (
            <button key={k} disabled={disabled} onClick={() => enter(k)}>
              {k === "clear"
                ? (labels?.clear ?? "CLEAR")
                : k === "enter"
                  ? (labels?.enter ?? "ENTER")
                  : k.toUpperCase()}
            </button>
          ))}
        </div>
      ) : (
        <div className="codepad-grid alpha">
          {QWERTY.map((row) => (
            <div className="codepad-row" key={row}>
              {row.split("").map((k) => (
                <button key={k} disabled={disabled} onClick={() => enter(k)}>
                  {k}
                </button>
              ))}
            </div>
          ))}
          <div className="codepad-row">
            <button className="wide" disabled={disabled} onClick={() => enter("clear")}>
              {labels?.clear ?? "CLEAR"}
            </button>
            <button className="wide" disabled={disabled} onClick={() => enter("enter")}>
              {labels?.enter ?? "ENTER"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
