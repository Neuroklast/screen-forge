import { lazy, Suspense, useMemo, useState } from "react";
import {
  applySuggestion,
  answerQuestion,
  contextFor,
  dismissSuggestion,
  emptySession,
  nextQuestionCards,
} from "../../core/guided/engine";
import { isAnswered } from "../../core/guided/facts";
import {
  elementOrigin,
  ownershipOf,
  parseElementRef,
  removalOperationFor,
  markRefUserModified,
} from "../../core/guided/meta";
import { applyOperations } from "../../core/guided/operations";
import { reconcile } from "../../core/guided/reconcile";
import {
  guidedDomainScenarioType,
  guidedDomains,
  type ElementRef,
  type GuidedDomain,
  type GuidedQuestion,
  type GuidedSession,
  type ScenarioOperation,
  type Suggestion,
} from "../../core/guided/types";
import { lintMission } from "../../core/missionLint";
import type { Scenario } from "../../core/training";
import { t } from "../../i18n";
import { Button } from "../../ui/primitives";
import "./guided.css";

// The guided surface is a constraint-driven interview next to the real graph.
// It is a projection over the draft scenario: answers and accepted suggestions
// are persisted in `draft.guided`, everything else is recomputed on render.
const WorkflowCanvas = lazy(() =>
  import("../../builder/WorkflowCanvas").then((module) => ({
    default: module.WorkflowCanvas,
  })),
);

function operationSummary(operation: ScenarioOperation): string {
  switch (operation.op) {
    case "add-station":
      return t("guided.op.addStation", { name: operation.station.name });
    case "add-patient":
      return t("guided.op.addPatient", { name: operation.patient.name });
    case "add-prop":
      return t("guided.op.addProp", { name: operation.prop.name });
    case "add-team":
      return t("guided.op.addTeam", { name: operation.team.name });
    case "add-actor":
      return t("guided.op.addActor", { name: operation.actor.name });
    case "add-zone":
      return t("guided.op.addZone", { name: operation.zone.name });
    case "add-objective":
      return t("guided.op.addObjective", { name: operation.objective.name });
    case "add-event":
      return t("guided.op.addEvent", { name: operation.inject.name });
    case "add-workflow":
      return t("guided.op.addWorkflow", { name: operation.workflow.name });
    case "add-node":
    case "connect":
    case "disconnect-edge":
      return t("guided.op.flowStep");
    case "set-capability":
      return t("guided.op.capability", { key: t(`cap.${operation.key}`) });
    case "set-scenario-type":
      return t("guided.op.scenarioType");
    case "set-mode":
      return t("guided.op.mode");
    default:
      return t("guided.op.change");
  }
}

function refLabel(scenario: Scenario, ref: ElementRef): string {
  const parsed = parseElementRef(ref);
  if (!parsed) return ref;
  if (parsed.kind === "entity") {
    const rows = scenario[parsed.collection] as { id: string; name?: string }[];
    return rows.find((row) => row.id === parsed.id)?.name ?? parsed.id;
  }
  if (parsed.kind === "workflow")
    return (
      scenario.workflows.find((row) => row.id === parsed.id)?.name ?? parsed.id
    );
  if (parsed.kind === "node") {
    const node = scenario.workflows
      .find((row) => row.id === parsed.workflowId)
      ?.nodes.find((row) => row.id === parsed.nodeId);
    return node?.name || parsed.nodeId;
  }
  return (
    scenario.injects.find((row) => row.id === parsed.id)?.name ?? parsed.id
  );
}

