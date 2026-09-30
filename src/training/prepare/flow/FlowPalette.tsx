import type { Inject } from "../../../core/training";
import {
  flowNodeLabels,
  workflowNodeLabels,
  type FlowNodeKind,
} from "../../../core/workflowEdit";
import type { Workflow } from "../../../core/workflow";
import { t } from "../../../i18n";
import { EVENT_TRIGGERS, triggerLabel } from "./triggers";

const ADVANCED_NODES = [
  "delay",
  "show-surface",
  "increment",
  "set-prop-state",
] as const;

export type AdvancedNodeType = (typeof ADVANCED_NODES)[number];

// Sources of the flow workspace. The active flow is a compact selector at the
// top; blocks and triggers are separate groups so the user never has to reason
// about the internal workflow/event split.
export function FlowPalette({
  workflows,
  workflowId,
  readOnly,
  onSelectWorkflow,
  onAddWorkflow,
  onAddNode,
  onAddAdvancedNode,
  onAddEvent,
}: {
  workflows: Workflow[];
  workflowId: string;
  readOnly: boolean;
  onSelectWorkflow: (id: string) => void;
  onAddWorkflow: () => void;
  onAddNode: (kind: FlowNodeKind) => void;
  onAddAdvancedNode: (type: AdvancedNodeType) => void;
  onAddEvent: (trigger: Inject["trigger"]) => void;
}) {
  return (
    <aside className="builder-palette" aria-label={t("flow.palette")}>
      <div className="palette-group">
        <span className="palette-group-title">{t("cap.workflows")}</span>
        <div className="palette-items">
          <select
            className="palette-select"
            aria-label={t("cap.workflows")}
            value={workflowId}
            disabled={!workflows.length}
            onChange={(e) => onSelectWorkflow(e.target.value)}
          >
            {workflows.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
          <button
            className="palette-item"
            disabled={readOnly}
            onClick={onAddWorkflow}
          >
            {t("builder.newWorkflow")}
          </button>
        </div>
      </div>
      <div className="palette-group">
        <span className="palette-group-title">{t("flow.group.flow")}</span>
        <div className="palette-items">
          {(Object.keys(flowNodeLabels) as FlowNodeKind[]).map((kind) => (
            <button
              key={kind}
              className="palette-item"
              disabled={readOnly || workflows.length === 0}
              onClick={() => onAddNode(kind)}
            >
              {t(flowNodeLabels[kind])}
            </button>
          ))}
        </div>
      </div>
      <details className="prepare-advanced">
        <summary>{t("flow.node.advanced")}</summary>
        <div className="palette-items">
          {ADVANCED_NODES.map((type) => (
            <button
              key={type}
              className="palette-item"
              disabled={readOnly || workflows.length === 0}
              onClick={() => onAddAdvancedNode(type)}
            >
              {t(workflowNodeLabels[type])}
            </button>
          ))}
        </div>
      </details>
      <div className="palette-group">
        <span className="palette-group-title">{t("flow.group.triggers")}</span>
        <div className="palette-items">
          {EVENT_TRIGGERS.map((trigger) => (
            <button
              key={trigger}
              className="palette-item"
              disabled={readOnly}
              onClick={() => onAddEvent(trigger)}
            >
              {triggerLabel(trigger)}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
