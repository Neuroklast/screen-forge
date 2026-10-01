import { useState } from "react";
import type { TrainingStation } from "../../core/training";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { WorkspaceShell } from "../../ui/WorkspaceShell";
import { Panel } from "../../ui/primitives";
import type { PrepareSectionProps } from "./shared";
import { devicePresetsFor, type DevicePreset } from "./devicePresets";
import { DeviceNavigator } from "./devices/DeviceNavigator";
import { DevicePreview } from "./devices/DevicePreview";
import { DeviceInspector } from "./devices/DeviceInspector";
import { DeviceStatusBar } from "./devices/DeviceStatusBar";
import { ProvisioningPanel } from "./devices/ProvisioningPanel";
import type { DeviceSelection } from "./devices/selection";
import type { PreviewState } from "./devices/preview";
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

type WorkspaceTool = "build" | "provision" | "test";
const TOOLS: WorkspaceTool[] = ["build", "provision", "test"];

// Devices: one persistent workspace. Structure in the navigator (devices, props),
// work in the canvas (live preview / provisioning), properties in the contextual
// inspector, and Build/Provision/Test as workspace tools. No stacked panels and
// no per-item controls in the navigator.
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
  const [selection, setSelection] = useState<DeviceSelection>(null);
  const [preview, setPreview] = useState<PreviewState>("normal");
  const [tool, setTool] = useState<WorkspaceTool>("build");
  const [addOpen, setAddOpen] = useState(false);
  const presets = devicePresetsFor(caps);
  const teams = draft.teams;
  const participants = draft.stations.filter((station) => station.player);
  const hasOwnershipOptions =
    caps.teams &&
    (teams.length > 0 || participants.some((row) => row.team !== ""));

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
  // The canvas always previews a device; a prop selection previews its bound
  // device. The inspector follows the selection, defaulting to the active device.
  const activeStation = selectedDevice ?? boundStation ?? draft.stations[0];
  const inspectorSelection: DeviceSelection =
    selection ??
    (activeStation ? { kind: "device", id: activeStation.id } : null);
  const inspectorStation =
    inspectorSelection?.kind === "device" ||
    inspectorSelection?.kind === "element"
      ? draft.stations.find((station) => station.id === inspectorSelection.id)
      : undefined;
  const anchor =
    inspectorSelection?.kind === "element" ? inspectorSelection.anchor : "";
  const canvasAnchor =
    selection?.kind === "element" && selection.id === activeStation?.id
      ? selection.anchor
      : "";
  const selectionLabel =
    inspectorStation?.name ?? selectedProp?.name ?? activeStation?.name ?? "";

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

  const canvas =
    tool === "provision" ? (
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
    ) : activeStation ? (
      <DevicePreview
        station={activeStation}
        scenario={draft}
        preview={preview}
        onPreviewState={setPreview}
        selectedAnchor={canvasAnchor}
        onSelectAnchor={(next) =>
          setSelection({ kind: "element", id: activeStation.id, anchor: next })
        }
        readOnly={readOnly}
        onUpdateName={(name) =>
          change(updateDevice(draft, activeStation.id, { name }))
        }
        onUpdatePresentation={(patch) =>
          change(setPresentation(draft, activeStation.id, { config: patch }))
        }
      />
    ) : (
      <div className="device-canvas-empty">
        <p>{t("prep.devices.noSelection")}</p>
        <p className="prepare-hint">{t("prep.devices.selectElement")}</p>
      </div>
    );

  return (
    <Panel className="prepare">
      <WorkspaceShell
        label={t("prep.devices.workspace")}
        focus={tool === "test"}
        toolbar={
          <div className="device-toolbar">
            <h2>
              <Term id="nav.assets" />
            </h2>
            <div className="device-add">
              <button
                type="button"
                aria-expanded={addOpen}
                disabled={readOnly}
                onClick={() => setAddOpen((value) => !value)}
              >
                <span aria-hidden="true">＋</span> {t("prep.devices.add")}
              </button>
              {addOpen && (
                <div className="device-add-menu">
                  {presets.map((preset) => (
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
            <div className="device-tools" role="tablist">
              {TOOLS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tool === id}
                  className={tool === id ? "active" : ""}
                  onClick={() => setTool(id)}
                >
                  {t(`prep.devices.tool.${id}`)}
                </button>
              ))}
            </div>
          </div>
        }
        navigator={
          <DeviceNavigator
            devices={draft.stations}
            props={draft.props}
            showProps={caps.props}
            selection={inspectorSelection}
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
            selection={inspectorSelection}
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
          <DeviceStatusBar
            count={draft.stations.length}
            selectionLabel={selectionLabel}
            preview={preview}
          />
        }
      />
    </Panel>
  );
}