export function GuidedBuilder({
  draft,
  change,
  readOnly,
  onClose,
  onSave,
  onOpenExpert,
  onNotice,
}: {
  draft: Scenario;
  change: (s: Scenario) => void;
  readOnly: boolean;
  onClose: () => void;
  onSave: (s: Scenario) => void;
  onOpenExpert: () => void;
  onNotice: (message: string) => void;
}) {
  const session = draft.guided;
  const [includeOptional, setIncludeOptional] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const [details, setDetails] = useState<string | null>(null);
  const findings = useMemo(() => lintMission(draft), [draft]);

  const model = useMemo(() => {
    if (!session) return null;
    const ctx = contextFor(draft, session);
    const allQuestions = ctx.packs.flatMap((pack) => pack.questions);
    const cards = nextQuestionCards(ctx, includeOptional);
    const result = reconcile(draft, session);
    return { ctx, allQuestions, cards, result };
  }, [draft, session, includeOptional]);

  const chooseDomain = (domain: GuidedDomain) => {
    const applied = applyOperations(draft, [
      { op: "set-scenario-type", type: guidedDomainScenarioType[domain] },
    ]);
    const base = applied.ok ? applied.scenario : draft;
    change({ ...base, guided: emptySession(domain) });
  };

  const persist = (nextSession: GuidedSession, nextScenario = draft) => {
    change({ ...nextScenario, guided: nextSession });
  };

  const answer = (question: GuidedQuestion, optionIds: string[]) => {
    if (!session) return;
    persist(answerQuestion(session, question.id, optionIds));
    setEditingGroup(null);
    setMulti((current) => {
      const next = { ...current };
      delete next[question.id];
      return next;
    });
  };

  const commitMulti = (questions: GuidedQuestion[]) => {
    if (!session) return;
    let next = session;
    for (const question of questions) {
      if (!question.multi) continue;
      next = answerQuestion(next, question.id, multi[question.id] ?? []);
    }
    persist(next);
    setEditingGroup(null);
    setMulti({});
  };

  const accept = (suggestion: Suggestion) => {
    if (!session) return;
    const result = applySuggestion(draft, session, suggestion);
    if (!result.ok) {
      onNotice(result.error);
      return;
    }
    persist(result.session, result.scenario);
  };

  const skip = (suggestion: Suggestion) => {
    if (!session) return;
    persist(dismissSuggestion(session, suggestion));
  };

  const removeRef = (ref: ElementRef) => {
    if (!session) return;
    const operation = removalOperationFor(ref);
    if (!operation) return;
    const result = applyOperations(draft, [operation]);
    if (!result.ok) {
      onNotice(result.error);
      return;
    }
    persist(session, result.scenario);
  };

  const keepRef = (ref: ElementRef) => {
    if (!session) return;
    persist(session, markRefUserModified(draft, ref));
  };

  const activeWorkflow =
    draft.workflows.find((row) => row.id === selectedWorkflow) ??
    draft.workflows[0];

  const activeCard = model
    ? editingGroup
      ? {
          id: editingGroup,
          priority: "structural" as const,
          questions: model.allQuestions.filter(
            (question) => question.group === editingGroup,
          ),
        }
      : model.cards[0]
    : undefined;

  const answered =
    model && session
      ? model.allQuestions.filter((question) => isAnswered(question, session))
      : [];

  return (
    <section className="guided" aria-label={t("guided.aria")}>
      <header className="guided-head">
        <div>
          <span className="eyebrow">{t("guided.eyebrow")}</span>
          <label>
            {t("wizard.name")}
            <input
              value={draft.name}
              disabled={readOnly}
              onChange={(e) => change({ ...draft, name: e.target.value })}
            />
          </label>
        </div>
        <div className="guided-head-actions">
          <Button onClick={onOpenExpert}>{t("guided.expert")}</Button>
          <Button onClick={onClose}>{t("common.close")}</Button>
        </div>
      </header>

      <div className="guided-grid">
        <div className="guided-interview">
          {!session ? (
            <>
              <h2>{t("guided.intent.title")}</h2>
              <p>{t("guided.intent.hint")}</p>
              <div className="guided-domains">
                {guidedDomains.map((domain) => (
                  <button
                    key={domain}
                    className="guided-domain"
                    aria-label={t(`guided.domain.${domain}`)}
                    disabled={readOnly}
                    onClick={() => chooseDomain(domain)}
                  >
                    <strong>{t(`guided.domain.${domain}`)}</strong>
                    <span>{t(`guided.domain.${domain}.hint`)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {answered.length > 0 && (
                <div className="guided-answered">
                  <h3>{t("guided.answered.title")}</h3>
                  <ul>
                    {answered.map((question) => (
                      <li key={question.id}>
                        <span>{t(question.labelKey)}</span>
                        <b>
                          {(session.answers[question.id] ?? [])
                            .map((optionId) => {
                              const option = question.options.find(
                                (row) => row.id === optionId,
                              );
                              return option ? t(option.labelKey) : optionId;
                            })
                            .join(", ")}
                        </b>
                        <button
                          disabled={readOnly}
                          onClick={() => {
                            setEditingGroup(question.group);
                            setMulti({});
                          }}
                        >
                          {t("guided.change")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeCard ? (
                <div className="guided-card" key={activeCard.id}>
                  <h2>{t("guided.question.title")}</h2>
                  {activeCard.questions.map((question) => {
                    const selected =
                      multi[question.id] ?? session.answers[question.id] ?? [];
                    return (
                      <div key={question.id} className="guided-question">
                        <p>{t(question.labelKey)}</p>
                        <div className="guided-options">
                          {question.options.map((option) => {
                            const on = selected.includes(option.id);
                            return (
                              <button
                                key={option.id}
                                className={on ? "active" : ""}
                                disabled={readOnly}
                                aria-pressed={question.multi ? on : undefined}
                                onClick={() => {
                                  if (readOnly) return;
                                  if (question.multi) {
                                    setMulti((current) => ({
                                      ...current,
                                      [question.id]: on
                                        ? selected.filter((id) => id !== option.id)
                                        : [...selected, option.id],
                                    }));
                                  } else {
                                    answer(question, [option.id]);
                                  }
                                }}
                              >
                                {t(option.labelKey)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {activeCard.questions.some((question) => question.multi) && (
                    <Button
                      variant="primary"
                      disabled={readOnly}
                      onClick={() => commitMulti(activeCard.questions)}
                    >
                      {t("common.next")}
                    </Button>
                  )}
                  {editingGroup && (
                    <Button onClick={() => setEditingGroup(null)}>
                      {t("common.cancel")}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="guided-done">{t("guided.done")}</p>
              )}

              {model &&
                model.ctx.packs.some((pack) => pack.questions.length > 0) && (
                <label className="guided-optional">
                  <input
                    type="checkbox"
                    checked={includeOptional}
                    onChange={(e) => setIncludeOptional(e.target.checked)}
                  />
                  {t("guided.optional")}
                </label>
              )}
              <p className="guided-actions">
                <Button
                  variant="primary"
                  disabled={readOnly}
                  onClick={() => onSave(draft)}
                >
                  {t("guided.create")}
                </Button>
              </p>
            </>
          )}
        </div>

        <div className="guided-side">
          <section className="panel guided-graph">
            <div className="section-heading">
              <h2>{t("guided.graph.title")}</h2>
              {draft.workflows.length > 1 && (
                <select
                  aria-label={t("guided.graph.select")}
                  value={activeWorkflow?.id ?? ""}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                >
                  {draft.workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {activeWorkflow ? (
              <div className="guided-canvas">
                <Suspense
                  fallback={
                    <p className="builder-hint">{t("builder.loading")}</p>
                  }
                >
                  <WorkflowCanvas
                    workflow={activeWorkflow}
                    findings={findings}
                    readOnly={readOnly}
                    selectedNodeId=""
                    onSelectNode={() => undefined}
                    onPatch={(next) =>
                      change({
                        ...draft,
                        workflows: draft.workflows.map((row) =>
                          row.id === next.id ? next : row,
                        ),
                      })
                    }
                    variant="human"
                  />
                </Suspense>
              </div>
            ) : (
              <p className="builder-hint">{t("guided.graph.empty")}</p>
            )}
          </section>

          <section className="panel guided-suggestions">
            <h2>{t("guided.suggestions.title")}</h2>
            {model && model.result.add.length === 0 && (
              <p className="builder-hint">{t("guided.suggestions.empty")}</p>
            )}
            {model?.result.add.map((suggestion) => (
              <article key={suggestion.id} className="guided-suggestion">
                <p>
                  <strong>{t(suggestion.reason.key, suggestion.reason.params)}</strong>
                </p>
                <ul>
                  {suggestion.operations.map((operation, index) => (
                    <li key={index}>{operationSummary(operation)}</li>
                  ))}
                </ul>
                <div className="button-row">
                  <Button
                    variant="primary"
                    disabled={readOnly}
                    onClick={() => accept(suggestion)}
                  >
                    {t("guided.accept")}
                  </Button>
                  <Button
                    disabled={readOnly}
                    onClick={() => skip(suggestion)}
                  >
                    {t("guided.skip")}
                  </Button>
                </div>
              </article>
            ))}

            {model &&
              (model.result.remove.length > 0 ||
                model.result.conflicts.length > 0) && (
                <div className="guided-reconcile">
                  <h3>{t("guided.reconcile.title")}</h3>
                  <p>{t("guided.reconcile.hint")}</p>
                  <ul>
                    {model.result.remove.map((row) => (
                      <li key={row.ref}>
                        <span>{refLabel(draft, row.ref)}</span>
                        <small>{t("guided.reconcile.stale")}</small>
                        <div className="button-row">
                          <Button
                            disabled={readOnly}
                            onClick={() => removeRef(row.ref)}
                          >
                            {t("guided.reconcile.remove")}
                          </Button>
                          <Button
                            disabled={readOnly}
                            onClick={() => keepRef(row.ref)}
                          >
                            {t("guided.reconcile.keep")}
                          </Button>
                        </div>
                      </li>
                    ))}
                    {model.result.conflicts.map((row) => {
                      const origin = elementOrigin(draft, row.ref);
                      const reason =
                        row.reason === "modified"
                          ? t("guided.reconcile.modified")
                          : row.reason === "referenced"
                            ? t("guided.reconcile.referenced")
                            : t("guided.reconcile.invalid");
                      return (
                        <li key={row.ref} className="is-conflict">
                          <span>{refLabel(draft, row.ref)}</span>
                          <small>{reason}</small>
                          <div className="button-row">
                            <Button
                              onClick={() =>
                                setDetails((current) =>
                                  current === row.ref ? null : row.ref,
                                )
                              }
                            >
                              {t("guided.reconcile.details")}
                            </Button>
                            {origin &&
                              ownershipOf(origin) === "generated-modified" && (
                                <Button
                                  disabled={readOnly}
                                  onClick={() => removeRef(row.ref)}
                                >
                                  {t("guided.reconcile.remove")}
                                </Button>
                              )}
                          </div>
                          {details === row.ref && (
                            <p className="guided-details">
                              {t("guided.reconcile.detailsText", {
                                ref: row.ref,
                                rule: origin?.ruleId ?? "—",
                              })}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
          </section>
        </div>
      </div>
    </section>
  );
}
