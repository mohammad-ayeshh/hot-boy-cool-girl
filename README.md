# Hot Boy & Cool Girl

Online co-op temple puzzle platformer for two phones (Android + iPhone), inspired by the classic Flash-era elemental co-op games.

**Play:** https://mohammad-ayeshh.github.io/hot-boy-cool-girl/

## Stack
- TypeScript + Vite
- PixiJS v8 (WebGL rendering, additive particles)
- PeerJS / WebRTC (peer-to-peer, no game server)
- PWA (Add to Home Screen → fullscreen landscape), hosted on GitHub Pages

## Develop
```bash
npm install
npm run dev
```
On your phone (same Wi-Fi), open `https://<PC-IP>:5173/hot-boy-cool-girl/` and accept the self-signed certificate warning once.

Pushing to `main` deploys automatically through `.github/workflows/deploy.yml`.

## Pages
- `/hot-boy-cool-girl/`: the **Feel Lab**, a test room with both characters and an on-phone panel for every game-feel effect (design doc 8.1)
- `/hot-boy-cool-girl/?test`: the device and network smoke test

## Checks
- `npm run build`: typecheck and production build
- `npm run check:metrics`: runs the real movement physics in the metrics room and checks the level rules (design doc 7.7)

## Layout
| Folder | Purpose |
|---|---|
| `src/engine/` | Loop, input, collision, device helpers (audio, haptics, wake lock, fullscreen) |
| `src/game/` | Players, hazards, buttons, platforms, doors, gems: the game rules |
| `src/net/` | Rooms and room codes over WebRTC, state sync |
| `src/render/` | Particles, lighting, liquids, post effects |
| `src/ui/` | Menus, HUD, touch controls, styles |
| `src/levels/` | Level data |
| `src/lab/` | The Feel Lab scene and its settings panel |
| `tools/` | Level sketch renderer, metrics check |
| `public/` | Static files: manifest, icons |
