import type { TrainingStation } from "../../core/training";
import { t } from "../../i18n";
import { presetLabel } from "./devicePresets";

// Derived authoring view (docs/architecture/devices.md). The UI reasons about a
// person, an asset, a world object and an interface — not about the storage
// shape of a TrainingStation (where a participant is a station with
// `player: true`). This is a pure projection: it is never a second source of
// truth and never persisted.
export type AssetView = {
  id: string;
  /** Asset identity. Never the participant's name. */
  name: string;
  /** User-facing profile label (e.g. "Field device (GPS)"). */
  profile: string;
  /** The person the asset is assigned to, when it is a participant's device. */
  assignedTo?: string;
  /** The world object this interface is bound to, when any. */
  boundProp?: string;
};

export function assetView(station: TrainingStation): AssetView {
  return {
    id: station.id,
    name: station.player ? t(presetLabel(station.module)) : station.name,
    profile: t(presetLabel(station.module)),
    assignedTo: station.player ? station.name : undefined,
    boundProp: station.bindings.prop || undefined,
  };
}

export function assetDetail(view: AssetView): string {
  return view.assignedTo
    ? t("prep.devices.assignedTo", { name: view.assignedTo })
    : view.profile;
}
