import { useState } from "react";
import {
  scenarioSchema,
  stationSchema,
  template,
  type Scenario,
} from "../core/training";
import { defaultDossiers } from "../core/dossiers";
import { missionTemplates } from "../core/templates";
import { t } from "../i18n";

// Ids already offered as one-tap starters above; keep the library list distinct.
const QUICK_IDS = new Set([
  "search-rescue",
  "medical-emergency",
  "milsim-skirmish",
  "film-playback",
]);

export function ScenarioWizard({
  onSave,
  onClose,
}: {
  onSave: (s: Scenario) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState(() => template("sar")),
    [injectId, setInjectId] = useState(""),
    [error, setError] = useState("");
  const questions = [
    t("wizard.q1"),
    t("wizard.q2"),
    t("wizard.q3"),
    t("wizard.q4"),
    t("wizard.q5"),
  ];
  const update = (patch: Partial<Scenario>) =>
    setDraft((s) => ({ ...s, ...patch }));
  const inject =
    draft.injects.find((r) => r.id === injectId) ?? draft.injects[0];
  const choose = (kind: Parameters<typeof template>[0]) => {
    const s = template(kind);
    s.dossiers = defaultDossiers().map((d) => ({ ...d, released: false }));
    setDraft(s);
    setStep(1);
  };
  const next = () => {
    const result = scenarioSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join(" · "));
      return;
    }
    setError("");
    if (step === 4) onSave(result.data);
    else setStep(step + 1);
  };
  return (
    <section className="wizard panel" aria-label={t("wizard.aria")}>
      <div className="section-heading">
        <span className="eyebrow">{t("wizard.eyebrow", { step: step + 1 })}</span>
        <button onClick={onClose}>{t("common.close")}</button>
      </div>
      <h2>{questions[step]}</h2>
      <ol className="wizard-steps">
        {[
          "wizard.step.purpose",
          "wizard.step.ground",
          "wizard.step.devices",
          "wizard.step.flow",
          "wizard.step.start",
        ].map((key, i) => (
          <li key={key} className={i === step ? "active" : ""}>
            {i + 1}. {t(key)}
          </li>
        ))}
      </ol>
      {step === 0 && (
        <>
          <div className="template-grid">
            {(["sar", "medical", "airsoft", "film"] as const).map((kind) => (
              <button key={kind} onClick={() => choose(kind)}>
                <strong>{template(kind).name}</strong>
                <span>{t(`wizard.tpl.${kind}`)}</span>
              </button>
            ))}
          </div>
          <p className="eyebrow">{t("wizard.library")}</p>
          <div className="template-grid">
            {missionTemplates
              .filter((tpl) => !QUICK_IDS.has(tpl.id))
              .map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setDraft(structuredClone(tpl.scenario));
                    setError("");
                    setStep(1);
                  }}
                >
                  <strong>{tpl.name}</strong>
                  <span>{tpl.category}</span>
                </button>
              ))}
          </div>
        </>
      )}
      {step === 1 && (
        <div className="form-grid">
          <label>
            {t("wizard.name")}
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          <label>
            {t("wizard.source")}
            <select
              value={draft.mode}
              onChange={(e) =>
                update({ mode: e.target.value as Scenario["mode"] })
              }
            >
              <option>LIVE</option>
              <option>PLAYBACK</option>
            </select>
          </label>
          {(["lat", "lng", "zoom"] as const).map((k) => (
            <label key={k}>
              {t(`wizard.${k}`)}
              <input
                type="number"
                step="any"
                value={draft.map[k]}
                onChange={(e) =>
                  update({ map: { ...draft.map, [k]: Number(e.target.value) } })
                }
              />
            </label>
          ))}
          <p>{t("wizard.sourceNote")}</p>
        </div>
      )}
      {step === 2 && (
        <>
          <p>{t("wizard.devicesNote")}</p>
          <div className="form-grid">
            {draft.stations.map((st) => (
              <label key={st.id}>
                {st.module} · {st.id}
                <input
                  value={st.name}
                  onChange={(e) =>
                    update({
                      stations: draft.stations.map((s) =>
                        s.id === st.id ? { ...s, name: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => {
              const id = `player-${Date.now().toString(36)}`;
              const station = stationSchema.parse({
                id,
                name: `Player ${draft.stations.filter((s) => s.player).length + 1}`,
                role: "element",
                module: "tracking",
                player: true,
              });
              update({ stations: [...draft.stations, station] });
            }}
          >
            {t("wizard.addPlayer")}
          </button>
        </>
      )}
      {step === 3 && (
        <>
          <p>{t("wizard.flowNote")}</p>
          {inject ? (
            <>
              <label>
                {t("wizard.injectPick")}
                <select
                  value={inject.id}
                  onChange={(e) => setInjectId(e.target.value)}
                >
                  {draft.injects.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("wizard.injectAt")}
                <input
                  type="number"
                  min="0"
                  max="86400"
                  value={inject.at}
                  onChange={(e) =>
                    update({
                      injects: draft.injects.map((r) =>
                        r.id === inject.id
                          ? { ...r, at: Number(e.target.value) }
                          : r,
                      ),
                    })
                  }
                />
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={inject.enabled}
                  onChange={(e) =>
                    update({
                      injects: draft.injects.map((r) =>
                        r.id === inject.id
                          ? { ...r, enabled: e.target.checked }
                          : r,
                      ),
                    })
                  }
                />
                {t("wizard.injectToggle")}
              </label>
            </>
          ) : (
            <p>{t("wizard.noInjects")}</p>
          )}
          <p>{t("wizard.terminalNote")}</p>
        </>
      )}
      {step === 4 && (
        <>
          <div className="summary-grid">
            <div>
              <b>{draft.name}</b>
              <span>{draft.mode}</span>
            </div>
            <div>
              <b>{draft.stations.length}</b>
              <span>{t("wizard.devices")}</span>
            </div>
            {draft.patients.length > 0 && (
              <div>
                <b>{draft.patients.length}</b>
                <span>{t("wizard.patients")}</span>
              </div>
            )}
            <div>
              <b>{draft.injects.filter((r) => r.enabled).length}</b>
              <span>{t("wizard.events")}</span>
            </div>
          </div>
          <p>{t("wizard.summaryNote")}</p>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="button-row">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)}>{t("common.back")}</button>
        )}
        {step > 0 && (
          <button className="primary" onClick={next}>
            {step === 4 ? t("wizard.create") : t("common.next")}
          </button>
        )}
      </div>
    </section>
  );
}
