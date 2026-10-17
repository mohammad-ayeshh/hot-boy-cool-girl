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

## Layout
| Folder | Purpose |
|---|---|
| `src/engine/` | Loop, input, collision, device helpers (audio, haptics, wake lock, fullscreen) |
| `src/game/` | Players, hazards, buttons, platforms, doors, gems: the game rules |
| `src/net/` | Rooms and room codes over WebRTC, state sync |
| `src/render/` | Particles, lighting, liquids, post effects |
| `src/ui/` | Menus, HUD, touch controls, styles |
| `src/levels/` | Level data |
| `public/` | Static files: manifest, icons |
