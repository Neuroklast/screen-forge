import { useCallback, useEffect, useMemo, useState } from "react";
import { StageFrame } from "../views/StageFrame";
import { MissionBuilder } from "../builder/MissionBuilder";
import { seedDemoState, type DemoState } from "../core/demoContent";
import { showOrder } from "../core/director";
import type { Scenario } from "../core/training";
import { t } from "../i18n";
import { Tour, type TourStop } from "./Tour";
import tour from "./tour.json";
import "./demo.css";

const STOPS = tour as TourStop[];
const PRESENTER_PIN = "2048";
const IDLE_MS = 90_000;

// Offline showcase shell (concept 10-demo). It never mounts the exercise
// provider, so no /exercise WebSocket is opened; all content is bundled.
export function DemoHub({ kiosk }: { kiosk: boolean }) {
  const seed = useMemo(() => seedDemoState(), []);
  const [state, setState] = useState<DemoState>(() => structuredClone(seed));
  const [stop, setStop] = useState(0);
  const [active, setActive] = useState(true);
  const [locked] = useState(kiosk);
  const [showStep, setShowStep] = useState(0);
  const [pin, setPin] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const view = STOPS[stop]?.view ?? "film";

  const reset = useCallback(() => {
    setState(structuredClone(seed));
    setShowStep(0);
    setNotice(t("demo.resetDone"));
  }, [seed]);

  const change = (mission: Scenario) =>
    setState((current) => ({ ...current, mission }));
  const log = (message: string) =>
    setState((current) => ({
      ...current,
      log: [...current.log, { at: current.log.length, message }],
    }));

  // Kiosk: restart the tour after 90 s without interaction.
  useEffect(() => {
    if (!locked) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setState(structuredClone(seed));
        setShowStep(0);
        setStop(0);
        setActive(true);
      }, IDLE_MS);
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel"];
    events.forEach((event) => window.addEventListener(event, arm));
    arm();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, arm));
    };
  }, [locked, seed]);

  const exitKiosk = () => {
    if (pin === PRESENTER_PIN) {
      location.assign("/");
    } else {
      setNotice(t("demo.pinWrong"));
    }
  };

  return (
    <main className={`demo-app ${locked ? "is-kiosk" : ""}`}>
      <header className="demo-bar">
        <span className="demo-watermark" role="note">
          {t("demo.watermark")}
        </span>
        {locked && <span className="demo-kiosk">{t("demo.kiosk")}</span>}
        <nav className="demo-controls">
          <button type="button" onClick={() => setActive((v) => !v)}>
            {active ? t("demo.stop") : t("demo.start")}
          </button>
          <button type="button" onClick={reset}>
            {t("demo.reset")}
          </button>
          <button
            type="button"
            onClick={() => (locked ? setPinOpen(true) : location.assign("/"))}
          >
            {t("demo.exit")}
          </button>
        </nav>
      </header>

      <section className="demo-stage" data-view={view}>
        {view === "build" || view === "sandbox" ? (
          <MissionBuilder draft={state.mission} change={change} readOnly={false} />
        ) : view === "field" ? (
          <StageFrame scene="countdown" />
        ) : view === "hq" ? (
          <StageFrame scene="tracking" />
        ) : view === "injects" ? (
          <DemoInjects state={state} onFire={log} />
        ) : view === "debrief" ? (
          <DemoDebrief state={state} />
        ) : (
          <DemoFilm
            state={state}
            step={showStep}
            onStep={(next) =>
              setShowStep(
                Math.max(0, Math.min(showOrder(state.show).length - 1, next)),
              )
            }
          />
        )}
      </section>

      {active && (
        <Tour
          stops={STOPS}
          index={stop}
          onNext={() => setStop((i) => Math.min(STOPS.length - 1, i + 1))}
          onBack={() => setStop((i) => Math.max(0, i - 1))}
          onJump={setStop}
          onEnd={() => setActive(false)}
        />
      )}

      {notice && (
        <p className="demo-notice" role="status">
          {notice}
          <button type="button" aria-label="Close" onClick={() => setNotice("")}>
            ×
          </button>
        </p>
      )}

      {pinOpen && (
        <div className="demo-pin" role="dialog" aria-label={t("demo.exit")}>
          <label>
            {t("demo.pinPrompt")}
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") exitKiosk();
              }}
            />
          </label>
          <div className="demo-tour-actions">
            <button type="button" className="primary" onClick={exitKiosk}>
              {t("demo.confirm")}
            </button>
            <button type="button" onClick={() => setPinOpen(false)}>
              {t("demo.cancel")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function DemoFilm({
  state,
  step,
  onStep,
}: {
  state: DemoState;
  step: number;
  onStep: (step: number) => void;
}) {
  const takes = showOrder(state.show);
  const current = takes[step];
  if (!current)
    return <p className="demo-empty">{t("demo.notAvailable")}</p>;
  return (
    <div className="demo-film">
      <StageFrame scene={current.config.scene} />
      <div className="demo-film-bar">
        <button type="button" disabled={step === 0} onClick={() => onStep(step - 1)}>
          {t("demo.back")}
        </button>
        <span>
          {step + 1} / {takes.length} · {current.name}
        </span>
        <button
          type="button"
          disabled={step >= takes.length - 1}
          onClick={() => onStep(step + 1)}
        >
          {t("demo.filmCue")}
        </button>
      </div>
    </div>
  );
}

function DemoInjects({
  state,
  onFire,
}: {
  state: DemoState;
  onFire: (message: string) => void;
}) {
  return (
    <div className="demo-panel">
      <h2>{t("demo.tour")}</h2>
      <ul className="demo-inject-list">
        {state.mission.injects.map((inject) => (
          <li key={inject.id}>
            <span>{inject.name}</span>
            <small>{inject.trigger}</small>
            <button
              type="button"
              onClick={() => onFire(inject.name)}
            >
              {t("demo.fire")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoDebrief({ state }: { state: DemoState }) {
  return (
    <div className="demo-panel">
      <h2>{t("demo.tour")}</h2>
      {state.log.length ? (
        <ol className="demo-log">
          {state.log.map((entry, i) => (
            <li key={i}>
              <time>T+{entry.at}</time>
              {entry.message}
            </li>
          ))}
        </ol>
      ) : (
        <p className="demo-empty">{t("demo.notAvailable")}</p>
      )}
    </div>
  );
}
