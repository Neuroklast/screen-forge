import { useRef, useState, useEffect, type ReactNode } from "react";
export type Transform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};
const origin: Transform = { x: 0, y: 0, scale: 1, rotation: 0 };
export function GestureSurface({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = surface.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);
  const point = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const scale = r.width / e.currentTarget.offsetWidth;
    return { x: e.clientX / scale, y: e.clientY / scale };
  };
  const [transform, setTransform] = useState(origin);
  const current = useRef(origin);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const baseline = useRef<{
    points: { x: number; y: number }[];
    transform: Transform;
  }>({ points: [], transform: origin });
  const rebase = () => {
    baseline.current = {
      points: [...pointers.current.values()],
      transform: current.current,
    };
  };
  const commit = (t: Transform) => {
    current.current = t;
    setTransform(t);
  };
  return (
    <div
      ref={surface}
      className="gesture-surface"
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, point(e));
        rebase();
      }}
      onPointerMove={(e) => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, point(e));
        const p = [...pointers.current.values()],
          b = baseline.current,
          first = b.points[0];
        if (!first) return;
        const t = { ...b.transform };
        if (p.length === 1) {
          t.x += p[0].x - first.x;
          t.y += p[0].y - first.y;
        } else if (b.points.length >= 2) {
          const center = (a: { x: number; y: number }[]) => ({
            x: (a[0].x + a[1].x) / 2,
            y: (a[0].y + a[1].y) / 2,
          });
          const a = center(p),
            c = center(b.points);
          t.x += a.x - c.x;
          t.y += a.y - c.y;
          const distance = (a: { x: number; y: number }[]) =>
            Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y);
          t.scale = Math.max(
            0.5,
            Math.min(
              3,
              (b.transform.scale * distance(p)) /
                Math.max(1, distance(b.points)),
            ),
          );
          const angle = (a: { x: number; y: number }[]) =>
            Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x);
          let delta = angle(p) - angle(b.points);
          delta = Math.atan2(Math.sin(delta), Math.cos(delta));
          t.rotation += (delta * 180) / Math.PI;
        }
        t.x = Math.max(-450, Math.min(450, t.x));
        t.y = Math.max(-300, Math.min(300, t.y));
        commit(t);
      }}
      onPointerUp={(e) => {
        pointers.current.delete(e.pointerId);
        rebase();
      }}
      onPointerCancel={(e) => {
        pointers.current.delete(e.pointerId);
        rebase();
      }}
      onLostPointerCapture={(e) => {
        pointers.current.delete(e.pointerId);
        rebase();
      }}
      onWheel={(e) => {
        commit({
          ...current.current,
          scale: Math.max(
            0.5,
            Math.min(3, current.current.scale * (e.deltaY > 0 ? 0.94 : 1.06)),
          ),
        });
      }}
    >
      <div
        className="gesture-content"
        style={{
          transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
