export type MapAdapterId = "leaflet" | "vector" | "offline";

export type MapAdapter = {
  id: MapAdapterId;
  requiresWebGL2: boolean;
  offlineCapable: boolean;
  tiles: "remote" | "local-package";
  attribution: string;
};

export const leafletAdapter: MapAdapter = {
  id: "leaflet",
  requiresWebGL2: false,
  offlineCapable: true,
  tiles: "local-package",
  attribution: "Leaflet",
};

export const vectorAdapter: MapAdapter = {
  id: "vector",
  requiresWebGL2: true,
  offlineCapable: false,
  tiles: "remote",
  attribution: "MapLibre",
};

export const offlineAdapter: MapAdapter = {
  id: "offline",
  requiresWebGL2: false,
  offlineCapable: true,
  tiles: "local-package",
  attribution: "local",
};

// Choose a map stack from the deployment requirements, not from aesthetics.
export function selectAdapter(requirements: {
  offline: boolean;
  richVector: boolean;
}): MapAdapter {
  if (requirements.offline) return offlineAdapter;
  if (requirements.richVector) return vectorAdapter;
  return leafletAdapter;
}
