import { useState } from "react";
import type { Scenario, TrainingStation } from "../../core/training";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { WorkspaceShell } from "../../ui/WorkspaceShell";
import { Panel } from "../../ui/primitives";
import type { PrepareSectionProps } from "./shared";
import { devicePresetsFor } from "./devicePresets";
import { DeviceNavigator } from "./devices/DeviceNavigator";
import { DevicePreview } from "./devices/DevicePreview";
import { DeviceInspector } from "./devices/DeviceInspector";
import { DeviceStatusBar } from "./devices/DeviceStatusBar";
import { PropsPanel } from "./devices/PropsPanel";
import { ProvisioningPanel } from "./devices/ProvisioningPanel";
import type { DeviceSelection } from "./devices/selection";
import type { PreviewState } from "./devices/preview";
import {
  addDevice,
  removeDevice,
  setDeviceBinding,
  setDeviceOwner,
  setPresentation,
  updateDevice,
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

// Devices: the equipment of the scenario. A persistent workspace (navigator /
// live preview / contextual inspector) replaces the long form; every mutation
// goes through the command module, so undo/redo and tests stay honest.
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
  const [owner, setOwner] = useState("scenario");
  const presets = devicePresetsFor(caps);
  const teams = draft.teams;
  const participants = draft.stations.filter((station) => station.player);
  const hasOwnershipOptions =
    caps.teams &&
    (teams.length > 0 || participants.some((row) => row.team !== ""));

  const selectedStation =
    (selection
      ? draft.stations.find((station) => station.id === selection.id)
      : undefined) ?? draft.stations[0];
  const selectedId = selectedStation?.id ?? "";
  const anchor = selection?.kind === "element" ? selection.anchor : "";

  const ownerOf = (station: TrainingStation): string => {
    if (station.player) return "participant";
    if (teams.some((team) => team.id === station.team)) return station.team;
    const participant = participants.find(
      (row) => row.team !== "" && row.team === station.team,
    );
    if (participant) return `participant:${participant.id}`;
    return "scenario";
  };

  const add = (preset: (typeof presets)[number]) => {
    const result = addDevice(draft, preset, owner);
    change(result.scenario);
    setSelection({ kind: "device", id: result.id });
  };
  const update = (patch: Partial<TrainingStation>) => {
    if (selectedStation) change(updateDevice(draft, selectedStation.id, patch));
  };
  const updatePresentation = (patch: {
    title?: string;
    subtitle?: string;
    identifier?: string;
  }) => {
    if (selectedStation)
      change(
        setPresentation(draft, selectedStation.id, { config: patch }),
      );
  };
  const remove = () => {
    if (!selectedStation) return;
    change(removeDevice(draft, selectedStation.id));
    setSelection(null);
  };

  return (
    <Panel className="prepare">
      <h2>
        <Term id="nav.assets" />
      </h2>
      <WorkspaceShell
        label={t("prep.devices.workspace")}
        navigator={
          <DeviceNavigator
            presets={presets}
            devices={draft.stations}
            teams={teams}
            participants={participants}
            hasOwnershipOptions={!!hasOwnershipOptions}
            owner={owner}
            onOwnerChange={setOwner}
            onAdd={add}
            selectedId={selectedId}
            onSelect={(id) => setSelection({ kind: "device", id })}
            ownerOf={ownerOf}
            onAssignOwner={(station, value) =>
              change(setDeviceOwner(draft, station.id, value))
            }
            readOnly={readOnly}
          />
        }
        canvas={
          selectedStation ? (
            <DevicePreview
              station={selectedStation}
              scenario={draft}
              preview={preview}
              onPreviewState={setPreview}
              selectedAnchor={anchor}
              onSelectAnchor={(next) =>
                setSelection({
                  kind: "element",
                  id: selectedStation.id,
                  anchor: next,
                })
              }
              readOnly={readOnly}
              onUpdateName={(name) => update({ name })}
              onUpdatePresentation={updatePresentation}
            />
          ) : (
            <div className="device-canvas-empty">
              <p>{t("prep.devices.noSelection")}</p>
              <p className="prepare-hint">{t("prep.devices.selectElement")}</p>
            </div>
          )
        }
        inspector={
          <DeviceInspector
            station={selectedStation}
            anchor={anchor}
            scenario={draft}
            caps={caps}
            readOnly={readOnly}
            presets={presets}
            onUpdate={update}
            onSetBinding={(binding) => {
              if (selectedStation)
                change(setDeviceBinding(draft, selectedStation.id, binding));
            }}
            onRemove={remove}
            onSelectDevice={() =>
              selectedStation &&
              setSelection({ kind: "device", id: selectedStation.id })
            }
            onUpdateName={(name) => update({ name })}
            onUpdatePresentation={updatePresentation}
          />
        }
        status={
          <DeviceStatusBar
            count={draft.stations.length}
            selectedName={selectedStation?.name ?? ""}
            preview={preview}
          />
        }
      />

      {caps.props && (
        <PropsPanel scenario={draft} readOnly={readOnly} onChange={change} />
      )}

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
    </Panel>
  );
}
