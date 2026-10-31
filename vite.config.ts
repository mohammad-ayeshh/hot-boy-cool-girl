import { defineConfig, type Plugin } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Build time: both phones compare it, so friends never play on mismatched versions (design doc 13.6).
const BUILD = Date.now();

/** Writes version.json next to the game; the website checks it to offer "New version available" (16.7). */
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ v: BUILD }) });
  },
});

// base must match the GitHub Pages repo path: https://<user>.github.io/hot-boy-cool-girl/
// `vite --mode http` serves plain HTTP for desktop-only testing (localhost is already a secure context).
// `vite build --mode app` builds for the store app (Capacitor), which serves the game from its own root.
export default defineConfig(({ mode }) => ({
  base: mode === 'app' ? './' : '/hot-boy-cool-girl/',
  plugins: [versionFile(), ...(mode === 'http' || mode === 'app' ? [] : [basicSsl()])], // self-signed HTTPS so phones get a secure context
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  define: { __BUILD__: JSON.stringify(BUILD) },
}));
