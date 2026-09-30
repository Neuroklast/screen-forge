import { useState } from "react";
import { scenes, defaults, type Config } from "../core/config";
import { newStep, showSchema, type Show, type Step } from "../core/director";
import { showTemplateLabels, showTemplates } from "../core/showTemplates";
import { t } from "../i18n";
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
  const [selected, setSelected] = useState(show.steps[0]?.id ?? ""),
    [page, setPage] = useState(0),
    [status, setStatus] = useState("");
  const item = show.steps.find((s) => s.id === selected);
  const set = (patch: Partial<Step>) =>
    onChange({
      ...show,
      steps: show.steps.map((s) =>
        s.id === selected ? { ...s, ...patch } : s,
      ),
    });
  const add = (config: Config, index = show.steps.length) => {
    if (show.steps.length >= 60) return;
    const step = newStep(config);
    const steps = [...show.steps];
    steps.splice(index, 0, step);
    onChange({ ...show, steps });
    setSelected(step.id);
    setPage(Math.floor(index / 5));
  };
  const move = (id: string, index: number) => {
    const steps = show.steps.filter((s) => s.id !== id),
      step = show.steps.find((s) => s.id === id);
    if (!step) return;
    steps.splice(Math.max(0, index), 0, step);
    onChange({ ...show, steps });
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
          disabled={!show.steps.length}
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
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 12_000_000) throw Error();
                const loaded = showSchema.parse(JSON.parse(await f.text()));
                onChange(loaded);
                setSelected(loaded.steps[0]?.id ?? "");
                setPage(0);
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
              setSelected(tpl.show.steps[0]?.id ?? "");
              setPage(0);
              setStatus(t("sequence.templateLoaded", { name: tpl.name }));
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              {t("sequence.chooseTemplate")}
            </option>
            {showTemplateLabels.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <span>{t("sequence.scenes")}</span>
        {scenes
          .filter((s) => s.kind === "scene")
          .map((s) => (
            <button
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-scene", s.id)
              }
              onClick={() => add(defaults(s.id))}
            >
              + {s.name}
            </button>
          ))}
        <span>{t("sequence.blocks")}</span>
        {scenes
          .filter((s) => s.kind === "block")
          .map((s) => (
            <button
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-scene", s.id)
              }
              onClick={() => add(defaults(s.id))}
            >
              + {s.name}
            </button>
          ))}
        <button onClick={() => add(config)}>{t("sequence.currentConfig")}</button>
      </div>
      <div className="sequence-body">
        <div className="sequence-chain">
          {show.steps.slice(page * 5, page * 5 + 5).map((s, i) => (
            <article
              key={s.id}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/screenforge-node", s.id)
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData(
                  "application/screenforge-node",
                );
                const scene = e.dataTransfer.getData(
                  "application/screenforge-scene",
                );
                if (id) move(id, page * 5 + i);
                else if (scenes.some((s) => s.id === scene))
                  add(defaults(scene as Config["scene"]), page * 5 + i);
              }}
              className={`${s.id === selected ? "selected" : ""} ${s.id === running ? "running" : ""}`}
            >
              <button
                className="sequence-node"
                onClick={() => setSelected(s.id)}
              >
                <span>{String(page * 5 + i + 1).padStart(2, "0")}</span>
                <strong>{s.name}</strong>
                <small>
                  {s.config.scene} ·{" "}
                  {s.trigger === "time"
                    ? `${s.duration}s`
                    : s.trigger + " : " + s.value}
                </small>
              </button>
              <div className="sequence-node-actions">
                <button
                  aria-label={`Move ${s.name} up`}
                  disabled={page * 5 + i === 0}
                  onClick={() => move(s.id, page * 5 + i - 1)}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${s.name} down`}
                  disabled={page * 5 + i === show.steps.length - 1}
                  onClick={() => move(s.id, page * 5 + i + 1)}
                >
                  ↓
                </button>
              </div>
              <div className="sequence-link">
                →{" "}
                {s.next === "end"
                  ? t("sequence.end")
                  : s.next
                    ? show.steps.find((n) => n.id === s.next)?.name
                    : t("sequence.nextNode")}
              </div>
            </article>
          ))}
          <div className="sequence-page">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              {t("common.back")}
            </button>
            <span>
              {page + 1}/{Math.max(1, Math.ceil(show.steps.length / 5))}
            </span>
            <button
              disabled={(page + 1) * 5 >= show.steps.length}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </button>
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
                    set({ config: defaults(e.target.value as Config["scene"]) })
                  }
                >
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cue
                <select
                  value={item.cue}
                  onChange={(e) => set({ cue: e.target.value as Step["cue"] })}
                >
                  {["idle", "active", "warning", "complete"].map((c) => (
                    <option key={c}>{c}</option>
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
                        {id}
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
                      trigger: e.target.value as Step["trigger"],
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
                {t("sequence.onFail")}
                <select
                  aria-label={t("sequence.onFailAria")}
                  value={item.onFail}
                  onChange={(e) => set({ onFail: e.target.value })}
                >
                  <option value="">{t("sequence.endSequence")}</option>
                  <option value="end">{t("sequence.endSequence")}</option>
                  {show.steps
                    .filter((s) => s.id !== item.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {t("sequence.link")}
                <select
                  aria-label={t("sequence.nextAria")}
                  value={item.next}
                  onChange={(e) => set({ next: e.target.value })}
                >
                  <option value="">{t("sequence.nextInOrder")}</option>
                  <option value="end">{t("sequence.endSequence")}</option>
                  {show.steps
                    .filter((s) => s.id !== item.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <button onClick={() => set({ config: structuredClone(config) })}>
                {t("sequence.applyCurrent")}
              </button>
              <button
                onClick={() => {
                  onChange({
                    ...show,
                    steps: show.steps
                      .filter((s) => s.id !== selected)
                      .map((s) =>
                        s.next === selected ? { ...s, next: "" } : s,
                      ),
                  });
                  setSelected("");
                }}
              >
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
