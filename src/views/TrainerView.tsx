import { useEffect, useState } from "react";
import { useTraining } from "../core/useExercise";
import {
  blankScenario,
  scenarioSchema,
  dueAt,
  type Scenario,
} from "../core/training";
import { scenarioCapabilities } from "../core/capabilities";
import {
  PREP_SECTIONS,
  nextIncomplete,
  prepareReadiness,
  type PrepSection,
} from "../core/readiness";
import { stationUrl } from "../core/session";
import { GuidedBuilder } from "../training/guided/GuidedBuilder";
import { TemplateGallery } from "../training/TemplateGallery";
import { MelTimeline } from "../training/MelTimeline";
import { PatientControl } from "../training/PatientControl";
import { OverviewSection } from "../training/prepare/OverviewSection";
import { ScenarioSection } from "../training/prepare/ScenarioSection";
import { ParticipantsSection } from "../training/prepare/ParticipantsSection";
import { DevicesSection } from "../training/prepare/DevicesSection";
import { FlowSection } from "../training/prepare/FlowSection";
import { ReviewSection } from "../training/prepare/ReviewSection";
import { t } from "../i18n";
import { sectionTermId } from "../core/terminology";
import { Term } from "../ui/terminology/Term";
import { TerminologySettings } from "../ui/terminology/TerminologySettings";
import { useTerminology } from "../ui/terminology/useTerminology";
import { Button, Tabs } from "../ui/primitives";
import "../training/roles.css";
import "../training/prepare/prepare.css";
import "../ui/terminology/terminology.css";

// The preparation navigation is fixed: Overview, Scenario, Participants,
// Devices, Flow, Review. No domain entity, implementation concept or output
// format gets its own top-level item. Section ids stay stable; only the visible
// label is resolved through the terminology layer (sectionTermId).

// Explicit preparation navigation state. Guided setup is a state inside the
// section, not an isolated boolean modal, so Close/Back/Reload are deterministic
// and the user can never be trapped.
type PrepSectionView = PrepSection | "live";
type PreparationFocus = { nodeId?: string; entityId?: string; field?: string };
type PreparationLocation = {
  section: PrepSectionView;
  guidedStep?: number;
  returnTo?: PrepSectionView;
  focus?: PreparationFocus;
};

function isSection(value: string | null): value is PrepSection {
  return !!value && (PREP_SECTIONS as string[]).includes(value);
}

function readPreparationLocation(): PreparationLocation {
  const query = new URLSearchParams(location.search);
  const section = isSection(query.get("section"))
    ? (query.get("section") as PrepSection)
    : "overview";
  const raw = query.get("guided");
  const guidedStep =
    raw === null ? undefined : Math.max(0, Math.min(4, Number(raw) || 0));
  return { section, guidedStep };
}

