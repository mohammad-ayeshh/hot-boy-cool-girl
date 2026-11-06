# Hot Boy & Cool Girl

Online 2-player co-op puzzle platformer for phone browsers (TypeScript + Vite + PixiJS v8 + PeerJS, deployed to GitHub Pages).

## Read first
- **`docs/GAME_DESIGN.md`** is the source of truth for all game design. Read it before implementing anything gameplay- or visual-related.
- Never implement something that breaks a design pillar or hard limit in that doc. If a request conflicts with it, point that out first.
- Items marked 💬 or ❓ in the doc are not decided yet: discuss them with the user before building.
- When a design decision is made in conversation, record it in the doc (the relevant section plus the decision log).
- Money and marketing plans live in `docs/MARKETING.md`. Ideas for future chapters are in doc 16.7.
- Marketing skills (coreyhaines31/marketingskills, MIT) are installed in `.claude/skills/`. They all read `.agents/product-marketing.md` first: keep it in step with `docs/MARKETING.md`, never invent metrics or quotes there, and don't spend money or publish anything without the owner's yes.

## Code notes
- Keep `src/game/` free of TypeScript-only runtime syntax (no parameter properties or enums), so Node can run it directly for `tools/` checks.
- Chapter themes (doc 9.3): each chapter's background colors and scenery are in `src/render/themes.ts`, drawn by `src/render/world.ts`. A level gets its chapter's look through `LevelData.theme` (set by `levelData()`); homemade levels use Chapter 1's. Scenery stays dark and muted and never uses the gameplay colors. Each chapter's tune is in `TUNES` in `src/engine/music.ts` (the stage calls `music.setChapter()`); gem and stone notes follow the playing tune's scale.
- New Feel Lab settings go in the `DEFS` list in `src/game/settings.ts`; the panel builds itself from it.
- Official levels: Chapter 1 is in `src/game/levels.ts`, Chapters 2–9 in `src/game/chapterN.ts`; register a new chapter in `CHAPTERS`. Draw a chapter for the doc with `python tools/level_sheet.py <n> docs/levels/chapter<n>.png`.
- Different eyes (doc 16.7): a level's optional `seen` overlay map (`h`/`c` = only Hot Boy / only Cool Girl sees that cell) plus `seen` on a mechanism. Hidden things stay real in physics and in `tools/sim.ts`; only drawing and sound change. `Stage.setViewer()` picks whose eyes a phone sees with (null = everything, as in the Feel Lab and designer).
- Password gates (doc 16.7): `stone` and `carving` mechanisms plus a level `pattern` (in `mechanisms.ts`). Official password levels set `teamCode` (the chapter number): carvings take the team code's animal for their dots, and the pattern becomes the code (`withCode()` in `levels.ts`). Team codes live in `src/game/teamCode.ts`; the host settles them in the room. The route robot plays them with `TEST_CODE` (`tools/routes.ts`), and the vaults (6-5, 7-5, 9-5) also with many codes via `CODE_ROUTES`. Chapter 7 (doc 16.10) mixes both: carvings and vault stones with `seen`. Symbol stones go on their own shelves (doc 16.1).
- Don't touch (doc 16.7, T1–T4; Chapter 8 and 9-2…9-5): a level sets `apart`; `touching()` in `src/game/body.ts` is the clear-overlap test for the game and `tools/sim.ts`. Online, each phone reports its own sighting with a `touch` message and bursts only when both phones saw one (`localTouch` hook in `src/play/stage.ts`, handled in `src/online/game.ts`). The level designer doesn't have it yet (T4).
- Feel Lab test rooms: `?lab=vault` (stones and carvings), `?lab=<level id>` (any official level, with a random team code).
- Selling (doc 12.6): free/paid rules, `PAYWALL_LIVE` and the product ID are in `src/game/unlock.ts`; the Google Play purchase is `src/shop/billing.ts` (only active in the app). Player sound/vibration choices: `src/game/prefs.ts`. Friends must share the same play version (`src/game/version.ts`): bump `PROTOCOL` when the messages between phones change.
- Links and store asks (docs/MARKETING_PLAN.md): `src/game/links.ts` has the website address (`WEB_URL`; every shared link uses it, since the app's own address is `https://localhost/`), the store link with a `utm_source` tag, and `SUPPORT_EMAIL` (empty = no feedback link). `src/shop/review.ts` asks Google Play for a rating after a chapter's last level (app only, at most once a month). The link preview is in `index.html` with `public/share-card.jpg`; the about/press page is `public/about.html` with images in `public/press/` (both made by `tools/store_assets.py`).
- Android app (Capacitor, `android/`): `npm run app:sync` builds the game into `dist-app/` and copies it in; release steps are in `docs/RELEASE_ANDROID.md`. Store images: `python tools/store_assets.py docs/store/raw docs/store`.
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
