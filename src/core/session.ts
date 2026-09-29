export const roles = ["film", "trainer", "hq", "element"] as const;
export type Role = (typeof roles)[number];
export function sessionFromSearch(search = "") {
  const q = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = q.get("role") ?? "";
  const role: Role =
    raw === "trainer" || raw === "hq" || raw === "element" ? raw : "film";
  return {
    role,
    station: (q.get("station") || "").slice(0, 40),
    room: (q.get("room") || "default").slice(0, 40),
    kiosk: q.has("kiosk"),
  };
}
export function stationUrl(
  origin: string,
  room: string,
  role: Exclude<Role, "film">,
  station = "",
) {
  const q = new URLSearchParams({ role, room });
  if (station) q.set("station", station);
  if (role === "element" || role === "hq") q.set("kiosk", "1");
  return `${origin}/?${q}`;
}