export function TrainerView({ room }: { room: string }) {
  const ex = useTraining(),
    [loc, setLoc] = useState<PreparationLocation>(readPreparationLocation),
    [draft, setDraft] = useState<Scenario>(() =>
      structuredClone(ex.state.scenario),
    ),
    [dirty, setDirty] = useState(false),
    [revision, setRevision] = useState(ex.state.revision),
    [message, setMessage] = useState(""),
    [publicOrigin, setPublicOrigin] = useState(location.origin),
    [gallery, setGallery] = useState(false),
    [msgTo, setMsgTo] = useState("all"),
    [msgText, setMsgText] = useState("");
  const { term, density } = useTerminology();
  const tab = loc.section;
  const wizard = loc.guidedStep !== undefined;
  const navigate = (next: PreparationLocation, replace = false) => {
    setLoc(next);
    const query = new URLSearchParams(location.search);
    query.set("section", next.section);
    if (next.guidedStep !== undefined) query.set("guided", String(next.guidedStep));
    else query.delete("guided");
    history[replace ? "replaceState" : "pushState"](
      null,
      "",
      `${location.pathname}?${query.toString()}`,
    );
  };
  const setTab = (section: string) =>
    navigate({ ...loc, section: section as PrepSectionView });
  useEffect(() => {
    const onPop = () => setLoc(readPreparationLocation());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (!dirty) {
      setDraft(structuredClone(ex.state.scenario));
      setRevision(ex.state.revision);
    }
  }, [ex.state.revision, dirty]);
  const [past, setPast] = useState<Scenario[]>([]);
  const [future, setFuture] = useState<Scenario[]>([]);
  const change = (s: Scenario) => {
    setPast((stack) => [...stack.slice(-49), draft]);
    setFuture([]);
    setDraft(s);
    setDirty(true);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((stack) => [draft, ...stack]);
    setDraft(past[past.length - 1]);
    setPast((stack) => stack.slice(0, -1));
    setDirty(true);
  };
  const redo = () => {
    if (!future.length) return;
    setPast((stack) => [...stack, draft]);
    setDraft(future[0]);
    setFuture((stack) => stack.slice(1));
    setDirty(true);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const target = event.target as HTMLElement;
      if (target.closest("input,textarea,select")) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const save = (s = draft) => {
    const result = scenarioSchema.safeParse(s);
    if (!result.success) {
      setMessage(result.error.issues.map((i) => i.message).join(" · "));
      return false;
    }
    if (ex.send({ type: "configure", scenario: result.data, revision })) {
      setMessage(t("trainer.sent"));
      return true;
    }
    return false;
  };
  const importScenario = async (file: File) => {
    try {
      if (file.size > 10000000) throw new Error(t("trainer.fileTooBig"));
      change(scenarioSchema.parse(JSON.parse(await file.text())));
      setTab("scenario");
    } catch (e) {
      setMessage(
        t("trainer.importFailed", { message: (e as Error).message }),
      );
    }
  };
  useEffect(() => {
    if (ex.savedRevision >= 0) {
      setDirty(false);
      setMessage(t("trainer.saved"));
    }
  }, [ex.savedRevision]);
  // Progressive disclosure: while the exercise runs, only live controls are
  // relevant; preparation surfaces disappear and the surface switches to live.
  const live = ex.state.phase === "running";
  useEffect(() => {
    if (live && loc.section !== "live") setLoc({ section: "live" });
    if (!live && loc.section === "live") setLoc({ section: "overview" });
  }, [live, loc.section]);
  const connected = Object.values(ex.state.presence).filter(
    (p) => p.online,
  ).length;
  const nextInject = ex.state.scenario.injects
    .filter((r) => r.enabled && !ex.state.fired.includes(r.id))
    .map((r) => ({ inject: r, at: dueAt(r, ex.state.scenario.seed) }))
    .sort((a, b) => a.at - b.at)[0];
  const caps = scenarioCapabilities(draft);
  let invitationUrl = "";
  try {
    const origin = new URL(publicOrigin);
    if (!["http:", "https:"].includes(origin.protocol)) throw new Error();
    if (ex.invitation)
      invitationUrl =
        stationUrl(
          origin.origin,
          room,
          ex.invitation.role,
          ex.invitation.station,
        ) + `#invite=${ex.invitation.token}`;
  } catch {
    /* validation below */
  }
  const section = (id: string) => {
    switch (id) {
      case "overview":
        return (
          <OverviewSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
            connected={connected}
            onGuided={() => {
              if (ex.state.frozen) {
                // "New scenario" starts from an empty draft; the guided
                // interview then selects the domain and builds the content.
                change(blankScenario("custom"));
                navigate({ ...loc, guidedStep: 0, returnTo: loc.section });
              } else setMessage(t("trainer.pauseFirst"));
            }}
            onGallery={() => setGallery(true)}
            onImport={(file) => void importScenario(file)}
            onGo={setTab}
          />
        );
      case "scenario":
        return (
          <ScenarioSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
          />
        );
      case "participants":
        return (
          <ParticipantsSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
          />
        );
      case "devices":
        return (
          <DevicesSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
            presence={ex.state.presence}
            online={ex.online}
            invitation={ex.invitation}
            onProvision={(station) => ex.send({ type: "provision", station })}
            onRevoke={(station) => ex.send({ type: "revoke", station })}
            publicOrigin={publicOrigin}
            setPublicOrigin={setPublicOrigin}
            invitationUrl={invitationUrl}
            onNotice={setMessage}
          />
        );
      case "flow":
        return (
          <FlowSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
          />
        );
      case "review":
        return (
          <ReviewSection
            draft={draft}
            change={change}
            readOnly={!ex.state.frozen}
            caps={caps}
            online={ex.online}
            frozen={ex.state.frozen}
            dirty={dirty}
            onStart={() => {
              ex.send({ type: "transport", command: "play" });
              setTab("live");
            }}
            onGo={setTab}
            onNotice={setMessage}
          />
        );
      default:
        return null;
    }
  };
  return (
    <main className="training-app">
      {ex.state.phase === "aborted" && (
        <div className="abort-banner" role="alert">
          {t("common.aborted")}
        </div>
      )}
      <header className="training-header">
        <a href="/">SCREENFORGE</a>
        <div>
          <span className="eyebrow">
            <Term id="exercise_control" /> · {room}
          </span>
          <h1>{ex.state.scenario.name}</h1>
        </div>
        <span className={ex.online ? "status-up" : "status-down"}>
          <Term id={ex.online ? "connected" : "disconnected"} />
        </span>
        <div className="training-clock">
          {Math.floor(ex.state.clock / 60)
            .toString()
            .padStart(2, "0")}
          :
          {Math.floor(ex.state.clock % 60)
            .toString()
            .padStart(2, "0")}
          <small>
            <Term id={ex.state.frozen ? "paused" : "running"} />
          </small>
        </div>
        <Button
          disabled={!past.length}
          aria-label={t("common.undo")}
          title={t("common.undo")}
          onClick={undo}
        >
          ↶
        </Button>
        <Button
          disabled={!future.length}
          aria-label={t("common.redo")}
          title={t("common.redo")}
          onClick={redo}
        >
          ↷
        </Button>
        <Button
          disabled={!ex.online || dirty}
          variant="primary"
          onClick={() =>
            ex.send({
              type: "transport",
              command: ex.state.frozen ? "play" : "pause",
            })
          }
        >
          {t(ex.state.frozen ? "trainer.start" : "trainer.pause")}
        </Button>
        <Button
          disabled={!ex.online}
          onClick={() => {
            if (confirm(t("trainer.resetConfirm")))
              ex.send({ type: "transport", command: "reset" });
          }}
        >
          {t("trainer.reset")}
        </Button>
        <Button
          variant="danger"
          disabled={!ex.online || ex.state.phase === "aborted"}
          onClick={() => ex.send({ type: "abort" })}
        >
          {t("trainer.abort")}
        </Button>
        <details className="preferences">
          <summary
            title={t("preferences.title")}
            aria-label={t("preferences.title")}
          >
            ⚙
          </summary>
          <div className="preferences-panel">
            <TerminologySettings />
          </div>
        </details>
      </header>
      <Tabs
        items={(live ? (["live"] as const) : PREP_SECTIONS).map(
          (id) => [id, term(sectionTermId(id))] as const,
        )}
        active={tab}
        onSelect={setTab}
      />
      {density !== "simple" && (
        <div className="density-detail" aria-label={t("terminology.density")}>
          <span>
            {t("trainer.devicesConnected")}: {connected}
          </span>
          <span>
            {t("trainer.hiddenEvents")}: {ex.state.scenario.injects.length}
          </span>
          {density === "full" && nextInject && (
            <span>
              {t("trainer.nextAction", {
                name: nextInject.inject.name,
                seconds: nextInject.at.toFixed(0),
              })}
            </span>
          )}
        </div>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </p>
      )}
      {dirty && (
        <p className="notice">
          {t("trainer.unsaved")}{" "}
          <button
            disabled={!ex.state.frozen || !ex.online}
            onClick={() => save()}
          >
            {t("trainer.saveScenario")}
          </button>
          <button
            onClick={() => {
              setDraft(structuredClone(ex.state.scenario));
              setRevision(ex.state.revision);
              setDirty(false);
            }}
          >
            {t("trainer.discardDraft")}
          </button>
        </p>
      )}
      {wizard ? (
        <GuidedBuilder
          draft={draft}
          change={change}
          readOnly={!ex.state.frozen}
          onNotice={setMessage}
          onOpenExpert={() => navigate({ section: "flow" }, true)}
          onClose={() =>
            navigate(
              {
                section: loc.returnTo ?? loc.section,
                focus: loc.focus,
              },
              true,
            )
          }
          onSave={(s) => {
            if (save(s))
              navigate({ section: nextIncomplete(prepareReadiness(s)) });
          }}
        />
      ) : (
        <>
          {section(tab)}
          {gallery && (
            <TemplateGallery
              onClose={() => setGallery(false)}
              onSelect={(s) => {
                change(s);
                setGallery(false);
                setTab("scenario");
              }}
            />
          )}
          {tab === "live" && (
            <>
              <section className="panel live-priority">
                <div className="section-heading">
                  <h2>{t("trainer.hiddenEvents")}</h2>
                  {nextInject && (
                    <span className="live-next" role="status">
                      {t("trainer.nextAction", {
                        name: nextInject.inject.name,
                        seconds: nextInject.at.toFixed(0),
                      })}
                    </span>
                  )}
                </div>
                <ul className="event-log">
                  {ex.state.scenario.injects.map((r) => (
                    <li key={r.id}>
                      <span>{r.name}</span>
                      <b>
                        {!r.enabled
                          ? t("trainer.inactive")
                          : ex.state.fired.includes(r.id)
                            ? t("trainer.processed")
                            : r.trigger === "timer"
                              ? t("trainer.at", {
                                  seconds: dueAt(
                                    r,
                                    ex.state.scenario.seed,
                                  ).toFixed(0),
                                })
                              : r.trigger === "manual"
                                ? t("trainer.manual")
                                : r.trigger}
                      </b>
                      <button
                        disabled={
                          !ex.online ||
                          ex.state.frozen ||
                          !r.enabled ||
                          ex.state.fired.includes(r.id)
                        }
                        onClick={() => ex.send({ type: "fire", inject: r.id })}
                      >
                        {t("trainer.fire")}
                      </button>
                      <button
                        disabled={!ex.online || ex.state.frozen}
                        onClick={() =>
                          change({
                            ...draft,
                            injects: draft.injects.map((row) =>
                              row.id === r.id
                                ? { ...row, enabled: !row.enabled }
                                : row,
                            ),
                          })
                        }
                      >
                        {t(r.enabled ? "trainer.disable" : "trainer.enable")}
                      </button>
                      {[-300, -60, 60, 300].map((delta) => (
                        <button
                          key={delta}
                          disabled={
                            !ex.online ||
                            ex.state.frozen ||
                            ex.state.fired.includes(r.id)
                          }
                          onClick={() =>
                            ex.send({
                              type: "reschedule",
                              inject: r.id,
                              to: Math.max(
                                0,
                                dueAt(r, ex.state.scenario.seed) + delta,
                              ),
                              reason: "live",
                            })
                          }
                        >
                          {delta > 0 ? `+${delta / 60}` : delta / 60} min
                        </button>
                      ))}
                    </li>
                  ))}
                </ul>
                <h3>{t("trainer.releases")}</h3>
                <div className="button-row">
                  {ex.state.scenario.dossiers
                    .filter((d) => !d.released)
                    .map((d) => (
                      <button
                        key={d.id}
                        onClick={() =>
                          ex.send({
                            type: "action",
                            action: { type: "release", target: d.id },
                          })
                        }
                      >
                        {t("trainer.release", { name: d.name })}
                      </button>
                    ))}
                  {ex.state.scenario.stations
                    .filter((s) => s.module === "camera")
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          ex.send({
                            type: "action",
                            action: {
                              type: "camera",
                              target: s.id,
                              offline: !ex.state.cameraOffline[s.id],
                            },
                          })
                        }
                      >
                        {s.name}:{" "}
                        {ex.state.cameraOffline[s.id]
                          ? t("trainer.restoreSignal")
                          : t("trainer.cutSignal")}
                      </button>
                    ))}
                </div>
              </section>
              <MelTimeline
                state={ex.state}
                onStartWorkflow={(id) =>
                  ex.send({ type: "workflow-start", workflow: id })
                }
              />
              <div className="training-columns">
                {ex.state.scenario.patients.map((p) => (
                  <PatientControl key={p.id} patient={p} />
                ))}
              </div>
              <section className="panel">
                <h2>{t("trainer.sendMessage")}</h2>
                <div className="message-compose">
                  <select
                    aria-label={t("trainer.recipient")}
                    value={msgTo}
                    onChange={(e) => setMsgTo(e.target.value)}
                  >
                    <option value="all">{t("trainer.all")}</option>
                    <option value="hq">
                      <Term id="headquarters" form="acronym" />
                    </option>
                    {draft.stations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={t("trainer.message")}
                    value={msgText}
                    maxLength={280}
                    placeholder={t("trainer.message")}
                    onChange={(e) => setMsgText(e.target.value)}
                  />
                  <button
                    disabled={!ex.online || !msgText.trim()}
                    onClick={() => {
                      if (ex.send({ type: "message", to: msgTo, text: msgText }))
                        setMsgText("");
                    }}
                  >
                    {t("trainer.send")}
                  </button>
                </div>
                <ul className="event-log">
                  {ex.state.messages
                    .slice(-8)
                    .reverse()
                    .map((m, i) => (
                      <li key={i}>
                        <time>{m.at.toFixed(1)}s</time>
                        {m.to}: {m.text}
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
