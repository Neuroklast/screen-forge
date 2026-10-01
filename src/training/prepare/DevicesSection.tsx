import { useState } from "react";
import { presentationConfig } from "../../core/config";
import { lintMission } from "../../core/missionLint";
import type { TrainingStation } from "../../core/training";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { WorkspaceShell } from "../../ui/WorkspaceShell";
import type { PrepareSectionProps } from "./shared";
import {
  devicePresetsFor,
  splitPresets,
  type DevicePreset,
} from "./devicePresets";
import { DeviceNavigator } from "./devices/DeviceNavigator";
import { DevicePreview, effectiveScene } from "./devices/DevicePreview";
import { DeviceInspector } from "./devices/DeviceInspector";
import { DeviceStatusBar } from "./devices/DeviceStatusBar";
import { ProvisioningPanel } from "./devices/ProvisioningPanel";
import type { DeviceSelection } from "./devices/selection";
import { previewStates, type PreviewState } from "./devices/preview";
import {
  addDevice,
  addProp,
  removeDevice,
  removeProp,
  setDeviceBinding,
  setDeviceOwner,
  setPresentation,
  updateDevice,
  updateProp,
} from "./devices/commands";
import "./devices/devices.css";

type DevicesSectionProps = PrepareSectionProps & {
  presence: Record<string, { online: boolean; lastSeen: number }>;
  online: boolean;
  invitation: {
    token: string;
    station: string;
    role: "hq" | "element";
    expires: number;
  } | null;
  onProvision: (station: string) => void;
  onRevoke: (station: string) => void;
  publicOrigin: string;
  setPublicOrigin: (v: string) => void;
  invitationUrl: string;
  onNotice: (message: string) => void;
};

// Two modes, not three tabs: EDIT the interface, INTERACT with it. Connecting is
// a context action that opens the provisioning tool over the canvas.
type WorkspaceTool = "edit" | "interact";
const TOOLS: WorkspaceTool[] = ["edit", "interact"];

