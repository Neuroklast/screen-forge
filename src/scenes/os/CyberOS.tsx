import {
  useReducer,
  useState,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  TerminalSquare,
  Folder,
  Users,
  Network,
  Box,
  Layers,
  LayoutDashboard,
  LockKeyhole,
  ChevronRight,
  FileText,
  X,
  Search,
  ArrowUpRight,
  Shield,
  Activity,
  Power,
  Database,
} from "lucide-react";
import type { SceneProps } from "../Scenes";
import { formatTime } from "../../core/runtime";
import { GestureSurface } from "../../components/GestureSurface";
import { files as baseFiles, folders, people, type VirtualFile } from "./data";
import {
  sequences,
  sequenceDuration,
  sequenceState,
  type SequenceId,
} from "./sequences";
import { osReducer, initialOsState, type AppId } from "./state";
import { TraceMap, Hypercube, FingerprintGraphic } from "./Visuals";
import { SequencePanel } from "./SequencePanel";
import { LockScreen } from "./LockScreen";
import { Messages } from "./Messages";
import { BrandMark } from "../../components/BrandMark";
import { useActorPlayback, TerminalVisual } from "./ActorPlayback";
import { Changed } from "../shared/Process";
const apps: { id: AppId; name: string; icon: typeof Folder; code: string }[] = [
  { id: "overview", name: "Workspace", icon: LayoutDashboard, code: "00" },
  { id: "terminal", name: "Terminal", icon: TerminalSquare, code: "01" },
  { id: "files", name: "Filesystem", icon: Folder, code: "02" },
  { id: "personnel", name: "Personnel", icon: Users, code: "03" },
  { id: "clusters", name: "Data clusters", icon: Network, code: "04" },
  { id: "dimension", name: "4D projection", icon: Box, code: "05" },
  { id: "messages", name: "Messages", icon: FileText, code: "07" },
  { id: "sequences", name: "Sequences", icon: Layers, code: "06" },
];
const rootVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
  },
};
const childVariants = {
  hidden: { opacity: 0, y: 7 },
  visible: { opacity: 1, y: 0 },
};
export function CyberOS({
  config,
  time,
  cue,
  onCue,
  onPlay,
  onTimelineExtend,
}: SceneProps) {
  const [state, dispatch] = useReducer(osReducer, initialOsState);
  const files: VirtualFile[] = [
    ...baseFiles,
    ...state.history.map((id, i) => ({
      path: `/workspace/${id}-${i + 1}.report`,
      kind: "text" as const,
      size: "1.2 KB",
      classification: id === "operation" ? "REVIEW" : "VERIFIED",
      content: `${id.toUpperCase()} / COMPLETED PROCESS\n${sequences
        .find((s) => s.id === id)
        ?.phases.map((p) => p.name + " / COMPLETE")
        .join(
          "\n",
        )}\n\n${id === "operation" ? "Containment exception isolated. Operator review required." : "Result verified and committed to local workspace."}`,
    })),
  ];
  const [folder, setFolder] = useState("/archives"),
    [query, setQuery] = useState(""),
    [file, setFile] = useState<VirtualFile | null>(null),
    [person, setPerson] = useState(0),
    [cluster, setCluster] = useState(0),
    [command, setCommand] = useState(""),
    [terminalLines, setTerminalLines] = useState<string[]>([
      `${config.title} environment attached.`,
      "Type help for local commands. Every operation is a simulation.",
    ]),
    [commands, setCommands] = useState<string[]>([]),
    [historyIndex, setHistoryIndex] = useState(-1),
    [angle, setAngle] = useState(0.5),
    [tilt, setTilt] = useState(0.4),
    [rotate, setRotate] = useState(true),
    [frozenTime, setFrozenTime] = useState(0),
    [rotationOffset, setRotationOffset] = useState(0);
  const actor = useActorPlayback(time, onPlay, config.script,config.title);
  const consoleRef = useRef<HTMLDivElement>(null);
  const displayedLines = config.actorMode ? actor.lines : terminalLines;
  useEffect(() => {
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayedLines.length, state.app]);
  const reduced = useReducedMotion();
  const visualTime = reduced ? 0 : time;
  const open = (app: AppId) => {
    dispatch({ type: "open", app });
    setFile(null);
  };
  const play = () => onPlay?.();
  const run = (id: SequenceId) => {
    dispatch({ type: "run", id, time, multiplier: config.sequenceScale });
    onTimelineExtend?.(
      time +
        sequenceDuration(
          sequences.find((s) => s.id === id)!,
          config.sequenceScale,
        ),
    );
    onCue("active");
    play();
  };
  const active = state.sequence
    ? sequences.find((x) => x.id === state.sequence!.id)!
    : null;
  const elapsed = state.sequence
    ? Math.max(0, time - state.sequence.startedAt)
    : 0;
  const done =
    active && state.sequence
      ? sequenceState(active, elapsed, state.sequence.multiplier).done
      : false;
  const operationPhase =
    active && state.sequence
      ? sequenceState(active, elapsed, state.sequence.multiplier).index
      : -1;
  useEffect(() => {
    if (active?.id === "operation")
      onCue(operationPhase === active.phases.length - 1 ? "warning" : "active");
  }, [active?.id, operationPhase, onCue]);
  const closeSequence = () => {
    dispatch({ type: "closeSequence", completed: !!done });
    onCue(done ? "complete" : "idle");
  };
  const submit = () => {
    if (config.actorMode) {
      actor.submit(command);
      setCommand("");
      return;
    }
    const raw = command.trim();
    if (!raw) return;
    setCommands((p) => [...p.slice(-30), raw]);
    setHistoryIndex(-1);
    let response: string[] = [];
    const [op, ...args] = raw.split(/\s+/);
    const value = args.join(" ");
    switch (op.toLowerCase()) {
      case "help":
        response = [
          "LOCAL COMMANDS",
          "ls [path] · cd <path> · cat <file> · open <app>",
          "scan · decrypt · correlate · reconstruct · reboot · lock",
          "status · clear · inspect relay",
          "All commands operate on fictional local data.",
        ];
        break;
      case "clear":
        setTerminalLines([]);
        setCommand("");
        return;
      case "ls":
        response = files
          .filter((x) => x.path.startsWith(value || folder))
          .map((x) => `${x.kind.padEnd(8)} ${x.size.padEnd(8)} ${x.path}`);
        if (!response.length) response = ["No records in this local path."];
        break;
      case "cd":
        if (folders.includes(value)) {
          setFolder(value);
          response = [`Local directory: ${value}`];
        } else
          response = [
            "Unknown directory. Use /system /personnel /archives /datasets /workspace",
          ];
        break;
      case "cat": {
        const f = files.find(
          (x) => x.path === value || x.path === folder + "/" + value,
        );
        response = f ? f.content.split("\n") : ["Local record not found."];
        break;
      }
      case "open": {
        const target = apps.find(
          (x) => x.id === value || x.name.toLowerCase() === value.toLowerCase(),
        );
        if (target) {
          open(target.id);
          response = [`Opening ${target.name}.`];
        } else
          response = [
            "Apps: overview terminal files personnel clusters dimension sequences",
          ];
        break;
      }
      case "scan":
        run("intrusion");
        response = ["Relay intrusion sequence started."];
        break;
      case "decrypt":
        run("decrypt");
        response = ["Archive recovery sequence started."];
        break;
      case "correlate":
        run("cluster");
        response = ["Cluster correlation sequence started."];
        break;
      case "reconstruct":
        run("reconstruct");
        response = ["Dimensional reconstruction started."];
        break;
      case "reboot":
        run("boot");
        response = ["Cold start sequence initiated."];
        break;
      case "lock":
        dispatch({ type: "lock" });
        response = ["Workspace locked."];
        break;
      case "status":
        response = [
          `Scene time: ${formatTime(time)}`,
          `Session: ${cue}`,
          `Records: ${files.length}`,
          `Completed sequences: ${state.history.length}`,
        ];
        break;
      case "inspect":
        response = ["Relay inspection queued / reading channel signatures…"];
        run("intrusion");
        break;
      default:
        response = [`Unrecognized local command: ${op}. Type help.`];
    }
    setTerminalLines((p) =>
      [...p, ...[`operator@local:${folder}$ ${raw}`, ...response]].slice(-80),
    );
    setCommand("");
  };
  const app = apps.find((x) => x.id === state.app)!;
  const className = `cyber-os scene-inner ${cue === "warning" ? "os-warning" : ""}`;
  return (
    <div
      className={className}
      style={
        { "--os-glow": config.overlays.glow * config.effects } as CSSProperties
      }
    >
      <header className="os-topbar">
        <div className="os-wordmark">
          <span className="os-brand-chip">
            <BrandMark config={config} />
          </span>
          <div>
            <strong>{config.title}</strong>
            <small>{config.subtitle}</small>
          </div>
        </div>
        <div className="os-top-status">
          <span className="os-link-dot" />
          {cue === "warning" ? "SIGNAL DEGRADED" : "LOCAL SESSION VERIFIED"}
          <span className="os-top-divider" />
          {config.identifier}
        </div>
        <button
          className="os-lock-button"
          aria-label="Sitzung sperren"
          onClick={() => dispatch({ type: "lock" })}
        >
          <LockKeyhole size={15} />
        </button>
      </header>
      <div className="os-body">
        <nav className="os-sidebar">
          <span className="os-kicker">APPLICATIONS</span>
          {apps.map((a) => (
            <button
              key={a.id}
              onClick={() => open(a.id)}
              className={state.app === a.id ? "active" : ""}
            >
              <a.icon size={17} strokeWidth={1.4} />
              <span>{a.name}</span>
              <small>{a.code}</small>
            </button>
          ))}
          <div className="os-side-foot">
            <div className="os-operator-avatar">
              <FingerprintGraphic progress={0.65} />
            </div>
            <span className="os-kicker">OPERATOR / 07</span>
            <strong>GUEST.2048</strong>
            <div className="os-between">
              <span>ACCESS LEVEL</span>
              <b>04</b>
            </div>
            <div className="os-side-bars">
              {Array.from({ length: 20 }, (_, i) => (
                <i key={i} style={{ height: `${8 + ((i * 17) % 24)}px` }} />
              ))}
            </div>
            <span className="os-kicker">OFFLINE ENVIRONMENT</span>
          </div>
        </nav>
        <main className="os-workarea">
          <div className="os-window-bar">
            <span>
              {app.code} /{" "}
              {active ? active.name.toUpperCase() : app.name.toUpperCase()}
            </span>
            <span className="os-window-meta">
              {active
                ? "SEQUENCE IN PROGRESS"
                : config.title + "://WORKSPACE/" + state.app.toUpperCase()}
              <i />
              <i />
              <i />
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {active && state.sequence ? (
              <motion.div
                className="os-content"
                key={"sequence-" + active.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <SequencePanel
                  sequence={active}
                  elapsed={elapsed}
                  multiplier={state.sequence.multiplier}
                  seed={config.seed}
                  onClose={closeSequence}
                />
              </motion.div>
            ) : (
              <motion.div
                key={state.app}
                className="os-content"
                variants={rootVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                {state.app === "messages" && (
                  <Messages
                    onAction={(i) => {
                      if (i === 0) run("decrypt");
                      else if (i === 1) open("personnel");
                      else if (i === 3) run("reconstruct");
                      else open("files");
                    }}
                  />
                )}
                {state.app === "overview" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          OPERATOR ENVIRONMENT / BUILD 09.4
                        </span>
                        <h2>Beyond the perimeter.</h2>
                        <p>
                          Local intelligence workspace. Session continuity
                          established.
                        </p>
                      </div>
                      <span className="os-status-tag">
                        {cue === "warning"
                          ? "REVIEW REQUIRED"
                          : "SYSTEM NOMINAL"}
                      </span>
                    </div>
                    <div className="os-dashboard">
                      <motion.section
                        variants={childVariants}
                        className="os-panel os-dashboard-map"
                      >
                        <div className="os-panel-heading">
                          <span>RELAY FABRIC</span>
                          <span>06 / CONNECTED</span>
                        </div>
                        <TraceMap
                          time={visualTime}
                          seed={config.seed}
                          progress={0.88}
                        />
                        <button
                          className="os-button"
                          onClick={() => run("intrusion")}
                        >
                          Trace access corridor <ArrowUpRight size={13} />
                        </button>
                      </motion.section>
                      <div className="os-dashboard-right">
                        <motion.section
                          variants={childVariants}
                          className="os-panel"
                        >
                          <span className="os-kicker">
                            ACTIVE CASE / SECTOR 07
                          </span>
                          <h3>The missing interval.</h3>
                          <p>
                            Three personnel records. One unaccounted relay
                            event. Review the local archive to identify the
                            shared timestamp.
                          </p>
                          <div className="os-case-links">
                            <button onClick={() => open("personnel")}>
                              03 IDENTITIES
                              <ChevronRight size={13} />
                            </button>
                            <button onClick={() => open("files")}>
                              02 ARCHIVES
                              <ChevronRight size={13} />
                            </button>
                            <button onClick={() => open("clusters")}>
                              01 ANOMALY
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </motion.section>
                        <div className="os-dashboard-metrics">
                          {[
                            ["SESSION INTEGRITY", "99.84"],
                            ["RECORDS INDEXED", "2,048"],
                            [
                              "COMPLETED JOBS",
                              String(state.history.length).padStart(2, "0"),
                            ],
                          ].map(([label, value]) => (
                            <motion.div variants={childVariants} key={label}>
                              <span>{label}</span>
                              <strong>
                                <Changed value={value} />
                              </strong>
                              <i />
                            </motion.div>
                          ))}
                        </div>
                        <motion.section
                          variants={childVariants}
                          className="os-panel os-quick-launch"
                        >
                          <span className="os-kicker">SEQUENCE SHORTCUTS</span>
                          <div>
                            <button onClick={() => run("boot")}>
                              <Power size={17} />
                              Cold start
                            </button>
                            <button onClick={() => run("decrypt")}>
                              <Database size={17} />
                              Recover archive
                            </button>
                            <button onClick={() => run("reconstruct")}>
                              <Box size={17} />
                              Reconstruct
                            </button>
                          </div>
                        </motion.section>
                      </div>
                    </div>
                  </>
                )}
                {state.app === "terminal" && (
                  <div className="os-terminal-layout">
                    <section className="os-terminal-console">
                      <div className="os-section-head">
                        <div>
                          <span className="os-kicker">
                            TTY.07 / OPERATOR SHELL
                          </span>
                          <h2>Command surface.</h2>
                        </div>
                        <TerminalSquare size={24} />
                      </div>
                      <div
                        className="console-lines os-console-lines"
                        ref={consoleRef}
                        role="log"
                        aria-label="Terminalausgabe"
                      >
                        {displayedLines.map((line, i) => (
                          <motion.div
                            key={`${i}-${line}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={
                              line.startsWith("operator@")
                                ? "os-command-line"
                                : ""
                            }
                          >
                            {line || "\u00a0"}
                          </motion.div>
                        ))}
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submit();
                        }}
                      >
                        <span>~/</span>
                        <input
                          aria-label="Terminaleingabe"
                          autoComplete="off"
                          spellCheck={false}
                          value={command}
                          placeholder={
                            config.actorMode
                              ? actor.busy
                                ? "Receiving channel response…"
                                : "Type any keys to continue the operation"
                              : "help / ls / scan / decrypt"
                          }
                          onChange={(e) =>
                            setCommand(
                              config.actorMode
                                ? actor.target.slice(0, e.target.value.length)
                                : e.target.value,
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              config.actorMode &&
                              (e.key.length === 1 || e.key === "Backspace")
                            ) {
                              e.preventDefault();
                              if (!actor.busy) {
                                const next = actor.target.slice(
                                  0,
                                  command.length + 3,
                                );
                                if (next.length === actor.target.length) {
                                  actor.submit(next);
                                  setCommand("");
                                } else setCommand(next);
                              }
                              return;
                            }

                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              const next = Math.min(
                                commands.length - 1,
                                historyIndex + 1,
                              );
                              if (next >= 0) {
                                setHistoryIndex(next);
                                setCommand(
                                  commands[commands.length - 1 - next],
                                );
                              }
                            }
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              const next = Math.max(-1, historyIndex - 1);
                              setHistoryIndex(next);
                              setCommand(
                                next < 0
                                  ? ""
                                  : commands[commands.length - 1 - next],
                              );
                            }
                            if (e.key === "Tab") {
                              e.preventDefault();
                              const match = [
                                "help",
                                "ls",
                                "cd",
                                "cat",
                                "open",
                                "scan",
                                "decrypt",
                                "correlate",
                                "reconstruct",
                                "reboot",
                                "lock",
                                "status",
                                "clear",
                                "inspect",
                              ].find((x) => x.startsWith(command));
                              if (match) setCommand(match + " ");
                            }
                          }}
                        />
                        <button aria-label="Befehl ausführen">↵</button>
                      </form>
                      <div className="os-between">
                        <span>
                          {config.actorMode
                            ? `ACTOR SEQUENCE / STEP ${actor.index + 1} ${actor.busy ? "PROCESSING" : "READY"}`
                            : "LOCAL COMMAND PARSER"}
                        </span>
                        <span>TAB COMPLETE / ↑ HISTORY</span>
                      </div>
                    </section>
                    <aside className="os-terminal-side">
                      <TerminalVisual
                        time={visualTime}
                        index={actor.index}
                        progress={actor.progress}
                        mode={actor.stage.mode}
                        title={actor.stage.title}
                        seed={config.seed}
                      />
                      <div className="os-panel">
                        <span className="os-kicker">WORKING DIRECTORY</span>
                        <h3>{folder}</h3>
                        <p>
                          {
                            files.filter((f) => f.path.startsWith(folder))
                              .length
                          }{" "}
                          local records available
                        </p>
                        <button
                          className="os-button"
                          onClick={() => open("files")}
                        >
                          Browse files <ArrowUpRight size={12} />
                        </button>
                      </div>
                      <p className="os-discreet-note">
                        LOCAL SIMULATION / NO EXTERNAL EXECUTION
                      </p>
                    </aside>
                  </div>
                )}
                {state.app === "files" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          VIRTUAL FILESYSTEM / READ ONLY
                        </span>
                        <h2>Archive navigator.</h2>
                      </div>
                      <label className="os-search">
                        <Search size={13} />
                        <input
                          aria-label="Dateien suchen"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Filter local records"
                        />
                      </label>
                    </div>
                    <div className="os-file-layout">
                      <nav className="os-folder-tree">
                        {folders.map((f) => (
                          <button
                            className={folder === f ? "active" : ""}
                            key={f}
                            onClick={() => setFolder(f)}
                          >
                            <Folder size={15} />
                            {f.slice(1)}
                            <small>
                              {files.filter((x) => x.path.startsWith(f)).length}
                            </small>
                          </button>
                        ))}
                        <span className="os-kicker">VOLUME / LOCAL-01</span>
                        <div className="os-storage-bar">
                          <i />
                        </div>
                        <small>642 MB / 2.4 GB</small>
                      </nav>
                      <section>
                        <div className="os-breadcrumb">
                          LOCAL-01 <ChevronRight size={12} />
                          {query ? "SEARCH RESULTS" : folder}
                        </div>
                        <div className="os-file-table">
                          <div className="os-file-table-head">
                            <span>RECORD NAME</span>
                            <span>SIZE</span>
                            <span>CLASSIFICATION</span>
                          </div>
                          {files
                            .filter(
                              (f) =>
                                (query || f.path.startsWith(folder)) &&
                                f.path
                                  .toLowerCase()
                                  .includes(query.toLowerCase()),
                            )
                            .map((f) => (
                              <button key={f.path} onClick={() => setFile(f)}>
                                <span>
                                  <FileText size={15} />
                                  {f.path.split("/").pop()}
                                </span>
                                <span>{f.size}</span>
                                <b>{f.classification}</b>
                              </button>
                            ))}
                        </div>
                        <div className="os-file-info">
                          <Shield size={21} />
                          <div>
                            <strong>Local archive mirror</strong>
                            <p>
                              Completed operations create verified reports in
                              /workspace.
                            </p>
                          </div>
                        </div>
                      </section>
                    </div>
                  </>
                )}
                {state.app === "personnel" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          IDENTITY REGISTRY / RESTRICTED
                        </span>
                        <h2>Personnel records.</h2>
                      </div>
                      <span className="os-status-tag">
                        03 MATCHED IDENTITIES
                      </span>
                    </div>
                    <div className="os-personnel-layout">
                      <nav>
                        {people.map((p, i) => (
                          <button
                            key={p.id}
                            className={person === i ? "active" : ""}
                            onClick={() => setPerson(i)}
                          >
                            <span>{p.id}</span>
                            <strong>{p.name}</strong>
                            <small>{p.role}</small>
                          </button>
                        ))}
                      </nav>
                      <section className="os-personnel-record">
                        <div className="os-personnel-hero">
                          <div className="os-profile-portrait">
                            <svg viewBox="0 0 150 180" aria-hidden="true">
                              <g fill="none" stroke="currentColor">
                                <path d="M37 83C29 18 121 16 113 83L105 108L91 120V139L131 157L141 179H9L19 157L59 139V120L44 108Z" />
                                <path d="M38 72H112M44 88H63M87 88H106M76 85L70 104H81M59 114H91M59 139L76 155L91 139" />
                                <path d="M10 15H30M10 15V35M120 15H140V35M10 145V165H30M120 165H140V145" />
                              </g>
                              <path
                                d="M0 100H150"
                                stroke="var(--accent)"
                                opacity=".7"
                              />
                            </svg>
                            <span>IDENTITY MODEL / {people[person].id}</span>
                          </div>
                          <div>
                            <span className="os-kicker">
                              {people[person].role}
                            </span>
                            <h3>
                              <Changed value={people[person].name} />
                            </h3>
                            <p>
                              <Changed value={people[person].department} />
                            </p>
                            <div className="os-person-meta">
                              <div>
                                <span>CLEARANCE</span>
                                <b>
                                  <Changed value={people[person].clearance} />
                                </b>
                              </div>
                              <div>
                                <span>CONFIDENCE</span>
                                <b>
                                  <Changed
                                    value={people[person].signal + "%"}
                                  />
                                </b>
                              </div>
                              <div>
                                <span>STATUS</span>
                                <b>{people[person].status}</b>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="os-person-notes">
                          <span className="os-kicker">RECORD SUMMARY</span>
                          <p>{people[person].notes}</p>
                        </div>
                        <div className="os-person-events">
                          {people[person].events.map((e, i) => (
                            <div key={e}>
                              <span>0{i + 1} /</span>
                              {e}
                              <small>VERIFIED</small>
                            </div>
                          ))}
                        </div>
                        <div className="os-inline-actions">
                          <button
                            className="os-button"
                            onClick={() => run("biometric")}
                          >
                            Analyze identity <ChevronRight size={13} />
                          </button>
                          <button
                            className="os-button secondary"
                            onClick={() =>
                              setFile(
                                files.find(
                                  (f) => f.path === people[person].file,
                                )!,
                              )
                            }
                          >
                            Open record <ArrowUpRight size={13} />
                          </button>
                        </div>
                      </section>
                    </div>
                  </>
                )}
                {state.app === "clusters" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          RELATIONSHIP ENGINE / THREE COLLECTIONS
                        </span>
                        <h2>Find the common thread.</h2>
                      </div>
                      <button
                        className="os-button"
                        onClick={() => run("cluster")}
                      >
                        Run correlation <ChevronRight size={13} />
                      </button>
                    </div>
                    <div className="os-clusters-layout">
                      <div className="os-cluster-map">
                        <TraceMap
                          time={visualTime}
                          progress={0.9}
                          seed={config.seed + cluster * 11}
                        />
                        <div className="os-cluster-legend">
                          <span>● SELECTED COLLECTION</span>
                          <span>○ LINKED RECORD</span>
                          <span>─ INFERRED RELATIONSHIP</span>
                        </div>
                      </div>
                      <aside>
                        {[
                          "PERSONNEL / IDENTITY",
                          "RELAY / TRANSPORT",
                          "ARCHIVE / REFERENCE",
                        ].map((label, i) => (
                          <button
                            className={`os-cluster-card ${cluster === i ? "active" : ""}`}
                            key={label}
                            onClick={() => setCluster(i)}
                          >
                            <span>{label}</span>
                            <strong>
                              {[384, 1248, 416][i]}
                              <small>RECORDS</small>
                            </strong>
                            <div className="os-segment-progress">
                              {Array.from({ length: 20 }, (_, j) => (
                                <i
                                  className={j < (i + 1) * 5 ? "lit" : ""}
                                  key={j}
                                />
                              ))}
                            </div>
                            <p>
                              {
                                [
                                  "3 identities share a discontinuity.",
                                  "1 relay interval remains unaccounted.",
                                  "2 archive segments require recovery.",
                                ][i]
                              }
                            </p>
                          </button>
                        ))}
                      </aside>
                    </div>
                  </>
                )}
                {state.app === "dimension" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          FOUR-DIMENSIONAL DATA / XW + YZ PLANES
                        </span>
                        <h2>Beyond three axes.</h2>
                      </div>
                      <button
                        className="os-button"
                        onClick={() => run("reconstruct")}
                      >
                        Reconstruct manifold <ChevronRight size={13} />
                      </button>
                    </div>
                    <div className="os-dimension-layout">
                      <GestureSurface label="4D-Projektion verschieben und zoomen">
                        <Hypercube
                          time={
                            rotate
                              ? Math.max(0, visualTime - rotationOffset)
                              : frozenTime
                          }
                          angle={angle}
                          tilt={tilt}
                        />
                      </GestureSurface>
                      <aside>
                        <span className="os-kicker">PROJECTION PARAMETERS</span>
                        <label>
                          XW rotation{" "}
                          <output>
                            {((angle * 180) / Math.PI).toFixed(0)}°
                          </output>
                          <input
                            aria-label="XW Rotation"
                            type="range"
                            min="0"
                            max="6.28"
                            step=".01"
                            value={angle}
                            onChange={(e) => setAngle(+e.target.value)}
                          />
                        </label>
                        <label>
                          YZ rotation{" "}
                          <output>
                            {((tilt * 180) / Math.PI).toFixed(0)}°
                          </output>
                          <input
                            aria-label="YZ Rotation"
                            type="range"
                            min="0"
                            max="6.28"
                            step=".01"
                            value={tilt}
                            onChange={(e) => setTilt(+e.target.value)}
                          />
                        </label>
                        <button
                          className="os-button secondary"
                          onClick={() => {
                            if (rotate)
                              setFrozenTime(
                                Math.max(0, visualTime - rotationOffset),
                              );
                            else {
                              setRotationOffset(visualTime - frozenTime);
                              play();
                            }
                            setRotate((p) => !p);
                          }}
                        >
                          {rotate ? "Freeze rotation" : "Rotate specimen"}
                        </button>
                        <div className="os-dimension-stats">
                          <div>
                            <span>DIMENSIONS</span>
                            <strong>04</strong>
                          </div>
                          <div>
                            <span>VERTICES</span>
                            <strong>16</strong>
                          </div>
                          <div>
                            <span>EDGES</span>
                            <strong>32</strong>
                          </div>
                          <div>
                            <span>CELLS</span>
                            <strong>08</strong>
                          </div>
                        </div>
                        <p>
                          Two independent 4D rotations, projected into 3D and
                          then onto the display plane.
                        </p>
                      </aside>
                    </div>
                  </>
                )}
                {state.app === "sequences" && (
                  <>
                    <div className="os-section-head">
                      <div>
                        <span className="os-kicker">
                          PLAYBACK LIBRARY / SIX CHOREOGRAPHIES + ONE OPERATION
                        </span>
                        <h2>Every process tells a story.</h2>
                        <p>
                          Distinct phases. Reproducible timing.
                          Operator-controlled playback.
                        </p>
                      </div>
                      <button
                        className="os-button"
                        onClick={() => run("operation")}
                      >
                        Run full operation <ChevronRight size={13} />
                      </button>
                    </div>
                    <div className="os-sequence-library">
                      {sequences
                        .filter((s) => s.id !== "operation")
                        .map((s, i) => (
                          <motion.button
                            variants={childVariants}
                            key={s.id}
                            onClick={() => run(s.id)}
                          >
                            <span className="os-sequence-card-code">
                              {s.code}
                              <small>
                                {formatTime(
                                  sequenceDuration(s, config.sequenceScale),
                                )}
                              </small>
                            </span>
                            <div className="os-sequence-card-art">
                              {i % 3 === 0 ? (
                                <Activity size={45} strokeWidth={0.8} />
                              ) : i % 3 === 1 ? (
                                <Network size={45} strokeWidth={0.8} />
                              ) : (
                                <Layers size={45} strokeWidth={0.8} />
                              )}
                              <div>
                                {s.phases.map((p, j) => (
                                  <i
                                    key={p.name}
                                    style={{ width: `${12 + j * 9}px` }}
                                  />
                                ))}
                              </div>
                            </div>
                            <h3>{s.name}</h3>
                            <p>{s.subtitle}</p>
                            <div className="os-between">
                              <span>{s.phases.length} DISTINCT PHASES</span>
                              <ArrowUpRight size={17} />
                            </div>
                          </motion.button>
                        ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <footer className="os-taskbar">
        <span className="os-taskbar-logo">
          BL<span>://</span>
        </span>
        <div className="os-task-buttons">
          {["terminal", "files", "personnel", "sequences"].map((id) => {
            const a = apps.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                className={state.app === id ? "active" : ""}
                onClick={() => open(a.id)}
              >
                <a.icon size={13} />
                {a.name}
              </button>
            );
          })}
        </div>
        <span className="os-task-time">
          {formatTime(time)} <small>LOCAL SESSION</small>
        </span>
        <span className="os-task-indicator">
          {cue === "warning" ? "EXCEPTION" : "READY"}
        </span>
      </footer>
      <AnimatePresence>
        {file && (
          <motion.div
            className="os-modal-shade"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="os-record-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Dateivorschau"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setFile(null);
                }
                if (e.key === "Tab") {
                  const buttons = Array.from(
                    e.currentTarget.querySelectorAll<HTMLButtonElement>(
                      "button",
                    ),
                  );
                  const first = buttons[0],
                    last = buttons[buttons.length - 1];
                  if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }
              }}
              initial={{ clipPath: "inset(45% 0)", y: 12 }}
              animate={{ clipPath: "inset(0% 0)", y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="os-window-bar">
                <span>{file.path}</span>
                <button
                  autoFocus
                  aria-label="Dateivorschau schließen"
                  onClick={() => setFile(null)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="os-record-content">
                <span className="os-kicker">
                  {file.classification} / {file.size}
                </span>
                <pre>{file.content}</pre>
                <div className="os-inline-actions">
                  <button className="os-button" onClick={() => setFile(null)}>
                    Close record
                  </button>
                  {file.kind === "archive" && (
                    <button
                      className="os-button secondary"
                      onClick={() => {
                        setFile(null);
                        run("decrypt");
                      }}
                    >
                      Recover archive
                    </button>
                  )}
                  {file.kind === "model" && (
                    <button
                      className="os-button secondary"
                      onClick={() => {
                        setFile(null);
                        open("dimension");
                      }}
                    >
                      Inspect projection
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {state.locked && (
          <LockScreen
            time={time}
            title={config.title}
            onPlay={play}
            onUnlock={() => {
              dispatch({ type: "unlock" });
              run("boot");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
