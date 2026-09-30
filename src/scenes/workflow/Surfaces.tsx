import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Config } from "../../core/config";
import { taskBlock } from "../../core/taskBlocks";
import type { WorkflowInstance } from "../../core/workflow";
import "./surfaces.css";

// Field surfaces driven by workflow state. English element content; the
// EXERCISE mark comes from the field frame. Secrets never reach these props.
export type WorkflowSurfaceProps = {
  config: Config;
  stationName: string;
  boundProp: string;
  instance: WorkflowInstance;
  disabled: boolean;
  onInput: (value: string) => void;
  onProp: (state: string) => void;
};

export function workflowSurfaceId(instance: WorkflowInstance): string {
  if (instance.activeTask) {
    const surface = taskBlock(instance.activeTask.task)?.surface;
    if (surface) return surface;
  }
  return instance.surface?.surface ?? "console";
}

export function WorkflowSurface(props: WorkflowSurfaceProps) {
  switch (workflowSurfaceId(props.instance)) {
    case "link":
      return <LinkSurface {...props} />;
    case "code-challenge":
      return <CodeChallengeSurface {...props} />;
    case "confirm":
      return <ConfirmSurface {...props} />;
    case "choice":
      return <ChoiceSurface {...props} />;
    case "report":
      return <ReportSurface {...props} />;
    case "inspect":
      return <InspectSurface {...props} />;
    case "transfer":
      return <TransferSurface {...props} />;
    case "wait":
      return <WaitSurface {...props} />;
    case "connect":
      return <ConnectSurface {...props} />;
    case "diagnostics":
      return <DiagnosticsSurface {...props} />;
    case "lockout":
      return <LockoutSurface {...props} />;
    default:
      return <DeviceConsoleSurface {...props} />;
  }
}

function Shell({
  config,
  status,
  children,
}: {
  config: Config;
  status: string;
  children: ReactNode;
}) {
  return (
    <section className="wf-surface">
      <header className="wf-head">
        <div>
          <strong>{config.title}</strong>
          <small>{config.subtitle}</small>
        </div>
        <span className="wf-badge">{status}</span>
      </header>
      <div className="wf-body">{children}</div>
      <footer className="wf-foot">{config.identifier}</footer>
    </section>
  );
}

function LinkSurface({ config, stationName }: WorkflowSurfaceProps) {
  const steps = [
    ["LINK DETECTED", true],
    ["DEVICE ENUMERATION", true],
    ["AUTHENTICATION REQUIRED", false],
    ["SESSION ESTABLISHED", false],
  ] as const;
  return (
    <Shell config={config} status="LINK">
      <div className="wf-grid">
        <div className="wf-cell">
          <small>PORT</small>
          <b>A / DATA LINK</b>
        </div>
        <div className="wf-cell">
          <small>DEVICE</small>
          <b>PRESENT</b>
        </div>
        <div className="wf-cell">
          <small>LINK SPEED</small>
          <b>480 MBIT</b>
        </div>
        <div className="wf-cell">
          <small>SESSION</small>
          <b>PENDING</b>
        </div>
      </div>
      <ol className="wf-steps">
        {steps.map(([label, done]) => (
          <li key={label} className={done ? "on" : ""}>
            {label}
          </li>
        ))}
      </ol>
      <p className="wf-note">{stationName} · simulated connection</p>
    </Shell>
  );
}

function CodeChallengeSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const task = instance.activeTask;
  const data = (task?.config ?? {}) as {
    inputLength?: number;
    maskInput?: boolean;
  };
  const length = Math.min(Math.max(Number(data.inputLength) || 4, 1), 12);
  const masked = data.maskInput !== false;
  const [value, setValue] = useState("");
  const rejected =
    task !== undefined &&
    instance.lastResult?.node === task.node &&
    instance.lastResult.output === "failure";
  const append = (digit: string) => {
    if (value.length < length) setValue(value + digit);
  };
  const submit = () => {
    if (value.length === length && !disabled) {
      onInput(value);
      setValue("");
    }
  };
  return (
    <Shell config={config} status="AUTH">
      <p className="wf-prompt">
        Enter access code
        <small>
          {length} digits · {masked ? "masked" : "visible"}
        </small>
      </p>
      <div className="wf-slots" aria-label="Entered code">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={i < value.length ? "on" : ""}>
            {i < value.length ? (masked ? "•" : value[i]) : "–"}
          </span>
        ))}
      </div>
      <div className="wf-keypad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            disabled={disabled}
            onClick={() => append(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          disabled={disabled || !value}
          onClick={() => setValue(value.slice(0, -1))}
          aria-label="Delete digit"
        >
          ⌫
        </button>
        <button disabled={disabled} onClick={() => append("0")}>
          0
        </button>
        <button
          className="wf-submit"
          disabled={disabled || value.length !== length}
          onClick={submit}
        >
          OK
        </button>
      </div>
      <p
        className={`wf-feedback ${rejected && !value ? "is-error" : ""}`}
        role="status"
      >
        {rejected && !value ? "INPUT REJECTED — TRY AGAIN" : "AWAITING INPUT"}
      </p>
    </Shell>
  );
}

function ConfirmSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const prompt =
    (instance.activeTask?.config as { prompt?: string } | undefined)?.prompt ||
    "Confirm to continue";
  return (
    <Shell config={config} status="TASK">
      <p className="wf-prompt">{prompt}</p>
      <button
        className="wf-submit wf-wide"
        disabled={disabled}
        onClick={() => onInput("confirm")}
      >
        CONFIRM
      </button>
      <p className="wf-feedback" role="status">
        AWAITING CONFIRMATION
      </p>
    </Shell>
  );
}

function ChoiceSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prompt?: string;
    options?: { id: string; label: string }[];
  };
  const options = data.options ?? [];
  return (
    <Shell config={config} status="CHOICE">
      <p className="wf-prompt">{data.prompt || "Choose an option"}</p>
      <div className="wf-choices">
        {options.map((option) => (
          <button
            key={option.id}
            disabled={disabled}
            onClick={() => onInput(option.id)}
          >
            {option.label || option.id}
          </button>
        ))}
      </div>
      <p className="wf-feedback" role="status">
        AWAITING CHOICE
      </p>
    </Shell>
  );
}

function ReportSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prompt?: string;
    fields?: { id: string; label: string }[];
  };
  const fields = data.fields ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const complete = fields.every(
    (field) => (values[field.id] ?? "").trim().length > 0,
  );
  return (
    <Shell config={config} status="REPORT">
      <p className="wf-prompt">{data.prompt || "Report your result"}</p>
      {fields.map((field) => (
        <label key={field.id} className="wf-field">
          <small>{field.label || field.id}</small>
          <input
            value={values[field.id] ?? ""}
            disabled={disabled}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [field.id]: event.target.value,
              }))
            }
          />
        </label>
      ))}
      <button
        className="wf-submit wf-wide"
        disabled={disabled || !complete}
        onClick={() => onInput(JSON.stringify(values))}
      >
        SUBMIT REPORT
      </button>
      <p className="wf-feedback" role="status">
        AWAITING REPORT
      </p>
    </Shell>
  );
}

function InspectSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prompt?: string;
    lines?: string[];
  };
  return (
    <Shell config={config} status="INSPECT">
      <p className="wf-prompt">{data.prompt || "Inspect the reading"}</p>
      <ul className="wf-lines">
        {(data.lines ?? []).map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
      <button
        className="wf-submit wf-wide"
        disabled={disabled}
        onClick={() => onInput("ack")}
      >
        ACKNOWLEDGE
      </button>
      <p className="wf-feedback" role="status">
        AWAITING ACKNOWLEDGEMENT
      </p>
    </Shell>
  );
}

function TransferSurface({
  config,
  instance,
  disabled,
  onInput,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prompt?: string;
    seconds?: number;
  };
  const seconds = Math.min(Math.max(Number(data.seconds) || 5, 1), 60);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const inputRef = useRef(onInput);
  inputRef.current = onInput;
  useEffect(() => {
    if (!running || disabled) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const value = Math.min((Date.now() - started) / (seconds * 1000), 1);
      setProgress(value);
      if (value >= 1) {
        clearInterval(timer);
        setRunning(false);
        inputRef.current("done");
      }
    }, 100);
    return () => clearInterval(timer);
  }, [running, disabled, seconds]);
  return (
    <Shell config={config} status="TRANSFER">
      <p className="wf-prompt">{data.prompt || "Start the data transfer"}</p>
      <div className="wf-progress" aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <button
        className="wf-submit wf-wide"
        disabled={disabled || running}
        onClick={() => {
          setProgress(0);
          setRunning(true);
        }}
      >
        {running ? "TRANSFERRING" : "START TRANSFER"}
      </button>
      <p className="wf-feedback" role="status">
        {running ? "TRANSFER RUNNING" : "READY"}
      </p>
    </Shell>
  );
}

