import { useState, useEffect } from "react";
import { motion } from "motion/react";
export function CodePad({
  code,
  title,
  onUnlock,
}: {
  code: string;
  title: string;
  onUnlock: () => void;
}) {
  const [value, setValue] = useState(""),
    [denied, setDenied] = useState(0);
  const enter = (key: string) => {
    if (key === "clear") {
      setValue("");
      return;
    }
    if (key === "enter") {
      if (value === code) {
        window.dispatchEvent(
          new CustomEvent("screenforge:input", {
            detail: { type: "pin", value },
          }),
        );
        onUnlock();
      } else {
        setDenied((n) => n + 1);
        setValue("");
      }
      return;
    }
    setValue((v) => (v + key).slice(0, 8));
  };
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        enter(e.key);
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
    <div className="codepad-shade">
      <section
        className="codepad"
        role="dialog"
        aria-modal="true"
        aria-label="Zugangscode"
      >
        <span className="micro">{title} / ACCESS CONTROL</span>
        <h2>Authorization required</h2>
        <motion.div
          className="codepad-value"
          key={denied}
          initial={denied ? { x: -10 } : false}
          animate={{ x: 0 }}
        >
          {"●".repeat(value.length) || "— — — —"}
        </motion.div>
        <div className="codepad-grid">
          {[
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "clear",
            "0",
            "enter",
          ].map((k) => (
            <button key={k} onClick={() => enter(k)}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
        <p role="status">
          {denied ? "CODE REJECTED / RETRY" : "ENTER OPERATOR CODE"}
        </p>
      </section>
    </div>
  );
}
