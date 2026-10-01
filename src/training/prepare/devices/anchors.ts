// Selectable regions declared by the shared renderer with `data-sf-anchor`
// (docs/architecture/previews.md). The editor overlay measures them; the
// renderer stays the single renderer and the geometry is never duplicated.

export type AnchorSpec = {
  id: string;
  labelKey: string;
  inline: boolean;
};

export const anchorRegistry: Record<string, AnchorSpec> = {
  "station.name": {
    id: "station.name",
    labelKey: "editor.name",
    inline: true,
  },
  "presentation.title": {
    id: "presentation.title",
    labelKey: "presentation.title",
    inline: true,
  },
  "presentation.subtitle": {
    id: "presentation.subtitle",
    labelKey: "presentation.subtitle",
    inline: true,
  },
  "presentation.identifier": {
    id: "presentation.identifier",
    labelKey: "presentation.identifier",
    inline: true,
  },
};

export function anchorSpec(id: string): AnchorSpec | undefined {
  return anchorRegistry[id];
}