function WaitSurface({
  config,
  instance,
  stationName,
  boundProp,
  disabled,
  onProp,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prop?: string;
    to?: string;
  };
  const target = data.to ?? "";
  const canConnect = !!data.prop && data.prop === boundProp && !!target;
  return (
    <Shell config={config} status="WAIT">
      <p className="wf-prompt">
        Waiting for device event
        <small>
          {data.prop || "?"} → {target || "?"}
        </small>
      </p>
      {canConnect && (
        <button
          className="wf-submit wf-wide"
          disabled={disabled}
          onClick={() => onProp(target)}
        >
          CONNECT DEVICE
        </button>
      )}
      <p className="wf-feedback" role="status">
        LINK ESTABLISHED · AWAITING STATE CHANGE
      </p>
      <p className="wf-note">{stationName} · simulated device</p>
    </Shell>
  );
}

function ConnectSurface({
  config,
  instance,
  stationName,
  boundProp,
  disabled,
  onProp,
}: WorkflowSurfaceProps) {
  const data = (instance.activeTask?.config ?? {}) as {
    prompt?: string;
    prop?: string;
    to?: string;
  };
  const target = data.to ?? "";
  const canConnect = !!data.prop && data.prop === boundProp && !!target;
  return (
    <Shell config={config} status="LINK">
      <p className="wf-prompt">{data.prompt || "Connect the device"}</p>
      <div className="wf-grid">
        <div className="wf-cell">
          <small>DEVICE</small>
          <b>{data.prop || "?"}</b>
        </div>
        <div className="wf-cell">
          <small>TARGET STATE</small>
          <b>{target || "?"}</b>
        </div>
      </div>
      {canConnect ? (
        <button
          className="wf-submit wf-wide"
          disabled={disabled}
          onClick={() => onProp(target)}
        >
          CONNECT
        </button>
      ) : (
        <p className="wf-feedback" role="status">
          WAITING FOR OPERATOR
        </p>
      )}
      <p className="wf-note">{stationName} · simulated connection</p>
    </Shell>
  );
}

function DiagnosticsSurface({ config }: WorkflowSurfaceProps) {
  const subsystems = [
    ["CONTROL", "OK"],
    ["SENSOR", "OK"],
    ["STORAGE", "OK"],
    ["RELAY", "STANDBY"],
  ] as const;
  return (
    <Shell config={config} status="DIAG">
      <div className="wf-grid">
        <div className="wf-cell">
          <small>STATUS</small>
          <b>NOMINAL</b>
        </div>
        <div className="wf-cell">
          <small>SELF TEST</small>
          <b>PASS</b>
        </div>
        <div className="wf-cell">
          <small>FAULT CODES</small>
          <b>NONE</b>
        </div>
        <div className="wf-cell">
          <small>POWER</small>
          <b>87%</b>
        </div>
      </div>
      <ul className="wf-list">
        {subsystems.map(([name, state]) => (
          <li key={name}>
            <span>{name}</span>
            <b>{state}</b>
          </li>
        ))}
      </ul>
      <p className="wf-note">Read-only diagnostic report · simulated</p>
    </Shell>
  );
}

function LockoutSurface({ config }: WorkflowSurfaceProps) {
  return (
    <Shell config={config} status="LOCK">
      <p className="wf-lockout">ACCESS LOCKED</p>
      <ul className="wf-list">
        <li>
          <span>REASON</span>
          <b>ATTEMPTS EXCEEDED</b>
        </li>
        <li>
          <span>SESSION</span>
          <b>CLOSED</b>
        </li>
        <li>
          <span>ACTION</span>
          <b>CONTACT CONTROL</b>
        </li>
      </ul>
    </Shell>
  );
}

function DeviceConsoleSurface({ config, stationName }: WorkflowSurfaceProps) {
  const rows = [
    ["STATUS", "READY"],
    ["CHANNELS", "A · B"],
    ["SUBSYSTEMS", "4"],
    ["DIAGNOSTICS", "AVAILABLE"],
    ["ACCESS LEVEL", "OPERATOR"],
    ["LINK STATE", "STABLE"],
  ] as const;
  return (
    <Shell config={config} status="DEVICE">
      <ul className="wf-list">
        {rows.map(([name, value]) => (
          <li key={name}>
            <span>{name}</span>
            <b>{value}</b>
          </li>
        ))}
      </ul>
      <p className="wf-note">{stationName} · simulated device</p>
    </Shell>
  );
}
