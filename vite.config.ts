import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'prompt', injectRegister: 'auto', manifest: { name: 'ScreenForge', short_name: 'ScreenForge', description: 'Film playback and exercise stations', start_url: '/?role=element', scope: '/', display: 'standalone', background_color: '#0c1117', theme_color: '#0c1117', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }, workbox: { globPatterns: ['**/*.{js,css,html,woff2,svg}'], maximumFileSizeToCacheInBytes: 4000000, navigateFallbackDenylist: [/^\/exercise/, /^\/health/], runtimeCaching: [] } })],
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: { '/exercise': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: false } } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/exercise': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: false } } },
});
