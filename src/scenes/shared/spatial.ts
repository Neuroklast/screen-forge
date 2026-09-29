export type Vec3 = [number, number, number];
export function project3D(
  [x, y, z]: Vec3,
  time: number,
  offset: Vec3 = [0, 0, 0],
) {
  const yaw = time * 0.28,
    pitch = 0.35 + Math.sin(time * 0.23) * 0.3;
  const rx = x * Math.cos(yaw) - z * Math.sin(yaw),
    rz = x * Math.sin(yaw) + z * Math.cos(yaw);
  const ry = y * Math.cos(pitch) - rz * Math.sin(pitch),
    depth = y * Math.sin(pitch) + rz * Math.cos(pitch) + offset[2];
  const perspective = 650 / (650 - depth);
  return {
    x: 280 + (rx + offset[0]) * perspective,
    y: 235 + (ry + offset[1]) * perspective,
    z: depth,
    scale: perspective,
  };
}
export function trackPoint(time: number, id = 0) {
  const t = time + id * 11;
  return {
    x: 400 + Math.sin(t * 0.38) * 215 + Math.sin(t * 0.91) * 32,
    y: 240 + Math.cos(t * 0.29) * 125 + Math.sin(t * 0.64) * 28,
  };
}
export function trackTelemetry(time: number, id = 0) {
  const p = trackPoint(time, id),
    next = trackPoint(time + 0.02, id);
  return {
    ...p,
    speed: (Math.hypot(next.x - p.x, next.y - p.y) / 0.02) * 0.42,
    heading:
      ((Math.atan2(next.x - p.x, -(next.y - p.y)) * 180) / Math.PI + 360) % 360,
  };
}
