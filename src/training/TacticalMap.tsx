import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTraining } from '../core/useExercise';
export function TacticalMap() {
  const { state } = useTraining(), host = useRef<HTMLDivElement>(null), map = useRef<L.Map | null>(null), overlay = useRef<L.LayerGroup | null>(null);
  const area = state.scenario.map, mode = state.scenario.mode;
  useEffect(() => {
    if (!host.current) return;
    const m = L.map(host.current, { attributionControl: true }).setView([area.lat, area.lng], area.zoom);
    map.current = m; overlay.current = L.layerGroup().addTo(m);
    const resize = new ResizeObserver(() => m.invalidateSize()); resize.observe(host.current);
    return () => { resize.disconnect(); m.remove(); map.current = null; };
  }, []);
  useEffect(() => { map.current?.setView([area.lat, area.lng], area.zoom); }, [area.lat, area.lng, area.zoom]);
  useEffect(() => {
    const m = map.current; if (!m || mode !== 'LIVE' || !area.tiles) return;
    // Attribution is user text, never interpreted as markup.
    const escaped = area.attribution.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const layer = L.tileLayer(area.tiles, { maxZoom: 19, attribution: `${escaped} | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>` }).addTo(m);
    return () => { m.removeLayer(layer); };
  }, [area.tiles, area.attribution, mode]);
  useEffect(() => {
    const layer = overlay.current; if (!layer) return;
    const render = () => {
      layer.clearLayers();
      for (const z of state.scenario.zones) { const label = document.createElement('span'); label.textContent = z.name; L.circle([z.lat, z.lng], { radius: z.radius, color: '#e8b35e', weight: 1, fillOpacity: .07 }).bindTooltip(label).addTo(layer); }
      for (const [id, p] of Object.entries(state.positions)) {
        const station = state.scenario.stations.find(s => s.id === id), age = Math.max(0, Math.floor((Date.now() - p.timestamp) / 1000)), lost = age > 10;
        const label = document.createElement('span'); label.textContent = `${station?.name || id} · ${lost ? `SIG_LOST ${age}s` : `${Math.round(p.accuracy)} m`}`;
        L.circleMarker([p.lat, p.lng], { radius: 7, weight: 2, color: lost ? '#9299a1' : '#73e9be', fillOpacity: .8 }).bindTooltip(label, { permanent: true, direction: 'right' }).addTo(layer);
        if (p.accuracy > 0) L.circle([p.lat, p.lng], { radius: p.accuracy, stroke: false, fillColor: '#73e9be', fillOpacity: .08 }).addTo(layer);
      }
    };
    render(); const timer = setInterval(render, 1000); return () => clearInterval(timer);
  }, [state.positions, state.scenario.zones, state.scenario.stations]);
  return <div className="tactical-map-wrap"><div ref={host} className="tactical-map" aria-label="Einsatzkarte" /><span className="map-mode">{mode === 'PLAYBACK' ? 'PLAYBACK · simulierte Positionen · keine Online-Karten' : 'LIVE · OpenStreetMap / XYZ'}</span></div>;
}
