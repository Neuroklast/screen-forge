export function luminance(hex: string) {
  const n = Number.parseInt(hex.replace("#", "").slice(0, 6), 16);
  if (!Number.isFinite(n)) return 0;
  const to = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = to(n >> 16),
    g = to((n >> 8) & 255),
    b = to(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const l1 = luminance(a),
    l2 = luminance(b);
  const hi = Math.max(l1, l2),
    lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
export function onAccent(hex: string) {
  return luminance(hex) > 0.55 ? "#111111" : "#f5f5f5";
}
