import { project3D, type Vec3 } from "./spatial";
export function SpatialAssembly({
  time,
  progress = 0,
  mode = "Geometry",
}: {
  time: number;
  progress?: number;
  mode?: string;
}) {
  const drift: Vec3 = [
    Math.sin(time * 0.45) * 32,
    Math.cos(time * 0.32) * 19,
    Math.sin(time * 0.37) * 65,
  ];
  const layers = Array.from({ length: 7 }, (_, i) => {
    const y = (i - 3) * (20 + Math.sin(progress * Math.PI) * 16);
    const points: Vec3[] = [
      [-95, y, -80],
      [95, y, -80],
      [95, y, 80],
      [-95, y, 80],
    ];
    return { i, points: points.map((p) => project3D(p, time, drift)) };
  }).sort(
    (a, b) =>
      a.points.reduce((n, p) => n + p.z, 0) -
      b.points.reduce((n, p) => n + p.z, 0),
  );
  const scanY = -100 + ((time * 0.22) % 1) * 200;
  const plane: Vec3[] = [
    [-135, scanY, -115],
    [135, scanY, -115],
    [135, scanY, 115],
    [-135, scanY, 115],
  ];
  const planePoints = plane.map((p) => project3D(p, time, drift));
  const pointsString = (ps: { x: number; y: number }[]) =>
    ps.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <svg
      viewBox="0 0 560 500"
      className="holo-svg spatial-assembly"
      aria-label="Perspective-projected 3D assembly"
    >
      <g fill="none" stroke="currentColor" opacity=".16">
        {Array.from({ length: 9 }, (_, i) => {
          const a = project3D([-220, 135, (i - 4) * 45], time * 0.15),
            b = project3D([220, 135, (i - 4) * 45], time * 0.15);
          return <path key={i} d={`M${a.x} ${a.y}L${b.x} ${b.y}`} />;
        })}
      </g>
      {layers.map(({ i, points }) => (
        <g
          key={i}
          className="assembly-layer"
          data-depth={points[0].z.toFixed(2)}
        >
          <polygon
            points={pointsString(points)}
            fill={mode === "Materials" ? "var(--accent)" : "currentColor"}
            fillOpacity={mode === "Materials" ? 0.09 : 0.018}
            stroke="currentColor"
            strokeOpacity={0.35 + (points[0].z + 180) / 600}
            strokeWidth={i === Math.floor(progress * 6) ? 2 : 1}
          />
          {points.map((p, j) => (
            <g key={j}>
              <circle cx={p.x} cy={p.y} r={2 * p.scale} fill="currentColor" />
              <path
                d={`M${p.x} ${p.y}L${points[(j + 2) % 4].x} ${points[(j + 2) % 4].y}`}
                stroke="currentColor"
                opacity={mode === "Integrity" ? 0.4 : 0.09}
              />
            </g>
          ))}
          <text
            x={points[1].x + 7}
            y={points[1].y}
            fill="currentColor"
            fontSize="7"
          >
            L0{i + 1} / {(99.1 + Math.sin(i + time * 0.4) * 0.3).toFixed(2)}
          </text>
        </g>
      ))}
      <polygon
        className="assembly-scan"
        points={pointsString(planePoints)}
        fill="var(--accent)"
        fillOpacity=".08"
        stroke="currentColor"
        strokeDasharray="3 5"
      />
      <g fill="currentColor" fontSize="9">
        <text x="22" y="30">
          VOLUMETRIC PASS / {mode.toUpperCase()}
        </text>
        <text x="22" y="451">
          X {drift[0].toFixed(2)} Y {drift[1].toFixed(2)} Z{" "}
          {drift[2].toFixed(2)}
        </text>
        <text x="22" y="470">
          PERSPECTIVE / DEPTH SORT / 07 SLICES
        </text>
      </g>
    </svg>
  );
}
