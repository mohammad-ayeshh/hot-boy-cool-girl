# Hot Boy & Cool Girl

Online 2-player co-op puzzle platformer for phone browsers (TypeScript + Vite + PixiJS v8 + PeerJS, deployed to GitHub Pages).

## Read first
- **`docs/GAME_DESIGN.md`** is the source of truth for all game design. Read it before implementing anything gameplay- or visual-related.
- Never implement something that breaks a design pillar or hard limit in that doc. If a request conflicts with it, point that out first.
- Items marked 💬 or ❓ in the doc are not decided yet: discuss them with the user before building.
- When a design decision is made in conversation, record it in the doc (the relevant section plus the decision log).
- Money and marketing plans live in `docs/MARKETING.md`. Ideas for future chapters are in doc 16.7.

## Code notes
- Keep `src/game/` free of TypeScript-only runtime syntax (no parameter properties or enums), so Node can run it directly for `tools/` checks.
- New Feel Lab settings go in the `DEFS` list in `src/game/settings.ts`; the panel builds itself from it.
- Official levels: Chapter 1 is in `src/game/levels.ts`, Chapters 2–6 in `src/game/chapterN.ts`; register a new chapter in `CHAPTERS`. Draw a chapter for the doc with `python tools/level_sheet.py <n> docs/levels/chapter<n>.png`.
- Different eyes (doc 16.7): a level's optional `seen` overlay map (`h`/`c` = only Hot Boy / only Cool Girl sees that cell) plus `seen` on a mechanism. Hidden things stay real in physics and in `tools/sim.ts`; only drawing and sound change. `Stage.setViewer()` picks whose eyes a phone sees with (null = everything, as in the Feel Lab and designer).
- Password gates (doc 16.7): `stone` and `carving` mechanisms plus a level `pattern` (in `mechanisms.ts`). Official password levels set `teamCode` (the chapter number): carvings take the team code's animal for their dots, and the pattern becomes the code (`withCode()` in `levels.ts`). Team codes live in `src/game/teamCode.ts`; the host settles them in the room. The route robot plays them with `TEST_CODE` (`tools/routes.ts`), and 6-5 also with many codes via `vaultRoute()`. Symbol stones go on their own shelves (doc 16.1).
- Feel Lab test rooms: `?lab=vault` (stones and carvings), `?lab=<level id>` (any official level, with a random team code).
- Level designer (doc 16.3): a homemade level's ✅ is set **only** in `verifyTogether()` in `src/online/game.ts` (an online 2-player finish). Never add another path that verifies.

## The owner
The owner is new to game design and game development: explain choices in plain language and recommend one option rather than listing many.

## Commands
- `npm run dev`: HTTPS dev server reachable from phones on the LAN (`https://<PC-IP>:5173/hot-boy-cool-girl/`)
- `npm run dev:http`: plain HTTP on :5174 for desktop-only testing
- `npm run build`: typecheck and production build
- `npm run check:metrics`: movement vs. level metrics (run after changing movement defaults in `src/game/settings.ts`)
- `npm run check:custom`: level designer data (share links, fingerprint, level checker; every official level must pass the checker)
- `npm run check:routes`: plays every official level with its written solution in `tools/routes.ts` using the real physics (`tools/sim.ts`). A new or changed level needs a solution that passes (doc 16.1 D13). `npm run check:routes -- 2-3 -v` traces one level
- Pushing to `main` deploys to https://mohammad-ayeshh.github.io/hot-boy-cool-girl/
