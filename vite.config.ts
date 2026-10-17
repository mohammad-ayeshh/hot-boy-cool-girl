import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// base must match the GitHub Pages repo path: https://<user>.github.io/hot-boy-cool-girl/
// `vite --mode http` serves plain HTTP for desktop-only testing (localhost is already a secure context).
export default defineConfig(({ mode }) => ({
  base: '/hot-boy-cool-girl/',
  plugins: mode === 'http' ? [] : [basicSsl()], // self-signed HTTPS so phones get a secure context (PWA, wake lock, fullscreen)
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
}));
