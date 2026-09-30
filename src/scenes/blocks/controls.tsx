import { useState } from "react";
import { playSound } from "../../core/sound";
import "./instruments.css";

// Shared widget controls (SSOT: one implementation per capability). The studio
// scene and the workflow surface both render these; only the host chrome and
// the completion callback differ.

export function RotaryControl({
  targets,
  disabled = false,
  onComplete,
  onReject,
}: {
  targets: number[];
  disabled?: boolean;
  onComplete: () => void;
  onReject?: () => void;
}) {
  const [values, setValues] = useState(() => targets.map(() => 15));
  const aligned = values.every((v, i) => Math.abs(v - targets[i]) <= 2);
  const set = (i: number, n: number) =>
    setValues((v) =>
      v.map((x, j) => (j === i ? Math.max(0, Math.min(100, n)) : x)),
    );
  const confirm = () => {
    if (disabled) return;
    if (aligned) {
      playSound("load");
      onComplete();
    } else {
      playSound("fail");
      onReject?.();
    }
  };
  return (
    <>
      <div className="rotary-dials">
        {values.map((value, i) => (
          <div
            key={i}
            className={`rotary-dial ${Math.abs(value - targets[i]) <= 2 ? "is-aligned" : ""}`}
          >
            <span>DIAL {["A", "B", "C", "D"][i]}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              aria-label={`Dial ${i + 1}`}
              disabled={disabled}
              onChange={(e) => {
                playSound("osTick");
                set(i, Number(e.target.value));
              }}
            />
            <b>
              {value}
              <small>REF {targets[i]}</small>
            </b>
          </div>
        ))}
      </div>
      <button className="scene-button" disabled={disabled} onClick={confirm}>
        {aligned ? "CONFIRM ALIGNMENT" : "ALIGN ALL DIALS"}
      </button>
    </>
  );
}

