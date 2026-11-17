# How to build an official level

A short working guide for whoever builds or remakes a level (a person or an AI helper). The rules themselves live in
`docs/GAME_DESIGN.md` (the source of truth); this page only collects what you need at the workbench.

## Where things are
- Levels: `src/game/chapter<N>.ts` (Chapter 1 in `levels.ts`). A level is a `LevelDef`: `id`, `name`, `idea`, `targetTime`, `rows` (18 strings of 32 characters), `mechs`, and optionally `seen`, `apart`, `tide`, `teamCode`, `pattern`.
- Written solutions the robot plays: `tools/routes.ts` (old levels) and `tools/routes/ch<N>.ts` (remade levels; an entry there wins over the old one).
- The mechanism types: `src/game/mechanisms.ts` (`MechDef` near the top). The robot and its solution language: `tools/sim.ts` (bottom half).

## The map
`#` stone · `.` air · `L` lava (kills Cool Girl) · `W` water (kills Hot Boy) · `P` poison (kills both) · `h` / `c` Hot Boy / Cool Girl start · `H` / `C` their doors · `r` / `b` fire / water gem (only its owner can take it).
A character stands on the bottom of its cell: `h` in row 13 stands on the floor that is row 14. x grows to the right, y grows downward; column 10 is x 10..11, its middle is 10.5. The outer ring is always stone.

## Mechanisms (`mechs`)
- `{ kind: 'button', x, y, rune }`: on only while someone stands in that cell. `{ kind: 'lever', x, y, rune }`: flips each time someone steps onto it.
- `{ kind: 'timer', x, y, rune, secs }`: a timed switch, on while stood on and for `secs` after.
- `{ kind: 'gate', x, y, w, h, rune }`: fills w × h cells while closed, slides up while its rune is powered; a closing gate crushes.
- `{ kind: 'platform', x, y, w, to: [x2, y2], rune }`: a lift, half a tile thick; travels to `to` while powered and back when not.
- `{ kind: 'crumble', x, y, w }`: a row of one-tile stones; each shakes 0.7 s when stood on, falls, and is back 5 s later.
- `{ kind: 'stone', x, y, animal }` and `{ kind: 'carving', x, y, animal, dots }`: password gates.
- Runes: `circle`, `triangle`, `square`, `star` (only these four). Everything with the same rune is linked, so a level has at most four separate links. Any mechanism may have `seen: 'fire' | 'water'` (only that player sees it; it is still real for both).
- Level switches: `apart: true` (Don't touch), `tide: { from, to, speed }` (the rising poison), `seen: [...]` (an overlay map, same size: `h` only Hot Boy sees that cell's stone, pool or gem, `c` only Cool Girl, `.` both).

## Movement, measured with the robot
- Run: about 8 tiles a second. Full jump: 3 tiles high, about 0.56 s in the air standing; a running full jump lands about 4.2 tiles further.
- Sizes that are allowed (doc 7.7): steps and ledges 1, 2 or 3 tiles high, never 4; gaps 1 to 4 tiles, never 5; 5+ high or 6+ wide means "impossible on purpose". Tunnels at least 2 tiles high. At least 5 tiles of headroom over a jump, unless the low ceiling is the point.

## The rules a level must keep (doc 16.1, read it once)
D1 both players are needed · D5 readable from the start · D6 no unfair surprises · D7 both stay busy · D8 gems guide and tempt · D10 the two doors are close together · D13 proven winnable · **D14 every level is its own room: never a copy, a mirror or an old room with something added.**
- Thumb zones (5.3): the bottom-left and bottom-right 4 × 4 tiles hold only wall or plain floor.
- A lever flips on every step-on: put it in a dead end or on a little shelf, never in a corridor.
- No pool or gap right at the mouth of a low tunnel. Mind the ceiling over a climb.
- A button in a corridor is pressed by anyone walking through. A timed switch that must be pressed at a chosen moment goes on a shelf.
- Don't touch: a leap over a friend needs a ceiling at least 5 tiles up and the friend standing still; both must be able to stand in their doors without touching.
- Different eyes: leave warn space before a hidden danger (E3; `check:custom` tests it). A hidden thing is real for both.
- A failure should kill (the level restarts by itself) rather than leave the team shut in.
- The tide: both bottom 4 × 4 corners solid, doors above the tide's top, speed set so the robot loses at about 1.5× (doc 16.7).
- The Trials (Chapters 10–13) are built to "What HARD means" in doc 16.7.

## The solution language (`tools/sim.ts`)
A solution is `{ fire: [...], water: [...] }` (Hot Boy, Cool Girl): two lists of commands that run side by side.
- `to(x)` walk to x and stop · `jump(x)` full jump steering to x · `jump(x, { at: a })` run and take off once past a · `jump(x, { hold: s })` a lower jump.
- `pause(s)` · `until('words', (w) => test)` wait; inside the test use `w.body.fire.x`, `w.body.water.y`, `w.time`, `w.mech...`.
- `say('flag')` / `heard('flag')`: one tells, the other waits for it. `gateOpen(i)`, `gateShut(i)`, `platAt(i, 0 | 1)`: wait for the i-th gate or lift (counted among gates, or among lifts, in `mechs` order).
- A level with timed switches or a tide writes its solution as a function, `() => ({ fire: [...], water: [...] })`: the robot plays it twice, the second time with every clock 0.5 s shorter and the tide 1.25× faster.
- A character's y is where its feet are: standing on the floor that is row 14 means y = 14.

## The workbench
- `node tools/level_lab.ts <id> -m`: the map with a ruler and the mechanisms drawn in. Look at it after every change to the rows: most mistakes are a row that is one character short or a mechanism one cell off.
- `node tools/level_lab.ts <id>`: play the solution; it says who died where, or the time and gems. Add `-v 40` for the last 40 trace lines (never print a whole trace), `-p` to probe the spare room (tide multiplier, clocks, a late start).
- `node tools/route_check.ts <id> [<id> ...]`: the official proof (D13). Every gem must be collected.
- `node tools/unique_check.ts <id> [<id> ...] --all`: each level's closest other level (D14). 80% fails; aim under 70%.
- `node tools/custom_check.ts 2>&1 | grep -i fail`: the level checker (thumb zones, warn space, tide corners…).
- `python tools/level_sheet.py <N> docs/levels/chapter<N>.png`: the chapter's picture for the doc.
- `npx tsc --noEmit`: types.

## A way of working that goes well
1. Write the idea in two lines first: the shape of the room, and what each player must do for the other, in order.
2. Draw the room on the 32 × 18 grid; check it with `-m`.
3. Write the solution a few commands at a time and play it after each addition; read where the robot ends up (`-v 12`) rather than guessing coordinates.
4. When it wins with all gems: `unique_check`, `custom_check`, then the name, `idea` and `targetTime` (about 2.5–3× the robot's time).
5. Finish one level completely before starting the next, so the chapter file always passes.
