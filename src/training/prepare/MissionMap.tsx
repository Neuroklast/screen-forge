import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { t } from "../../i18n";

// Visual location picker for the Mission section: click the map to set the
// location, zones render as circles. Raw coordinates / tile URL / attribution
// stay in Advanced; this is the normal-surface control
// (docs/konzept/usability/13-editor-workspace.md).
export function MissionMap({
  lat,
  lng,
  zoom,
  tiles,
  attribution,
  zones,
  readOnly,
  onPick,
}: {
  lat: number;
  lng: number;
  zoom: number;
  tiles: string;
  attribution: string;
  zones: { id: string; name: string; lat: number; lng: number; radius: number }[];
  readOnly: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.LayerGroup | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;

  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, { attributionControl: true }).setView(
      [lat, lng],
      zoom,
    );
    map.current = instance;
    overlay.current = L.layerGroup().addTo(instance);
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    map.current?.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !tiles) return;
    // Attribution is user text, never interpreted as markup.
    const escaped = attribution.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
    const layer = L.tileLayer(tiles, { maxZoom: 19, attribution: escaped }).addTo(
      instance,
    );
    return () => {
      instance.removeLayer(layer);
    };
  }, [tiles, attribution]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || readOnly) return;
    const handler = (event: L.LeafletMouseEvent) =>
      pick.current(event.latlng.lat, event.latlng.lng);
    instance.on("click", handler);
    return () => {
      instance.off("click", handler);
    };
  }, [readOnly]);

  useEffect(() => {
    const layer = overlay.current;
    if (!layer) return;
    layer.clearLayers();
    for (const zone of zones) {
      const label = document.createElement("span");
      label.textContent = zone.name;
      L.circle([zone.lat, zone.lng], {
        radius: zone.radius,
        color: "#e8b35e",
        weight: 1,
        fillOpacity: 0.07,
        bubblingMouseEvents: false,
      })
        .bindTooltip(label)
        .addTo(layer);
    }
  }, [zones]);

  return (
    <div
      ref={host}
      className="mission-map"
      aria-label={t("prep.scenario.location")}
    />
  );
}