export function CodeTableControl({
  message,
  disabled = false,
  onComplete,
  onAttempt,
}: {
  message: string;
  disabled?: boolean;
  onComplete: () => void;
  onAttempt?: (attempts: number) => void;
}) {
  const target = (message || "RELAY").toUpperCase();
  const cipher = target
    .split("")
    .map((c) =>
      /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 64).padStart(2, "0") : c,
    )
    .join(" ");
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const submit = () => {
    if (disabled) return;
    if (value.trim().toUpperCase() === target) {
      playSound("load");
      onComplete();
    } else {
      playSound("fail");
      const next = attempts + 1;
      setAttempts(next);
      setValue("");
      onAttempt?.(next);
    }
  };
  return (
    <>
      <div className="code-cipher">{cipher}</div>
      <table className="code-table">
        <tbody>
          {Array.from({ length: 26 }, (_, i) => (
            <tr key={i}>
              <td>{String(i + 1).padStart(2, "0")}</td>
              <td>{String.fromCharCode(65 + i)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="code-input">
        <input
          aria-label="Decoded message"
          value={value}
          disabled={disabled}
          placeholder="DECODED MESSAGE"
          onChange={(e) => setValue(e.target.value.toUpperCase())}
        />
        <button className="scene-button" disabled={disabled} onClick={submit}>
          SUBMIT
        </button>
      </div>
    </>
  );
}

export type SheetEntry = {
  code: string;
  name: string;
  body: string;
  correct: boolean;
};
export type SheetSubject = {
  title: string;
  search: string[];
  archive: SheetEntry[];
  lines: string[];
  steps: string[];
  relayText: string;
};

// Fictional datasheets per hurdle. The operator must search the archive and
// open the correct entry before the procedure is revealed.
export const SHEET_SUBJECTS: Record<string, SheetSubject> = {
  countdown: {
    title: "SEQUENCE CONTROL / DATASHEET 09-C",
    search: ["containment", "09-04", "bypass"],
    archive: [
      {
        code: "ARC-07-01",
        name: "Coolant loop A",
        body: "Nominal 4.20 K / loop A only. Contains no bypass path.",
        correct: false,
      },
      {
        code: "ARC-09-04",
        name: "Containment bypass",
        body: "Bypass order and phase tolerances. Revision 09-C.",
        correct: true,
      },
      {
        code: "ARC-12-02",
        name: "Firmware notes",
        body: "Diagnostic tier 04. Superseded by 09-C.",
        correct: false,
      },
    ],
    lines: [
      "B_FIELD_AXIAL 0.240 T ±0.004",
      "CRYO_TEMP_LHE 4.20 K ±0.05",
      "CHAMBER_VACUUM 3.1e-8 Torr max",
      "PHASE A/B/C REF 25–75 %",
      "CROSS-REF ARC-09-04 / TIER 04",
    ],
    steps: [
      "Diagnostics: wait for CHANNEL SCAN (8 s)",
      "Enter shunt code A7F3",
      "Trim phases A/B/C to reference (±2)",
      "HOLD 3 s — restore containment",
    ],
    relayText: "Relay bypass order and tolerances via radio.",
  },
  terminal: {
    title: "BLACKLINE / AUTH RECOVERY DATASHEET",
    search: ["auth", "token", "07"],
    archive: [
      {
        code: "NET-02",
        name: "Port map",
        body: "Three open ports. No credential path.",
        correct: false,
      },
      {
        code: "AUTH-07",
        name: "Legacy token",
        body: "Maintenance token 07-RELAY, auth service v2.1.",
        correct: true,
      },
      {
        code: "LOG-11",
        name: "Session notes",
        body: "Guest session only. Superseded by AUTH-07.",
        correct: false,
      },
    ],
    lines: [
      "SERVICE auth v2.1",
      "TOKEN 07-RELAY (maintenance)",
      "CMD login --token 07-RELAY",
      "CROSS-REF AUTH-07",
    ],
    steps: [
      "status — check link",
      "scan --local — enumerate ports",
      "inspect auth — confirm weakness",
      "login --token 07-RELAY — elevate session",
    ],
    relayText: "Relay token and command order via radio.",
  },
  access: {
    title: "DOOR 02 / INTERLOCK DATASHEET",
    search: ["override", "failsafe", "acs"],
    archive: [
      {
        code: "ACS-01",
        name: "Bolt current",
        body: "Ramp 0–100 % over 2 s. No release path.",
        correct: false,
      },
      {
        code: "ACS-02",
        name: "Failsafe override",
        body: "Override order and relock delay. Revision ACS-02.",
        correct: true,
      },
    ],
    lines: ["HOLD 2.0 s for unlatch", "RE-LOCK delay 30 s", "CROSS-REF ACS-02"],
    steps: ["Enter access code", "HOLD to unlatch", "Verify interlock"],
    relayText: "Relay override order via radio.",
  },
};

export type DataSheetOptions = {
  subject?: string;
  title?: string;
  image?: string;
  search?: string[];
  archive?: SheetEntry[];
  lines?: string[];
  steps?: string[];
  relayText?: string;
};

export function DataSheetControl({
  subject = "countdown",
  title,
  image,
  search,
  archive,
  lines,
  steps,
  relayText,
  disabled = false,
  onComplete,
}: DataSheetOptions & { disabled?: boolean; onComplete: () => void }) {
  const base = SHEET_SUBJECTS[subject] ?? SHEET_SUBJECTS.countdown;
  const heading = title || base.title;
  const hints = search?.length ? search : base.search;
  const entries = archive?.length ? archive : base.archive;
  const sheetLines = lines?.length ? lines : base.lines;
  const sheetSteps = steps?.length ? steps : base.steps;
  const relayLabel = relayText || base.relayText;
  const [query, setQuery] = useState("");
  const [tries, setTries] = useState(0);
  const [opened, setOpened] = useState<SheetEntry | null>(null);
  const [read, setRead] = useState<boolean[]>(() => sheetSteps.map(() => false));
  const found = opened?.correct === true;
  const results = query.trim()
    ? entries.filter((e) =>
        `${e.code} ${e.name} ${e.body}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : [];
  const allRead = found && read.every(Boolean);
  const relay = () => {
    if (!allRead || disabled) return;
    playSound("load");
    onComplete();
  };
  return (
    <>
      <header className="instrument-head">
        <span>{heading}</span>
        <b>{found ? (allRead ? "READY TO RELAY" : "OPEN") : "ARCHIVE LOCKED"}</b>
      </header>

      {!found && (
        <>
          <p className="sheet-locked">
            No datasheet loaded. Search the archive and open the correct
            revision.
          </p>
          <form
            className="sheet-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (!results.length) setTries((n) => n + 1);
              playSound("click");
            }}
          >
            <input
              aria-label="Archive search"
              value={query}
              placeholder="SEARCH TERM"
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="scene-button" type="submit">
              SEARCH ARCHIVE
            </button>
          </form>
          {tries > 0 && (
            <p className="sheet-hint">
              Hint: narrow by revision or component — e.g. {hints[0]}.
            </p>
          )}
          <ul className="sheet-results">
            {results.map((e) => (
              <li key={e.code}>
                <button
                  className={`sheet-result ${opened?.code === e.code ? "is-open" : ""}`}
                  onClick={() => {
                    playSound("openFolder");
                    setOpened(e);
                    setRead(sheetSteps.map(() => false));
                  }}
                >
                  <span>{e.code}</span>
                  <b>{e.name}</b>
                  <small>{opened?.code === e.code ? e.body : "open"}</small>
                </button>
              </li>
            ))}
            {query && !results.length && (
              <li className="sheet-empty">No record found for "{query}".</li>
            )}
          </ul>
          {opened && !opened.correct && (
            <p className="sheet-hint">
              This record contains no disposal path.
            </p>
          )}
        </>
      )}

      {found && (
        <div className="sheet-layout">
          <figure className="sheet-figure">
            {image ? (
              <img src={image} alt="Schema" />
            ) : (
              <svg viewBox="0 0 200 140" aria-label="Schematic (fictional)">
                <rect x="20" y="20" width="160" height="100" fill="none" stroke="currentColor" />
                <circle cx="100" cy="70" r="34" fill="none" stroke="currentColor" />
                <circle cx="100" cy="70" r="20" fill="none" stroke="var(--accent)" />
                <path d="M60 40H140M60 100H140" stroke="currentColor" />
                <text x="100" y="134" textAnchor="middle" fontSize="8" fill="currentColor">
                  {opened?.code} / FIKTIV
                </text>
              </svg>
            )}
          </figure>
          <div className="sheet-body">
            <ul className="sheet-lines">
              {sheetLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <ol className="sheet-steps">
              {sheetSteps.map((step, i) => (
                <li key={step} className={read[i] ? "is-read" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={read[i]}
                      onChange={(e) => {
                        playSound("click");
                        setRead((v) =>
                          v.map((x, j) => (j === i ? e.target.checked : x)),
                        );
                      }}
                    />
                    {step}
                  </label>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="sheet-relay">
        <span>{relayLabel}</span>
        <button
          className="scene-button"
          disabled={disabled || !allRead}
          onClick={relay}
        >
          RELAY VIA COMMS
        </button>
      </div>
    </>
  );
}