// Devices: one persistent workspace. Structure in the navigator (devices, props),
// work in the canvas (live preview / provisioning), properties in the contextual
// inspector, and Build/Provision/Test as workspace tools. Selection is explicit:
// once the user picks something, exactly that object drives the canvas.
export function DevicesSection({
  draft,
  change,
  readOnly,
  caps,
  presence,
  online,
  invitation,
  onProvision,
  onRevoke,
  publicOrigin,
  setPublicOrigin,
  invitationUrl,
  onNotice,
}: DevicesSectionProps) {
  // The first open selects the first device; after that, selection is explicit.
  const [selection, setSelection] = useState<DeviceSelection>(() =>
    draft.stations[0] ? { kind: "device", id: draft.stations[0].id } : null,
  );
  const [preview, setPreview] = useState<PreviewState>("normal");
  const [tool, setTool] = useState<WorkspaceTool>("edit");
  const [connect, setConnect] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addMore, setAddMore] = useState(false);
  const presets = devicePresetsFor(caps);
  const { recommended, more } = splitPresets(presets, draft.type);
  const teams = draft.teams;
  const participants = draft.stations.filter((station) => station.player);
  const hasOwnershipOptions =
    caps.teams &&
    (teams.length > 0 || participants.some((row) => row.team !== ""));

  // The selection is an explicit id. If the object does not exist (e.g. it was
  // just undone), the canvas and inspector show their empty state — never
  // another device. When it reappears (redo) the same id resolves again.
  const selectedDevice =
    selection?.kind === "device" || selection?.kind === "element"
      ? draft.stations.find((station) => station.id === selection.id)
      : undefined;
  const selectedProp =
    selection?.kind === "prop"
      ? draft.props.find((prop) => prop.id === selection.id)
      : undefined;
  const boundStation = selectedProp
    ? draft.stations.find((station) => station.bindings.prop === selectedProp.id)
    : undefined;
  // A bound prop previews its interface; an unbound prop gets an explicit state.
  const canvasStation = selectedDevice ?? boundStation;
  const unboundProp =
    selection?.kind === "prop" && !boundStation ? selectedProp : undefined;
  const inspectorStation = selectedDevice;
  const anchor =
    selection?.kind === "element" ? selection.anchor : "";
  const canvasAnchor =
    selection?.kind === "element" && selection.id === canvasStation?.id
      ? selection.anchor
      : "";
  const format = canvasStation
    ? presentationConfig(
        effectiveScene(canvasStation),
        canvasStation.presentation,
      ).format
    : "";

  const deviceFindings = lintMission(draft).filter(
    (finding) =>
      (finding.path.collection === "stations" ||
        finding.path.collection === "props") &&
      finding.severity !== "info",
  );
  const unboundCount = draft.props.filter(
    (prop) =>
      !draft.stations.some((station) => station.bindings.prop === prop.id),
  ).length;
  const actionable = deviceFindings.length > 0 || unboundCount > 0;

  const ownerOf = (station: TrainingStation): string => {
    if (station.player) return "participant";
    if (teams.some((team) => team.id === station.team)) return station.team;
    const participant = participants.find(
      (row) => row.team !== "" && row.team === station.team,
    );
    if (participant) return `participant:${participant.id}`;
    return "scenario";
  };

  const add = (preset: DevicePreset) => {
    const result = addDevice(draft, preset, "scenario");
    change(result.scenario);
    setSelection({ kind: "device", id: result.id });
    setAddOpen(false);
  };
  const update = (patch: Partial<TrainingStation>) => {
    if (inspectorStation)
      change(updateDevice(draft, inspectorStation.id, patch));
  };
  const updatePresentation = (patch: {
    title?: string;
    subtitle?: string;
    identifier?: string;
  }) => {
    if (inspectorStation)
      change(setPresentation(draft, inspectorStation.id, { config: patch }));
  };
  const remove = () => {
    if (!inspectorStation) return;
    change(removeDevice(draft, inspectorStation.id));
    setSelection(null);
  };
  const linkProp = (stationId: string) => {
    if (!unboundProp) return;
    change(setDeviceBinding(draft, stationId, { prop: unboundProp.id }));
    setSelection({ kind: "device", id: stationId });
  };
  const createInterface = (preset: DevicePreset) => {
    if (!unboundProp) return;
    const result = addDevice(draft, preset, "scenario");
    change(setDeviceBinding(result.scenario, result.id, { prop: unboundProp.id }));
    setSelection({ kind: "device", id: result.id });
  };

  const linkCandidates = draft.stations.filter(
    (station) =>
      !station.player && !station.bindings.prop && station.role === "element",
  );
  const createPreset = unboundProp
    ? presets.find((preset) => preset.module === unboundProp.kind)
    : undefined;

  const canvas =
    connect ? (
      <div className="sf-device-connect">
        <div className="sf-device-connect-head">
          <button type="button" onClick={() => setConnect(false)}>
            {t("common.close")}
          </button>
        </div>
        <ProvisioningPanel
          draft={draft}
          presence={presence}
          online={online}
          invitation={invitation}
          onProvision={onProvision}
          onRevoke={onRevoke}
          publicOrigin={publicOrigin}
          setPublicOrigin={setPublicOrigin}
          invitationUrl={invitationUrl}
          onNotice={onNotice}
        />
      </div>
    ) : canvasStation ? (
      <DevicePreview
        station={canvasStation}
        scenario={draft}
        preview={preview}
        selectedAnchor={canvasAnchor}
        onSelectAnchor={(next) =>
          setSelection({ kind: "element", id: canvasStation.id, anchor: next })
        }
        readOnly={readOnly}
        onUpdateName={(name) =>
          change(updateDevice(draft, canvasStation.id, { name }))
        }
        onUpdatePresentation={(patch) =>
          change(setPresentation(draft, canvasStation.id, { config: patch }))
        }
      />
    ) : unboundProp ? (
      <div className="sf-device-unbound">
        <h3>{t("prep.devices.unboundTitle")}</h3>
        <p className="prepare-hint">{t("prep.devices.unboundHint")}</p>
        <div className="sf-device-unbound-actions">
          {linkCandidates.length > 0 && (
            <select
              aria-label={t("prep.devices.linkExisting")}
              value=""
              disabled={readOnly}
              onChange={(event) => linkProp(event.target.value)}
            >
              <option value="">{t("prep.devices.linkExisting")}</option>
              {linkCandidates.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          )}
          {createPreset && (
            <button
              type="button"
              disabled={readOnly}
              onClick={() => createInterface(createPreset)}
            >
              {t("prep.devices.createInterface")}
            </button>
          )}
        </div>
      </div>
    ) : (
      <div className="sf-device-canvas-empty">
        <p>{t("prep.devices.noSelection")}</p>
        <p className="prepare-hint">{t("prep.devices.selectElement")}</p>
      </div>
    );

  return (
    <section className="sf-device-workspace">
      <WorkspaceShell
        label={t("prep.devices.workspace")}
        focus={tool === "interact" && !connect}
        toolbar={
          <div className="sf-device-toolbar">
            <h2>
              <Term id="nav.assets" />
            </h2>
            <div className="sf-device-add">
              <button
                type="button"
                aria-expanded={addOpen}
                disabled={readOnly}
                onClick={() => setAddOpen((value) => !value)}
              >
                <span aria-hidden="true">＋</span> {t("prep.devices.add")}
              </button>
              {addOpen && (
                <div className="sf-device-add-menu">
                  <span className="sf-device-add-group">
                    {t("prep.devices.recommended")}
                  </span>
                  {recommended.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => add(preset)}
                    >
                      {t(preset.labelKey)}
                    </button>
                  ))}
                  {more.length > 0 && (
                    <button
                      type="button"
                      className="sf-device-add-group is-toggle"
                      aria-expanded={addMore}
                      onClick={() => setAddMore((value) => !value)}
                    >
                      {t("prep.devices.more")}
                    </button>
                  )}
                  {addMore &&
                    more.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        disabled={readOnly}
                        onClick={() => add(preset)}
                      >
                        {t(preset.labelKey)}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="sf-device-tools" role="tablist">
              {TOOLS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tool === id && !connect}
                  className={tool === id && !connect ? "active" : ""}
                  onClick={() => {
                    setConnect(false);
                    setTool(id);
                  }}
                >
                  {t(`prep.devices.tool.${id}`)}
                </button>
              ))}
              <button
                type="button"
                className={connect ? "active" : ""}
                onClick={() => setConnect(true)}
              >
                {t("prep.devices.connect")}
              </button>
            </div>
            <span className="sf-device-toolbar-spacer" />
            {tool === "edit" && !connect && (
              <div className="sf-device-preview-controls">
                <div
                  className="sf-device-preview-states"
                  role="group"
                  aria-label={t("prep.devices.previewState")}
                >
                  {previewStates.map((state) => (
                    <button
                      key={state}
                      type="button"
                      className={preview === state ? "active" : ""}
                      onClick={() => setPreview(state)}
                    >
                      {t(`prep.devices.state.${state}`)}
                    </button>
                  ))}
                </div>
                {format && (
                  <span className="sf-device-viewport-caption">
                    {format} · {t("prep.devices.fit")}
                  </span>
                )}
              </div>
            )}
          </div>
        }
        navigator={
          <DeviceNavigator
            devices={draft.stations}
            props={draft.props}
            showProps={caps.props}
            selection={selection}
            onSelectDevice={(id) => setSelection({ kind: "device", id })}
            onSelectProp={(id) => setSelection({ kind: "prop", id })}
            onAddProp={() => {
              const result = addProp(draft);
              change(result.scenario);
              setSelection({ kind: "prop", id: result.id });
            }}
            readOnly={readOnly}
          />
        }
        canvas={canvas}
        inspector={
          <DeviceInspector
            selection={selection}
            station={inspectorStation}
            prop={selectedProp}
            anchor={anchor}
            scenario={draft}
            caps={caps}
            readOnly={readOnly}
            presets={presets}
            teams={teams}
            participants={participants}
            hasOwnershipOptions={!!hasOwnershipOptions}
            ownerOf={ownerOf}
            onUpdate={update}
            onSetBinding={(binding) => {
              if (inspectorStation)
                change(setDeviceBinding(draft, inspectorStation.id, binding));
            }}
            onSetOwner={(value) => {
              if (inspectorStation)
                change(setDeviceOwner(draft, inspectorStation.id, value));
            }}
            onPresentation={(patch) => {
              if (inspectorStation)
                change(setPresentation(draft, inspectorStation.id, patch));
            }}
            onRemove={remove}
            onSelectDevice={() =>
              inspectorStation &&
              setSelection({ kind: "device", id: inspectorStation.id })
            }
            onUpdateName={(name) => update({ name })}
            onUpdateProp={(patch) => {
              if (selectedProp)
                change(updateProp(draft, selectedProp.id, patch));
            }}
            onRemoveProp={() => {
              if (!selectedProp) return;
              change(removeProp(draft, selectedProp.id));
              setSelection(null);
            }}
          />
        }
        status={
          actionable ? (
            <DeviceStatusBar
              findings={deviceFindings}
              unbound={unboundCount}
            />
          ) : undefined
        }
      />
    </section>
  );
}
