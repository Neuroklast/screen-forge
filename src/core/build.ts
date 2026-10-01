// Build/runtime identity. The id is injected at build time by the Vite config
// (`__SCREENFORGE_BUILD__`), written to `dist/build.json` for the exercise
// server, and compared with the server's id on every control connection. A
// control surface on a stale or incompatible build must not continue silently.
export type BuildInfo = {
  id: string;
  commit: string;
  builtAt: string;
  version: string;
  protocol: number;
};

declare const __SCREENFORGE_BUILD__: BuildInfo | undefined;

const DEV_BUILD: BuildInfo = {
  id: "dev",
  commit: "dev",
  builtAt: "",
  version: "0.0.0",
  protocol: 0,
};

export const buildInfo: BuildInfo =
  typeof __SCREENFORGE_BUILD__ === "object" && __SCREENFORGE_BUILD__
    ? __SCREENFORGE_BUILD__
    : DEV_BUILD;

export type ServerBuild = { id?: string | null; protocol?: number | null };

// Dev builds and older servers without an identity are treated as compatible so
// local development and field devices are never blocked by the identity gate.
export function buildsCompatible(
  client: BuildInfo,
  server: ServerBuild | null | undefined,
): boolean {
  if (!server?.id || !server.protocol) return true;
  if (client.id === "dev" || server.id === "dev") return true;
  return client.id === server.id && client.protocol === server.protocol;
}
