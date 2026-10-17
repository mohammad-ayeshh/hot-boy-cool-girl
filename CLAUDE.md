# Hot Boy & Cool Girl

Online 2-player co-op puzzle platformer for phone browsers (TypeScript + Vite + PixiJS v8 + PeerJS, deployed to GitHub Pages).

## Read first
- **`docs/GAME_DESIGN.md`** is the source of truth for all game design. Read it before implementing anything gameplay- or visual-related.
- Never implement something that breaks a design pillar or hard limit in that doc. If a request conflicts with it, point that out first.
- Items marked 💬 or ❓ in the doc are not decided yet: discuss them with the user before building.
- When a design decision is made in conversation, record it in the doc (the relevant section plus the decision log).

## Code notes
- Keep `src/game/` free of TypeScript-only runtime syntax (no parameter properties or enums), so Node can run it directly for `tools/` checks.
- New Feel Lab settings go in the `DEFS` list in `src/game/settings.ts`; the panel builds itself from it.

## The owner
The owner is new to game design and game development: explain choices in plain language and recommend one option rather than listing many.

## Commands
- `npm run dev`: HTTPS dev server reachable from phones on the LAN (`https://<PC-IP>:5173/hot-boy-cool-girl/`)
- `npm run dev:http`: plain HTTP on :5174 for desktop-only testing
- `npm run build`: typecheck and production build
- `npm run check:metrics`: movement vs. level metrics (run after changing movement defaults in `src/game/settings.ts`)
- Pushing to `main` deploys to https://mohammad-ayeshh.github.io/hot-boy-cool-girl/
