import { useState } from "react";
import { scenes, defaults, withScene, type Config } from "../core/config";
import {
  ensureEndNode,
  entryStep,
  lintShow,
  newStep,
  showNodePorts,
  showSchema,
  stepById,
  type Show,
  type Take,
} from "../core/director";
import {
  addNode,
  connect,
  edgeForOutput,
  graphUid,
  removeNode,
  replaceNode,
  setOutputTarget,
} from "../core/graphEdit";
import { labelFor } from "../core/labels";
import { showTemplateLabels, showTemplates } from "../core/showTemplates";
import { ShowGraph } from "./ShowGraph";
import { t } from "../i18n";

// Film sequence editor: a real graph. Every take is a node with visible
// success/fail/timeout ports; edges are edited by dragging or, accessibly, by
// picking a target in the inspector. No pagination, no dropdown-only topology.
export function SequenceEditor({
  show,
  onChange,
  config,
  onStart,
  running,
  onStop,
  onAdvance,
  onFail,
}: {
  show: Show;
  onChange: (s: Show) => void;
  config: Config;
  onStart: () => void;
  running: string | null;
  onStop: () => void;
  onAdvance: () => void;
  onFail: () => void;
}) {
  const [selected, setSelected] = useState(show.entry);
  const [status, setStatus] = useState("");
  const item = stepById(show, selected);
  const findings = lintShow(show);
  const errors = findings.filter((finding) => finding.severity === "error");
  const targets = show.nodes.filter(
    (node) => node.id !== selected && node.id !== show.entry,
  );
  const takeCount = show.nodes.filter((node) => node.kind === "take").length;

  const set = (patch: Partial<Take>) => {
    if (!item) return;
    onChange(replaceNode(show, { ...item, ...patch }, showNodePorts));
  };
  const setTarget = (
    output: "success" | "fail" | "timeout",
    target: string,
  ) => {
    if (!item) return;
    onChange(setOutputTarget(show, item.id, output, target, () => graphUid("e")));
  };
  const add = (next: Config) => {
    if (takeCount >= 59) {
      setStatus(t("sequence.limitReached"));
      return;
    }
    const withEnd = ensureEndNode(show);
    const take = newStep(next);
    let draft = addNode(withEnd.show, take);
    const from =
      item && !edgeForOutput(draft, item.id, "success") ? item.id : show.entry;
    if (!edgeForOutput(draft, from, "success"))
      draft = connect(draft, {
        id: graphUid("e"),
        source: from,
        output: "success",
        target: take.id,
      });
    if (!edgeForOutput(draft, take.id, "success"))
      draft = connect(draft, {
        id: graphUid("e"),
        source: take.id,
        output: "success",
        target: withEnd.endId,
      });
    onChange(draft);
    setSelected(take.id);
  };
  const remove = () => {
    if (!item) return;
    onChange(removeNode(show, item.id));
    setSelected("");
  };
  const exportShow = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(show, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "screenforge-show.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const readOnly = !!running;
  return (
    <section className="sequence-editor">
      <header>
        <input
          aria-label={t("sequence.name")}
          value={show.name}
          onChange={(e) => onChange({ ...show, name: e.target.value })}
        />
        <button
          onClick={running ? onStop : onStart}
          disabled={!takeCount || errors.length > 0}
          title={errors.length ? t("sequence.blockedStart") : ""}
        >
          {running ? t("sequence.stop") : t("sequence.start")}
        </button>
        <button disabled={!running} onClick={onAdvance}>
          {t("sequence.nextCue")}
        </button>
        <button disabled={!running} onClick={onFail}>
          {t("sequence.failCue")}
        </button>
        <button onClick={exportShow}>{t("sequence.export")}</button>
        <label className="show-import">
          {t("sequence.import")}
          <input
            aria-label={t("sequence.importAria")}
            type="file"
            accept=".json"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 12_000_000) throw Error();
                const loaded = showSchema.parse(JSON.parse(await file.text()));
                onChange(loaded);
                setSelected(loaded.entry);
                setStatus(t("sequence.loaded"));
              } catch {
                setStatus(t("sequence.invalid"));
              }
            }}
          />
        </label>
      </header>
      <div className="sequence-palette">
        <label>
          {t("sequence.template")}
          <select
            aria-label={t("sequence.template")}
            defaultValue=""
            onChange={(e) => {
              const tpl = showTemplates(config)[Number(e.target.value)];
              if (!tpl) return;
              onChange(tpl.show);
              setSelected(tpl.show.entry);
              setStatus(t("sequence.templateLoaded", { name: tpl.name }));
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              {t("sequence.chooseTemplate")}
            </option>
            {showTemplateLabels.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span>{t("sequence.scenes")}</span>
        {scenes
          .filter((scene) => scene.kind === "scene")
          .map((scene) => (
            <button key={scene.id} onClick={() => add(defaults(scene.id))}>
              + {labelFor("scene", scene.id)}
            </button>
          ))}
        <span>{t("sequence.blocks")}</span>
        {scenes
          .filter((scene) => scene.kind === "block")
          .map((scene) => (
            <button key={scene.id} onClick={() => add(defaults(scene.id))}>
              + {labelFor("scene", scene.id)}
            </button>
          ))}
        <button onClick={() => add(config)}>{t("sequence.currentConfig")}</button>
      </div>
      <div className="sequence-body">
        <div className="sequence-chain">
          <p className="sequence-hint">{t("sequence.graphHint")}</p>
          <div className="sequence-graph">
            <ShowGraph
              show={show}
              findings={findings}
              readOnly={readOnly}
              selectedId={item?.id ?? ""}
              onSelect={setSelected}
              onChange={onChange}
              highlightId={item?.id ?? ""}
            />
          </div>
          <div className="sequence-findings">
            <b>{t("sequence.findings")}</b>
            {errors.length || findings.length ? (
              <ul>
                {findings.map((finding) => (
                  <li
                    key={finding.id}
                    className={finding.severity === "error" ? "is-error" : ""}
                  >
                    <button
                      onClick={() => {
                        if (finding.nodeId) setSelected(finding.nodeId);
                      }}
                    >
                      {finding.message}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span>{t("sequence.noFindings")}</span>
            )}
          </div>
        </div>
        <div className="sequence-properties">
          {item ? (
            <>
              <label>
                {t("sequence.nodeName")}
                <input
                  value={item.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </label>
              <label>
                {t("sequence.scene")}
                <select
                  value={item.config.scene}
                  onChange={(e) =>
                    set({ config: withScene(item.config, e.target.value as Config["scene"]) })
                  }
                >
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>
                      {labelFor("scene", scene.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("sequence.cue")}
                <select
                  value={item.cue}
                  onChange={(e) => set({ cue: e.target.value as Take["cue"] })}
                >
                  {["idle", "active", "warning", "complete"].map((cue) => (
                    <option key={cue} value={cue}>
                      {labelFor("cue", cue)}
                    </option>
                  ))}
                </select>
              </label>
              {item.config.scene === "terminal" && (
                <label>
                  {t("sequence.osApp")}
                  <select
                    aria-label={t("sequence.osApp")}
                    value={item.config.sceneOptions.os.startupApp}
                    onChange={(e) =>
                      set({
                        config: {
                          ...item.config,
                          sceneOptions: {
                            ...item.config.sceneOptions,
                            os: {
                              ...item.config.sceneOptions.os,
                              startupApp:
                                e.target.value as Config["sceneOptions"]["os"]["startupApp"],
                            },
                          },
                        },
                      })
                    }
                  >
                    {(
                      [
                        "overview",
                        "terminal",
                        "files",
                        "personnel",
                        "clusters",
                        "dimension",
                        "messages",
                      ] as const
                    ).map((id) => (
                      <option key={id} value={id}>
                        {labelFor("osApp", id)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                {t("sequence.continueAt")}
                <select
                  aria-label={t("sequence.triggerAria")}
                  value={item.trigger}
                  onChange={(e) =>
                    set({
                      trigger: e.target.value as Take["trigger"],
                      value:
                        e.target.value === "pin" ? item.config.pin : "Enter",
                    })
                  }
                >
                  <option value="time">{t("sequence.triggerTime")}</option>
                  <option value="key">{t("sequence.triggerKey")}</option>
                  <option value="pin">{t("sequence.triggerPin")}</option>
                  <option value="signal">{t("sequence.triggerSignal")}</option>
                </select>
              </label>
              {item.trigger === "time" ? (
                <label>
                  {t("sequence.seconds")}
                  <input
                    aria-label={t("sequence.durationAria")}
                    type="number"
                    min=".1"
                    value={item.duration}
                    onChange={(e) =>
                      set({ duration: Math.max(0.1, +e.target.value) })
                    }
                  />
                </label>
              ) : (
                <label>
                  {t("sequence.expectedInput")}
                  <input
                    aria-label={t("sequence.inputAria")}
                    value={item.value}
                    onChange={(e) =>
                      set({
                        value: e.target.value,
                        config:
                          item.trigger === "pin"
                            ? {
                                ...item.config,
                                pin: /^[A-Za-z0-9]{4,8}$/.test(e.target.value)
                                  ? e.target.value
                                  : item.config.pin,
                                pinEnabled: true,
                              }
                            : item.config,
                      })
                    }
                  />
                </label>
              )}
              <label>
                {t("sequence.timeout")}
                <input
                  aria-label={t("sequence.timeoutAria")}
                  type="number"
                  min={0}
                  value={item.timeout}
                  onChange={(e) =>
                    set({ timeout: Math.max(0, +e.target.value) })
                  }
                />
              </label>
              <label>
                {t("sequence.link")}
                <select
                  aria-label={t("sequence.nextAria")}
                  value={edgeForOutput(show, item.id, "success")?.target ?? ""}
                  onChange={(e) => setTarget("success", e.target.value)}
                >
                  <option value="">{t("sequence.endSequence")}</option>
                  {targets.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.kind === "end"
                        ? t("sequence.node.end")
                        : node.name || node.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("sequence.onFail")}
                <select
                  aria-label={t("sequence.onFailAria")}
                  value={edgeForOutput(show, item.id, "fail")?.target ?? ""}
                  onChange={(e) => setTarget("fail", e.target.value)}
                >
                  <option value="">{t("sequence.endSequence")}</option>
                  {targets.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.kind === "end"
                        ? t("sequence.node.end")
                        : node.name || node.id}
                    </option>
                  ))}
                </select>
              </label>
              {item.timeout > 0 && (
                <label>
                  {t("sequence.timeoutTarget")}
                  <select
                    aria-label={t("sequence.timeoutTarget")}
                    value={edgeForOutput(show, item.id, "timeout")?.target ?? ""}
                    onChange={(e) => setTarget("timeout", e.target.value)}
                  >
                    <option value="">{t("sequence.onFailFallback")}</option>
                    {targets.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.kind === "end"
                          ? t("sequence.node.end")
                          : node.name || node.id}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button onClick={() => set({ config: structuredClone(config) })}>
                {t("sequence.applyCurrent")}
              </button>
              <button disabled={item.id === show.entry} onClick={remove}>
                {t("sequence.removeNode")}
              </button>
            </>
          ) : (
            <p>{t("sequence.selectNode")}</p>
          )}
        </div>
      </div>
      <footer>{status || t("sequence.footer")}</footer>
    </section>
  );
}
