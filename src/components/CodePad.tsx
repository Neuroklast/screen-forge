import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { playSound } from "../core/sound";
const numeric = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "enter"];
const qwerty = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
export function CodePad({
  code,
  title,
  heading,
  onUnlock,
  mode = "numeric",
  fake = false,
  embedded = false,
}: {
  code: string;
  title: string;
  heading: string;
  onUnlock: () => void;
  mode?: "numeric" | "alphanumeric";
  fake?: boolean;
  embedded?: boolean;
}) {
  const [value, setValue] = useState(""),
    [denied, setDenied] = useState(0),
    [pad, setPad] = useState(mode);
  const enter = (key: string) => {
    if (key === "clear") {
      playSound("click");
      setValue("");
      return;
    }
    if (key === "enter") {
      const ok = fake ? value.length >= 4 : value.toUpperCase() === code.toUpperCase();
      if (ok) {
        playSound("load");
        window.dispatchEvent(
          new CustomEvent("screenforge:input", {
            detail: { type: "pin", value },
          }),
        );
        onUnlock();
      } else {
        playSound("fail");
        setDenied((n) => n + 1);
        setValue("");
      }
      return;
    }
    playSound("type");
    setValue((v) => (v + key).slice(0, 8));
  };
  useEffect(() => {
    playSound("prompt");
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
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
        </span>
        <h2>{heading}</h2>
        <div className="codepad-modes">
          <button
            className={pad === "numeric" ? "active" : ""}
            onClick={() => setPad("numeric")}
          >
            NUMERIC
          </button>
          <button
            className={pad === "alphanumeric" ? "active" : ""}
            onClick={() => setPad("alphanumeric")}
          >
            ALPHANUMERIC
          </button>
        </div>
        <motion.div
          className="codepad-value"
          key={denied}
          initial={denied ? { x: -10 } : false}
          animate={{ x: 0 }}
        >
          {value || "— — — —"}
        </motion.div>
        {pad === "numeric" ? (
          <div className="codepad-grid">
            {numeric.map((k) => (
              <button key={k} onClick={() => enter(k)}>
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        ) : (
          <div className="codepad-grid alpha">
            {qwerty.map((row) => (
              <div className="codepad-row" key={row}>
                {row.split("").map((k) => (
                  <button key={k} onClick={() => enter(k)}>
                    {k}
                  </button>
                ))}
              </div>
            ))}
            <div className="codepad-row">
              <button className="wide" onClick={() => enter("clear")}>
                CLEAR
              </button>
              <button className="wide" onClick={() => enter("enter")}>
                ENTER
              </button>
            </div>
          </div>
        )}
        <p role="status">
          {denied
            ? "SIGNATURE MISMATCH / RETRY"
            : fake
              ? "ENTER ANY 4–8 CHAR KEY"
              : pad === "numeric"
                ? "ENTER NUMERIC OPERATOR CODE"
                : "ENTER ALPHANUMERIC DIAGNOSTIC KEY"}
        </p>
      </section>
    </div>
  );
}
