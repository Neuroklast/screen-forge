import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { PROTOCOL } from './src/core/protocol.ts';

// Every build gets a unique identity (commit + timestamp + protocol). It is
// injected into the client, written to dist/build.json and served by the
// exercise server so a stale control client can be detected and blocked.
type BuildInfo = {
  id: string;
  commit: string;
  builtAt: string;
  version: string;
  protocol: number;
};

function buildIdentity(): BuildInfo {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    /* not a git checkout */
  }
  let version = '0.0.0';
  try {
    version = JSON.parse(
      readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
    ).version;
  } catch {
    /* keep default */
  }
  const builtAt = new Date().toISOString();
  return { id: `${commit.slice(0, 12)}-${builtAt}`, commit, builtAt, version, protocol: PROTOCOL };
}

function buildManifest(info: BuildInfo): Plugin {
  let outDir = resolve(process.cwd(), 'dist');
  return {
    name: 'screenforge-build-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      writeFileSync(resolve(outDir, 'build.json'), JSON.stringify(info, null, 2));
    },
  };
}

const pwa = () =>
  VitePWA({
    // Field/output shells self-update. Control surfaces never register a worker
    // (see src/main.tsx) so they can never run a stale cached app shell.
    registerType: 'autoUpdate',
    injectRegister: null,
    manifest: {
      name: 'ScreenForge',
      short_name: 'ScreenForge',
      description: 'Film playback and exercise stations',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0c1117',
      theme_color: '#0c1117',
      icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2,svg}'],
      maximumFileSizeToCacheInBytes: 4000000,
      navigateFallbackDenylist: [/^\/exercise/, /^\/health/, /^\/version/],
      runtimeCaching: [],
    },
  });

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const info = buildIdentity();
  const injected = isBuild
    ? info
    : { ...info, id: 'dev', commit: 'dev', builtAt: '' };
  return {
    define: { __SCREENFORGE_BUILD__: JSON.stringify(injected) },
    plugins: [react(), pwa(), buildManifest(info)],
    base: './',
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: {
        '/exercise': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: false },
        '/health': { target: 'http://127.0.0.1:8787', changeOrigin: false },
        '/version': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
      proxy: {
        '/exercise': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: false },
        '/health': { target: 'http://127.0.0.1:8787', changeOrigin: false },
        '/version': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      },
    },
  };
});
