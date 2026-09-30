import { taskBlock, taskBlocks, type UiField } from "../core/taskBlocks";
import { conditionOperators } from "../core/workflow";
import {
  defaultValueFor,
  taskTypeLabel,
  workflowSurfaces,
} from "../core/workflowEdit";
import type {
  Workflow,
  WorkflowNode,
  WorkflowValue,
  WorkflowVariable,
} from "../core/workflow";
import type { Scenario } from "../core/training";
import { t } from "../i18n";

export function VariableSelect({
  label,
  value,
  variables,
  kind,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  variables: WorkflowVariable[];
  kind?: WorkflowVariable["kind"];
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const options = kind ? variables.filter((v) => v.kind === kind) : variables;
  return (
    <label>
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("builder.noneOption")}</option>
        {options.map((variable) => (
          <option key={variable.id} value={variable.id}>
            {variable.id}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ValueInput({
  variable,
  value,
  disabled,
  onChange,
}: {
  variable?: WorkflowVariable;
  value: WorkflowValue;
  disabled: boolean;
  onChange: (value: WorkflowValue) => void;
}) {
  if (variable?.kind === "boolean")
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {t("builder.value")}
      </label>
    );
  if (variable?.kind === "enum")
    return (
      <label>
        {t("builder.value")}
        <select
          value={String(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          {variable.values.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
    );
  if (variable?.kind === "number")
    return (
      <label>
        {t("builder.value")}
        <input
          type="number"
          value={Number(value ?? 0)}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  return (
    <label>
      {t("builder.value")}
      <input
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FieldInput({
  field,
  value,
  variables,
  disabled,
  onChange,
}: {
  field: UiField;
  value: unknown;
  variables: WorkflowVariable[];
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  if (field.path === "expectedValueRef")
    return (
      <VariableSelect
        label={field.label}
        value={String(value ?? "")}
        variables={variables}
        kind="string"
        disabled={disabled}
        onChange={onChange}
      />
    );
  if (field.control === "toggle")
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {field.label}
      </label>
    );
  if (field.control === "lines")
    return (
      <label>
        {field.label}
        <textarea
          value={((value as string[] | undefined) ?? []).join("\n")}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 20),
            )
          }
        />
      </label>
    );
  if (field.control === "number" || field.control === "duration")
    return (
      <label>
        {field.label}
        <input
          type="number"
          value={Number(value ?? 0)}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  return (
    <label>
      {field.label}
      <input
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

// Typed configuration editor for a workflow node. Shared by the legacy graph
// editor and the preparation flow workspace.
export function NodeFields({
  node,
  workflow,
  draft,
  readOnly,
  onChange,
}: {
  node: WorkflowNode;
  workflow: Workflow;
  draft: Scenario;
  readOnly: boolean;
  onChange: (node: WorkflowNode) => void;
}) {
  const variableOf = (id: string) =>
    workflow.variables.find((variable) => variable.id === id);
  switch (node.type) {
    case "start":
      return <p className="builder-hint">{t("builder.startHint")}</p>;
    case "end":
      return (
        <label>
          {t("builder.outcome")}
          <select
            value={node.outcome}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...node,
                outcome: event.target.value as "success" | "failure",
              })
            }
          >
            <option value="success">{t("builder.success")}</option>
            <option value="failure">{t("builder.failure")}</option>
          </select>
        </label>
      );
    case "task": {
      const block = taskBlock(node.task);
      const parsed = block?.schema.safeParse(node.config);
      const config = (parsed?.success ? parsed.data : node.config) as Record<
        string,
        unknown
      >;
      const setConfig = (patch: Record<string, unknown>) =>
        onChange({ ...node, config: { ...node.config, ...patch } });
      return (
        <>
          <label>
            {t("builder.taskType")}
            <select
              value={node.task}
              disabled={readOnly}
              onChange={(event) => {
                const taskType = event.target.value;
                onChange({
                  ...node,
                  task: taskType,
                  config: taskBlock(taskType)?.defaults() ?? {},
                });
              }}
            >
              {taskBlocks().map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {t(taskTypeLabel(definition.type))}
                </option>
              ))}
            </select>
          </label>
          {block?.ui.fields.map((field) => (
            <FieldInput
              key={field.path}
              field={field}
              value={config[field.path]}
              variables={workflow.variables}
              disabled={readOnly}
              onChange={(value) => setConfig({ [field.path]: value })}
            />
          ))}
          {(node.task === "wait-for-event" || node.task === "connect") && (
            <>
              <label>
                {t("flow.prop")}
                <select
                  value={String(config.prop ?? "")}
                  disabled={readOnly}
                  onChange={(event) =>
                    setConfig({ prop: event.target.value, to: "" })
                  }
                >
                  <option value="">{t("builder.noneOption")}</option>
                  {draft.props.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("flow.propState")}
                <select
                  value={String(config.to ?? "")}
                  disabled={readOnly}
                  onChange={(event) => setConfig({ to: event.target.value })}
                >
                  <option value="">{t("builder.noneOption")}</option>
                  {(draft.props.find(
                    (row) => row.id === String(config.prop ?? ""),
                  )?.states ?? []).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {node.task === "choice" &&
            (() => {
              const options =
                (config.options as
                  | { id: string; label: string }[]
                  | undefined) ?? [];
              return (
                <>
                  <span className="palette-group-title">
                    {t("builder.options")}
                  </span>
                  {options.map((option, index) => (
                    <div key={index} className="wf-option-row">
                      <input
                        aria-label={t("builder.optionId")}
                        value={option.id}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...options];
                          next[index] = { ...option, id: event.target.value };
                          setConfig({ options: next });
                        }}
                      />
                      <input
                        aria-label={t("builder.optionLabel")}
                        value={option.label}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...options];
                          next[index] = { ...option, label: event.target.value };
                          setConfig({ options: next });
                        }}
                      />
                      <button
                        aria-label={t("builder.remove")}
                        disabled={readOnly || options.length <= 2}
                        onClick={() =>
                          setConfig({
                            options: options.filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    disabled={readOnly || options.length >= 6}
                    onClick={() => {
                      let n = options.length + 1;
                      while (options.some((o) => o.id === `o${n}`)) n++;
                      setConfig({
                        options: [...options, { id: `o${n}`, label: "" }],
                      });
                    }}
                  >
                    + {t("builder.addOption")}
                  </button>
                </>
              );
            })()}
          {node.task === "report" &&
            (() => {
              const fields =
                (config.fields as { id: string; label: string }[] | undefined) ??
                [];
              return (
                <>
                  <span className="palette-group-title">
                    {t("builder.reportFields")}
                  </span>
                  {fields.map((field, index) => (
                    <div key={index} className="wf-option-row">
                      <input
                        aria-label={t("builder.fieldId")}
                        value={field.id}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...fields];
                          next[index] = { ...field, id: event.target.value };
                          setConfig({ fields: next });
                        }}
                      />
                      <input
                        aria-label={t("builder.fieldLabel")}
                        value={field.label}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...fields];
                          next[index] = { ...field, label: event.target.value };
                          setConfig({ fields: next });
                        }}
                      />
                      <button
                        aria-label={t("builder.remove")}
                        disabled={readOnly || fields.length <= 1}
                        onClick={() =>
                          setConfig({
                            fields: fields.filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    disabled={readOnly || fields.length >= 6}
                    onClick={() => {
                      let n = fields.length + 1;
                      while (fields.some((f) => f.id === `f${n}`)) n++;
                      setConfig({
                        fields: [...fields, { id: `f${n}`, label: "" }],
                      });
                    }}
                  >
                    + {t("builder.addField")}
                  </button>
                </>
              );
            })()}
          {node.task === "inspect" && (
            <label>
              {t("builder.lines")}
              <textarea
                value={((config.lines as string[] | undefined) ?? []).join("\n")}
                disabled={readOnly}
                onChange={(event) =>
                  setConfig({
                    lines: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 8),
                  })
                }
              />
            </label>
          )}
        </>
      );
    }
    case "condition":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            disabled={readOnly}
            onChange={(id) =>
              onChange({
                ...node,
                variable: id,
                value: variableOf(id)
                  ? defaultValueFor(variableOf(id)!)
                  : node.value,
              })
            }
          />
          <label>
            {t("builder.operator")}
            <select
              value={node.operator}
              disabled={readOnly}
              onChange={(event) =>
                onChange({
                  ...node,
                  operator: event.target
                    .value as (typeof conditionOperators)[number],
                })
              }
            >
              {conditionOperators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </label>
          <ValueInput
            variable={variableOf(node.variable)}
            value={node.value}
            disabled={readOnly}
            onChange={(value) => onChange({ ...node, value })}
          />
        </>
      );
    case "set-variable":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            disabled={readOnly}
            onChange={(id) =>
              onChange({
                ...node,
                variable: id,
                value: variableOf(id)
                  ? defaultValueFor(variableOf(id)!)
                  : node.value,
              })
            }
          />
          <ValueInput
            variable={variableOf(node.variable)}
            value={node.value}
            disabled={readOnly}
            onChange={(value) => onChange({ ...node, value })}
          />
        </>
      );
    case "increment":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            kind="number"
            disabled={readOnly}
            onChange={(id) => onChange({ ...node, variable: id })}
          />
          <label>
            {t("builder.step")}
            <input
              type="number"
              value={node.by}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, by: Number(event.target.value) })
              }
            />
          </label>
        </>
      );
    case "delay":
      return (
        <label>
          {t("builder.seconds")}
          <input
            type="number"
            min={0}
            value={node.seconds}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...node, seconds: Number(event.target.value) })
            }
          />
        </label>
      );
    case "show-surface":
      return (
        <>
          <label>
            {t("builder.station")}
            <select
              value={node.station}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, station: event.target.value })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {draft.stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("builder.surface")}
            <select
              value={node.surface}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, surface: event.target.value })
              }
            >
              {workflowSurfaces.map((surface) => (
                <option key={surface} value={surface}>
                  {surface}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    case "set-prop-state": {
      const prop = draft.props.find((row) => row.id === node.prop);
      return (
        <>
          <label>
            {t("flow.prop")}
            <select
              value={node.prop}
              disabled={readOnly}
              onChange={(event) =>
                onChange({
                  ...node,
                  prop: event.target.value,
                  state: "",
                })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {draft.props.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("flow.propState")}
            <select
              value={node.state}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, state: event.target.value })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {(prop?.states ?? []).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    }
    case "complete-objective":
      return (
        <label>
          {t("builder.objective")}
          <select
            value={node.objective}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...node, objective: event.target.value })
            }
          >
            <option value="">{t("builder.noneOption")}</option>
            {draft.objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
              </option>
            ))}
          </select>
        </label>
      );
  }
}
