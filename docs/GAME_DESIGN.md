# Hot Boy & Cool Girl: Game Design Document

This is the single source of truth for **what** we're building and **why**.
We decide things here first and implement them second. When code and this doc disagree, the doc wins (or we update the doc on purpose).

**Status labels**
- 🔒 **Locked**: decided. Don't change without a deliberate discussion.
- 💬 **Proposed**: draft, waiting for agreement.
- ❓ **Open**: not discussed yet.

---

## 1. The game in one sentence 🔒
A two-player **online co-op puzzle platformer for phones**: a fire boy and a water girl work together to get through a dark jungle temple, where each is safe in their own element and in danger in the other's.

## 2. Design pillars (principles we never break) 🔒
*Locked 2026-10-17.*
Every feature, level and screen must pass all of these. If an idea breaks a pillar, the idea changes, not the pillar.

### P1. Together or not at all
Every level needs **both** players to finish. Neither can win alone, and the puzzles are built around helping each other. If a level can be solved by one player while the other waits, it's a bad level.

### P2. Readable at a glance
On a small phone screen you always know, instantly: **what can kill you, what is yours, and what you can interact with.** A player should never die and think "what killed me?"
→ This is what the color rules (section 4) are for.

### P3. Feels great in your hands
Controls respond instantly. Jumping and moving feel tight and fair. When you fail, it feels like **your** mistake, never the game's.
→ Use the standard platformer techniques (coyote time, jump buffering and so on), and keep the frame rate smooth.

### P4. Alive and juicy
Every action gets a response: particles, light, sound and vibration. The temple reacts to the players. Nothing important happens silently.

### P5. Friends playing in 30 seconds
From opening the link to playing together in **under 30 seconds**: no accounts, no downloads, no ads. Levels are short (about 1–5 minutes) and restarting is instant.

### P6. Your character is always yours
Online lag must **never** make your own character feel slow. Your character responds on your screen right away; the network only affects how you see your partner.

## 3. Hard limits (non-negotiable constraints) 🔒
*Locked 2026-10-17.*
| # | Limit |
|---|---|
| L1 | Runs in the phone browser on **Android and iPhone**, in **landscape**. Can be added to the home screen. |
| L2 | **$0** running cost. No paid servers. |
| L3 | **Online 2-player only**: one player per phone, no same-device mode. |
| L4 | **Original** names, characters, art and sounds. Nothing copied from Fireboy & Watergirl. |
| L5 | Performance: **120 fps on the Galaxy S23 Ultra**, at least **60 fps** on an average phone. |
| L6 | Playable with **two thumbs only**. Nothing important is hidden under thumbs, the camera notch or rounded corners. |

## 4. Color rules 🔒
*Decided 2026-10-17.*

### 4.1 Principles
1. **Only important things get bright color.** The world is dark, low-saturation and slightly cool. Characters, hazards, gems, doors and mechanisms are bright and glow.
2. **Each color has one meaning, everywhere**, in levels, effects and UI alike.
3. **Never rely on color alone.** Every hazard and every owned object also has its own shape, motion or symbol (so the game works for colorblind players).
4. **Light tells the story.** The temple is dark; each character carries their own colored light.

### 4.2 Meaning of colors
| Color | Meaning | Examples |
|---|---|---|
| 🟧 **Orange** | Hot Boy's things | Hot Boy, lava (safe for him, deadly to Cool Girl), his gems, his door |
| 🟦 **Cyan blue** | Cool Girl's things | Cool Girl, water (safe for her, deadly to Hot Boy), her gems, her door |
| 🟪 **Violet** | **Danger to everyone.** Any hazard that hurts both players is violet. | Poison pools, and any future shared hazards (spikes, traps, enemies) |
| 🟨 **Gold / brass** | Shared and interactive | Buttons, levers, moving platforms, shared gems, UI highlights |
| ⬛ **Dark slate, muted moss** | The world (never interactive) | Walls, floors, background, decoration |

### 4.3 Palette
| Group | Core (lightest) | Bright | Main | Deep |
|---|---|---|---|---|
| Hot Boy | `#FFF0C2` | `#FFB02E` | `#FF6A1A` | `#B8320C` |
| Cool Girl | `#E4FAFF` | `#7ADFFF` | `#1FA3FF` | `#0B57C9` |
| Danger (violet) | `#F2D4FF` | `#D17BFF` | `#A23BE8` | `#4E1677` |
| Shared / mechanisms | `#F1E6C8` (ivory) | `#E3B04B` (brass) | `#D9A441` (rune gold) | — |

| World | Hex |
|---|---|
| Abyss (deepest background) | `#0A1211` |
| Back wall | `#16211F` |
| Stone | `#2E3D39` |
| Stone edge / highlight | `#55695F` |
| Moss (decoration only) | `#4A5A3C` |

### 4.4 How the hazards differ besides color
| Hazard | Surface motion | Particles | Brightness |
|---|---|---|---|
| Lava | slow, heavy waves | rising embers | bright |
| Water | quick ripples | small bubbles and droplets | bright |
| Poison | thick, sluggish goo | popping bubbles, faint fumes | **darker body**, bright bubbles |

---

## 5. Screen and camera 🔒
*Locked 2026-10-17.*

### 5.1 One level = one screen
The **whole level is always visible**. No scrolling camera. Both players can always see each other and the whole puzzle, which makes co-op planning easy (P1, P2).

### 5.2 Level size 🔒
- Levels are built on a grid of **32 × 18 tiles** (16:9 shape, the shape of most phone screens).
- The level is scaled to **fill the screen height**. On the S23 Ultra a tile is about 22 screen points and a character about 1 tile wide and 1.5 tiles tall.
- **Wider phones** (S23, iPhones are about 19.5:9) get extra space on the left and right. We fill it with temple decoration, and that is where the thumbs rest.
- **Squarer screens** (tablets) get decorated bands at the top and bottom.

### 5.3 Thumb zones (level design rule) 🔒
On 16:9 phones the thumbs cover the bottom-left and bottom-right corners of the level. **The bottom-left and bottom-right 4 × 4 tile areas of every level contain no gems, buttons, levers, doors or hazard edges**: only solid wall or simple floor.

## 6. Controls 🔒
*Locked 2026-10-17.*

### 6.1 Only three actions
Like the original: **left, right, jump**. Nothing else is needed during play. Buttons, levers, boxes and doors all work by walking into them or standing on them.

### 6.2 Touch layout (recommended)
| Side | Zone | How it works |
|---|---|---|
| Left thumb | **Move zone** (left ~40% of the screen) | Put your thumb down **anywhere** in the zone and **slide left or right** from that spot to walk. A small ring appears under your thumb. Lift to stop. |
| Right thumb | **Jump zone** (right ~40% of the screen) | **Tap anywhere** in the zone to jump. **Hold longer = higher jump**, quick tap = small hop. |
| Top center | **Pause button** | Small and out of the way. Opens: resume, restart level, settings, leave room. |

**Why this layout:**
- You never have to hit a small exact button. The #1 problem with phone platformers is the thumb sliding off a button you can't see or feel.
- Walking is on/off at full speed (not like a car's gas pedal), so it is as precise as a keyboard.
- No big buttons painted over the level, so you can see the whole puzzle (P2).

### 6.3 Making it feel good (P3)
- **Dead zone:** the thumb must slide about 10 points before you start walking, so resting a thumb doesn't move you.
- **Direction flip:** sliding back past where you first touched turns you around instantly; there's no need to lift your thumb.
- **Jump buffer** 🔒: a jump tapped up to ~0.12 s *before* landing still happens.
- **Coyote time** 🔒: you can still jump for ~0.1 s *after* walking off a ledge.
- **Haptics (Android):** a light tick on jump and landing.
- On-screen hints show the zones on the first level and fade away after a few seconds of play.

### 6.4 Also supported
- **Keyboard** (PC testing): arrows or A/D to move, W, Up or Space to jump, Esc to pause.
- **Gamepad** (optional later): stick or d-pad and the A button.
- **Settings (later):** an optional "fixed buttons" layout, left-handed swap, and control size.

## 7. Characters and movement 🔒
*Locked 2026-10-17. The exact numbers in 7.5 are tuned in the Feel Lab; the level metrics in 7.7 always follow them.*

### 7.1 Same moves, different elements
Hot Boy and Cool Girl **move exactly the same**: same speed, same jump, same size. The only differences are:
- **What hurts them**: lava hurts Cool Girl, water hurts Hot Boy, violet hurts both.
- **Looks and personality**, in visuals and sound only.

*Why:* it's fair, easy to learn, and makes levels much easier to design (P1, P3). The original game did the same.

### 7.2 Personality (visual only)
| | Hot Boy | Cool Girl |
|---|---|---|
| Shape | Pointy, flickering flame | Round, wobbly water drop |
| Motion | Energetic, sparks fly off him | Smooth and flowing, leaves droplets |
| Idle | Flame flickers, embers rise | Gentle wobble, ripples |
| Trail | Faint glowing embers that fade | Small wet drips that fade |
| Light | Warm orange, flickering | Cool blue, steady |

The two silhouettes are very different, so you can tell them apart without color (P2). The full art design comes in the art topic.

### 7.3 Abilities: only run and jump
- No double jump, no dash, no wall jump, no attacks. Simple like the original.
- Players **walk through each other** (no collision, no standing on each other's heads). *Why:* standing on a partner whose position is delayed by the network would feel jittery and unfair (P6).
- A player **walks normally through their own liquid**, as if it were floor (Hot Boy in lava, Cool Girl in water).

### 7.4 Hitboxes are forgiving (P3)
- A character's collision box is **slightly smaller than how they look**.
- Hazards kill only when you're **clearly inside** them, not when a pixel touches the edge.
- Rule: *close calls should be survived and feel exciting; deaths should feel deserved.*

### 7.5 Movement numbers (starting values, tuned in the Feel Lab)
Measured in tiles (1 tile ≈ the character's width).
*Updated 2026-10-17 when the Feel Lab was built:* with the first numbers (0.38 s to the top, falling 1.6× faster) a running jump cleared **6.4 tiles**, which broke the level metrics in 7.7 (a 6-tile gap must be impossible). The jump is now a bit quicker and heavier. It is still 3.5 tiles high and the run speed is unchanged. The Feel Lab panel shows these numbers live and warns with ❌ if a change breaks 7.7, and `npm run check:metrics` tests them in the metrics room.

| Property | Value | Feel |
|---|---|---|
| Run speed | 7.5 tiles/s | crosses the screen in ~4 s |
| Time to full speed | ~0.08 s | snappy but not robotic |
| Time to stop | ~0.06 s | stops where you expect |
| Max jump height (hold) | 3.5 tiles | clears a 3-tile ledge with half a tile to spare |
| Min jump height (quick tap) | ~1.2 tiles | |
| Time to top of jump | 0.30 s | *(was 0.38)* |
| Falling | 2× faster than rising *(was 1.6×)* | jumps feel weighty, not floaty |
| Apex hang | gravity halves near the top (while jump is held, speed under 1.5 tiles/s) | a moment of control at the peak |
| Max fall speed | 22 tiles/s | long falls stay readable |
| Longest gap you can jump | **4.9 tiles** (running, full jump; 5.8 using every helper perfectly) | a 4-tile gap is safe, a 6-tile gap is impossible |

### 7.6 Traversal helpers (P3)
| Helper | What it does |
|---|---|
| Coyote time 🔒 | Jump a split second after leaving a ledge |
| Jump buffer 🔒 | A jump pressed just before landing still happens |
| Ledge nudge 🔒 | If you miss a ledge top by a few pixels, you get pushed up onto it instead of sliding down |
| Head nudge 🔒 | If you jump and clip a ceiling corner by a few pixels, you slide around it instead of stopping dead |
| Small step-up 🔒 | Tiny bumps (less than ¼ tile) are walked over automatically |

### 7.7 Level metrics: the map matches the jump 🔒
*Decided 2026-10-17.* Levels are built from a small set of **standard sizes** that exactly match what the characters can do. Players learn these sizes without noticing, and then they can *read* a level at a glance: "I can make that jump" or "that's a wall" (P2, P3).

**Golden rule: every jump is either clearly possible or clearly impossible.** There are no "almost" sizes that need pixel-perfect luck.

| Shape | Standard size | Meaning |
|---|---|---|
| Small step | 1 tile high | a quick tap hop |
| Ledge | 2 tiles high | a normal jump |
| High ledge | 3 tiles high | a full (held) jump: the maximum |
| ~~4 tiles high~~ | **never used** | "almost" height = frustration |
| Wall | 5+ tiles high | clearly can't be jumped |
| Gap | 1–3 tiles | easy jump |
| Long gap | 4 tiles | running full jump: the maximum |
| ~~5 tiles~~ | **never used** | "almost" distance |
| Impossible gap | 6+ tiles | clearly needs another way |
| Tunnel height | at least 2 tiles | the character is 1.5 tiles tall |
| Ceiling above a jump | at least 5 tiles | a lower ceiling must be on purpose |

How we keep it true:
- The Feel Lab has a **metrics room** with every standard step and gap, so we tune the movement until each one feels right.
- A debug overlay can draw the **jump arc** from the character, to check levels.
- If the movement numbers ever change, this table and every level are re-checked. Later, a level checker can flag any 4-tile ledge or 5-tile gap automatically.

## 8. Game feel ("juice") 🔒
*Locked 2026-10-17. Values are tuned in the Feel Lab.*
Game feel is built **from the first prototype**. It isn't left for the end. Inspired by Sébastien Bénard's (deepnight) *Game Feel* demo, https://deepnight.net/games/game-feel/ (source: https://github.com/deepnight/gamefeel).

### 8.1 The Feel Lab
Like that demo, the first thing we build is a **Feel Lab**: one test room with both characters and a **settings panel on the phone** where every effect below can be switched **on/off** and tuned with sliders. That lets us *see and feel* the difference each effect makes, then keep the best values.

**Built 2026-10-17** (`src/lab/`), at `?lab`. The old device and network test is at `?test`.
- The room is the **metrics room** (7.7): steps of 2, 1 and 3 tiles, a 2-tile tunnel, lava, water and poison pools, gaps of 2, 3, 4 and 6 tiles, a 6-tile wall, and gems.
- One phone, no network: you control one character and tap **🔥/💧** to swap.
- **⚙️ Feel Lab** opens the panel. Every setting is generated from one list (`src/game/settings.ts`), and changed rows are highlighted in gold. Buttons: *All effects off*, *All effects on*, *Defaults*, and **Copy my values**, which copies only the changed values as text to paste back into the chat.
- The panel shows the real jump numbers live, with ✅/❌ checks against the level rules.
- Debug switches: jump-arc preview, tile grid, hitboxes, FPS, slow motion, and zoom on my character.
- Settings are saved on the phone, so they survive a reload.
- Not in the lab yet (they come with the first real level): mechanisms (button sink, platform easing, door glow), the slow-motion moment at the doors, and the level-complete effects.

### 8.2 Effect catalog
*Names in brackets are the matching deepnight demo options.*

**Movement**
- Squash and stretch on jump, land and turn [heroSquashAndStretch]
- Dust or embers puff on jump, land and turn-around [jumpFx]
- Basic animations: idle, run, jump, fall, land [basicAnimations]
- Ledge and head nudges plus puffs when they help you [cliffGrabHelper, smallStepsHelper, climbFx]
- Coyote time and jump buffer [justInTimeJump, ctrlQueue]

**Camera** (kept small, because the whole level must stay visible)
- Small shake on death, heavy landings and big doors [camShakesXY]
- Tiny camera kick on hard landings [camBumpXY]
- Very slight zoom pulse on death and level complete [camBumpZoom]

**Light and flashes**
- Each character carries their own light; liquids glow [lighting]
- White flash on a character when they die or press something [blinkImpact]
- Soft full-screen flash on death and when the level is completed [flashbang]

**World reactions**
- Liquids splash and ripple when entered; the splash color shows the element
- Element-themed deaths instead of a plain disappear [cadavers]: Hot Boy hisses into steam in water, Cool Girl boils into vapor on lava, violet hazards dissolve either one into violet sparks
- Trails that fade: embers for Hot Boy, drips for Cool Girl [a friendly version of the demo's blood/wall-burn marks]
- Buttons sink with a click, platforms ease in and out, doors glow brighter as their player gets close

**Time**
- Hit-stop: a ~0.08 s freeze on death [slowMos]
- Slow-motion moment when both players reach their doors

**Rewards**
- Gem pickup: pop, sparkle burst, and a sound whose pitch rises for quick consecutive pickups
- Level complete: both doors burst with light, and the results screen counts up

**Sound and haptics**
- Every action has a sound with slight random pitch
- Phone vibration on jump, land, death and button press (Android)

*Not used* (they don't fit our game): shooting effects, recoil, bullets, enemy knockback, and control locks after big landings (being stunned breaks P3).

---

## 9. Art direction: layered depth 🔒
*Locked 2026-10-17.*
*The full art topic comes later.* Goal: a background with **many layers of depth**, like *Hollow Knight: Silksong*, while the gameplay layer stays the clearest thing on screen (P2).

### 9.1 Layers (back to front)
| Layer | Content | Motion |
|---|---|---|
| 6. Far depths | Dark gradient, distant moonlight through cracks in the temple roof | almost still |
| 5. Distant ruins | Hazy silhouettes of giant pillars, statues and arches | very slow |
| 4. Jungle middle | Giant roots, hanging vines, broken columns | gentle sway |
| 3. Back wall | Carved stone wall with glowing runes, right behind the level | slow |
| 2. Air | Fog bands, light shafts, dust motes and fireflies at different depths | drifting |
| **1. Gameplay** | Tiles, characters, hazards, mechanisms | **sharpest, most contrast** |
| 0. Foreground | Dark blurred silhouettes of leaves, vines and pillars, **only at the screen edges and side margins** | sways, close particles |

### 9.2 Depth rules
- **Farther = hazier.** Each layer back gets less contrast, less saturation, more fog color, less detail and more blur.
- **Farther = slower.** Background motion (swaying vines, drifting fog) gets slower and smaller with depth. This creates depth even though our camera doesn't scroll.
- **Gentle parallax without scrolling.** Background layers shift a few pixels following the players' average position, so the world feels 3D while the level itself never moves.
- **Optional tilt parallax.** Tilting the phone shifts the layers slightly, like looking into a window (a setting; iPhone asks for permission).
- **The foreground never hides gameplay.** Foreground silhouettes live only at the edges and side margins, and fade out if a character goes behind them.
- **The background never steals focus.** It stays inside the dark, muted world palette (section 4.3). Bright color and glow are for the gameplay layer only.

## 10. Level building blocks 🔒
*Locked 2026-10-17 (all three sets).*
Each block follows the color rules: orange or blue = belongs to one player, violet = danger to both, gold = shared mechanism.

### 10.1 Linking mechanisms
Every button or lever and the thing it controls show the **same gold rune symbol** (circle, triangle, square, star…). You can see what controls what without trial and error, and it works without color vision (P2).

### 10.2 Set 1: the first levels
| Block | How it works |
|---|---|
| Stone | Solid floors, walls and ceilings, built to the level metrics (7.7) |
| Lava pool 🟧 | Safe for Hot Boy, deadly for Cool Girl |
| Water pool 🟦 | Safe for Cool Girl, deadly for Hot Boy |
| Poison pool 🟪 | Deadly for both |
| Gems 🟧🟦 | Each player collects only their own color |
| Exit doors 🟧🟦 | One per player. The level ends when **both** stand at their own door at the same time |
| Pressure button 🟨 | Active **only while someone stands on it**: the classic "you hold it, I go" co-op move (P1) |
| Lever 🟨 | **Flips on or off each time a character steps onto it**, from either side (changed 2026-11-10; it used to depend on the walking direction). Standing on it doesn't flip it again: step off and back on for that. It stays where you left it |
| Moving platform / elevator 🟨 | Moves while its linked button is held, or by lever position |
| Stone gate 🟨 | Slides open or closed, linked to a button or lever. **A closing gate never stops: anyone standing under it is crushed** (dies, and the level restarts for both). Even a little under its edge counts (never pushed aside, 2026-11-10); only standing right beside it is safe |

### 10.3 Set 2: once the basics work
| Block | Why later |
|---|---|
| Pushable box | Needs careful online sync (who is pushing) |
| 45° slopes | Extra physics; very much part of the original's feel |
| Elemental barriers | e.g. a fire curtain only Hot Boy can pass |
| Shared gems 🟨 | Either player can collect them |

### 10.4 Set 3: later ideas
Light beams and mirrors, wind fans, ice floors, portals, timed switches, falling blocks.
*2026-11-10:* falling blocks became **crumbling stones** and **timed switches** were built too (16.7), both for the bonus chapters ("The Trials").

## 11. Game flow 🔒
*Locked 2026-10-17.*
The path from opening the link to playing must take **under 30 seconds** (P5).

### 11.1 Screens
| Screen | What happens |
|---|---|
| **Main screen** | *(Decided 2026-11-06; was "Home".)* The title, the two characters drawn big on the left and right, and the **game modes** as carved stone tiles in the middle: **Co-op · Story** (big, first), **Level designer**, and two dimmed "Soon" tiles, **Versus race** (16.7) and **Bonus levels** (12.2). A ⚙ button opens Settings. Details below. |
| **Co-op** | An optional nickname (remembered on the device; the same one as in Settings), a big **Create room** button, and a code box with **Join room**. ← Back goes to the main screen. |
| **Settings** | Sound, music and vibration (the same choices as the pause menu), full screen, Restore my purchase, links, the version number. Details below. |
| **Invite** | The host sees the 4-letter code plus a **Share** button that sends a link like `…/hot-boy-cool-girl/?room=ABCD` through WhatsApp or any app. Opening that link **joins the room automatically**, with no typing. |
| **Lobby** | Both characters are shown; each player taps the one they want. The host starts as Hot Boy, and a **Swap** button switches roles. |
| **Level map** | A temple map with all levels; locked ones show a padlock. **Either player** can pick a level, the other sees it highlighted, and **both tap Ready** to start. |
| **Play** | The level. |
| **Results** | Time, gems and stars count up. Buttons: **Next level**, **Retry**, **Level map**. Both tap the same choice to continue. |

**Main screen details** *(decided 2026-11-06 with the owner)*
- **The character art is drawn in code** (14.1): the game's own Hot Boy and Cool Girl, about 5× bigger, Hot Boy on the left and Cool Girl on the right, both facing the middle. They get a "portrait" treatment the level never uses: **shading** (a lit side and a shadow side), a **glowing rim** in their element's color, a **soft shadow** on the stone ledge they stand on and on the wall behind, and each **lights the temple wall** around them (warm behind him, cool behind her). They stay alive: blinking, flames and embers, flowing hair, their waiting moves (14.4). **Tap Hot Boy** and he **ignites**: a tall flame shoots up from the top of his head with a burst of sparks, he pumps his fist, the blaze holds about a second and settles (2 s in all; until 2026-11-21 he jumped); **tap Cool Girl** and she flips her hair (P4). Not used: a hired painting (maybe later, for the store's feature graphic) and AI art (14.1, L4).
- **Background:** the temple area (9.3) of the **furthest chapter this phone has reached**, blurred and foggy so the characters stand out. A new player sees the jungle gate. The level itself isn't drawn behind the menu.
- **Landscape layout:** the characters fill the left and right sides (the extra width of wide phones, 5.2), the menu stays in the middle, ⛶ Full screen is top left and ⚙ Settings top right. Buttons are thumb-sized and clear of the notch and rounded corners (L6). The Co-op and Settings screens keep the same scene; only the middle panel changes.
- **Modes:** only modes the doc allows are listed. A "Soon" tile shows a short "Coming in a future update" note and nothing else. Never listed, not even as "soon": playing alone or two on one phone (L3), online leaderboards or matching with strangers (L2, 12.5).
- **Settings:** 🔊 sound, 🎵 music, two volume sliders, 📳 vibration (hidden on iPhone), the same saved choices as the pause menu (15.6, which keeps its own copy). Your name. ⛶ Full screen (hidden in the store app and the home-screen icon). **Restore my purchase** (only in the Android app once selling is on; **no Buy button**: the offer still appears only where 12.6 says). Links: About the game, Privacy policy, Send feedback (only once a support email is set). The version number in small text.
- **Music:** the calm title theme (15.4b) plays on the main, Co-op and Settings screens.

### 11.2 Flow rules
- **Main screen → Co-op → Create or Join → lobby → level map** *(decided 2026-11-06)*. The host taps twice (Co-op, Create room), still far under 30 seconds (P5). **A room link (`?room=ABCD`) skips the main screen:** it opens on the Co-op screen showing "Joining room ABCD…" and goes on to the lobby with no taps (11.1). A level link (`?level=…`) still opens the "save this level" screen, which then leads to the main screen. **Leaving a room returns to the Co-op screen**, so a new room is one tap away. The Android back button goes Co-op or Settings → main screen; on the main screen it sends the app to the background (it never closes it).
- **No tutorial screens.** The first levels *are* the tutorial: they teach by design, with short hints drawn into the level itself.
- **Chapter riddles** *(decided 2026-11-06)*. When a chapter's first level starts, a short riddle fades in at the top like a carved stone tablet, on both phones. It hints at the chapter's new idea in a mysterious way and never explains it plainly. It fades after a few seconds, or as soon as you touch the controls, and doesn't come back on a restart. The level map shows it in small text under the chapter name, so you can read it again. In Chapter 5 each player sees only **their half** of it, so the two halves have to be read out loud. Only Chapters 1–6 have one; Chapter 7 and later have none (the owner's choice).

  | Chapter | Riddle |
  |---|---|
  | 1 | *What burns one cradles the other. No door opens for one alone.* |
  | 2 | *Your key hangs in another's hand.* |
  | 3 | *The machine forgets what you only hold, and remembers what you lock.* |
  | 4 | *What lifts one lowers the other. Choose who rises first.* |
  | 5 | Hot Boy: *Not every eye is shown the same stone…* · Cool Girl: *…trust the voice beside you.* |
  | 6 | *The walls are counting. Remember what they tell you.* |
- **Dying restarts the level instantly** for both players, after the short death effect (about 1 s). No "game over" screen, no menu to click through (P5).
- **Pause doesn't freeze the game** (it's online). Your partner sees a small "partner is in the menu" icon.
- **If a player disconnects**, the other sees "Waiting for partner…", and the same room code works to rejoin. The details come in the online rules topic.

## 12. Scoring and progress 🔒
*Locked 2026-10-17.*

### 12.1 Three stars per level, earned as a team
| Star | How to earn it |
|---|---|
| ⭐ | Finish the level |
| ⭐⭐ | Finish with **all gems** collected (both players' gems) |
| ⭐⭐⭐ | Finish with all gems **and** under the target time |

- Stars belong to the **team**, never to one player (P1). Getting all the gems needs both of you.
- Each level remembers your **best** result. Stars are never lost.
- The **target time** is set by us when we design each level: our own good run plus a small margin.
- **Deaths cost nothing.** Results show a fun death counter ("💀 7"), but no penalty, because dying is part of learning a puzzle (P3, P5).

### 12.2 Unlocking levels
- Levels are grouped into **chapters** of 5 levels each (different parts of the temple). *Changed 2026-11-12 (16.7, "The road to 100 levels"): Chapters 6–12 will have 10 levels each, so the map must fit 10 level stones.* *Was "about 8"; changed 2026-10-21 so each chapter fits one map screen.* The map has a tab per chapter.
- Finishing the last level of a chapter unlocks the first level of the next one.
- **Finishing a level unlocks the next one**, with any number of stars. You never get stuck because you can't get 3 stars.
- A few **bonus levels** unlock with stars, as a reward for players who want more challenge. *Changed 2026-11-10:* the bonus levels are **The Trials** (16.7): three very hard chapters behind the "Bonus levels" tile, opened by finishing 9-5 instead of by stars.

### 12.3 Playing with different friends
- Each phone keeps **its own save**.
- When two players meet, a level is open if **either** player has unlocked it, so you can always play together straight away (P5).
- When a level is finished, the result is saved on **both** phones.

### 12.4 Saving
- Progress is saved on the phone. No accounts, no server (L2).
- ⚠️ iPhone Safari can erase a website's saved data after about 7 days without visiting. **Added to Home Screen**, the game is protected from this, so the game gently suggests installing it.
- Later: a **backup code** you can copy to move your progress to another phone.

### 12.5 Not included (on purpose)
- No online leaderboards: they need a server (L2).
- No coins, shop or ads (P5).
- *Later idea:* cosmetic rewards for stars (hats, trail colors) that never change gameplay.

### 12.6 Making money 🔒
*Proposed 2026-10-24; decided by the owner 2026-10-31.* No ads, in line with P5 and the owner's own wish.

**Free to try, pay once, and only one friend pays.**
- **Free:** Chapters 1 and 2 (10 levels) for everyone. **The level designer is free too:** shared homemade levels bring new players.
- **One purchase, $2.99,** unlocks Chapters 3–6 and every future chapter, forever (product `full_game`).
- **Friend's pass:** if **either** player in a room owns the game, the room plays every chapter. *(Planned as "when the buyer hosts"; built as "either", because the levels must open for both players whoever hosts.)*
- **Where the offer appears:** on the results screen after the last free level (2-5), and when a 🔑 level is tapped on the map. Never in the middle of a level. It always offers "Not now" and "play with a friend who owns it".
- **Payment:** Google Play Billing inside the Capacitor app (`cordova-plugin-purchase`). No server, so L2 holds; ownership is saved on the phone and restored from Google Play ("Restore my purchase"). No anti-cheat (13.6).
- **The website** becomes the free demo (Chapters 1–2) with a "Get the app on Google Play" button. **The lock stays off until the app is live** (`PAYWALL_LIVE` in `src/game/unlock.ts`), so website players don't lose levels before there's a way to buy. `?paywall` previews it.
- **Later:** iPhone (App Store), Steam, cosmetics that never change gameplay (12.5).

**Honest note:** most indie games earn little. What sells a co-op game is people inviting friends, so the free chapters and the friend's pass matter more than the price.

## 13. Online rules 🔒
*Locked 2026-10-17.*

### 13.1 Who is in charge of what
| Thing | Who decides | Why |
|---|---|---|
| **Your own character** (moving, jumping) | **Your phone** | It responds instantly, with no waiting for the network (P6) |
| **Your own death** | **Your phone** | You only die where *you* saw yourself touch the hazard, so deaths always feel fair (P2, P3) |
| **Your own gems** | **Your phone** | Gems are colored per player, so two phones can never fight over one |
| **Shared world**: buttons, levers, platforms, gates, boxes, shared gems, the timer, level start and finish | **The host's phone** (the "referee") | One phone must be the final word, so both screens always agree |

In simple words: **each player is the boss of their own character, and the host is the referee of the world.**

### 13.2 Staying in sync
- Each phone sends its character's position about **30 times per second**.
- Your partner is shown about **0.1 s in the past**, smoothly blended. That's invisible in a co-op game and removes jitter.
- **Things you touch react instantly on your screen.** If you step on a button, it presses right away; the host confirms it a moment later and corrects in the rare case of a disagreement.
- Moving platforms run on both phones from the same timing, and the host gently corrects any drift.
- The connection is **direct phone-to-phone** when possible. On strict networks (some mobile data), it goes through a free **relay server** instead.

### 13.3 Deaths and restarts
- When anyone dies, **both** phones play the death effect and the level **restarts for both** about 1 s later.
- **Either player can restart** from the pause menu at any time. The button must be **held for 1 s** to avoid accidents, and the partner sees "Cool Girl restarted the level".
- **Either player can go to the level map** from the pause menu ("Hold for the level map", also held for 1 s). Both phones go to the map, and the partner sees "Hot Boy went to the level map". *Added 2026-10-31.*
- **Hold-to-restart animation:** while held, a ring fills around the button over 1 s and the button gently shakes and brightens. Releasing early drains the ring back smoothly. When full, a small pop, a vibration and a flash confirm the restart.

### 13.4 Pause and leaving the app
- The pause menu **doesn't freeze** the game. The partner sees a small "in menu" icon over that character.
- If a player switches apps, gets a call, or locks the phone, their character stands still and the partner sees an "away" icon.

### 13.5 Disconnects
- If the connection drops, the remaining player sees **"Waiting for partner…"** and the level pauses.
- The **room code stays the same** for the whole session. When the missing player comes back (same link or code), they reconnect automatically and the **level restarts**.
- The waiting screen has a **"Leave room" button from the start**, so a player is never stuck: they can leave and join or create another room. *Changed 2026-10-31: was "after 2 minutes of waiting".*
- **Wi-Fi hiccups aren't drops.** If the friend goes silent but the phones' connection still looks alive, the game waits up to 15 s (instead of 6 s) before calling it a drop, and the signal icon turns 🔴 after 2 s of silence. Position updates are skipped (not queued) while messages pile up. *Added 2026-10-31, after drops were seen only on shared Wi-Fi.*

### 13.6 Room rules
- A room holds **exactly 2 players**. A third person sees "This room is full".
- **Same version check:** both phones must run the same **play version**: the same levels, movement physics and network messages (`src/game/version.ts`). Menus, art and sounds may differ. If not, the older one sees "Your friend has a newer version", with an update button (in the app it opens the store). *Changed 2026-10-31: was "the same build". With a store app, every website update would otherwise lock app players out of playing with website friends until the store delivers the update.*
- **No anti-cheat.** You only play with friends; we don't spend effort on it.
- **No chat or voice** in the game; friends use a phone call or Discord. *Later idea:* 4 quick signals over your character (👋 "Here!", ✋ "Wait", 👉 "Go!", 😅 "Oops").

### 13.7 Connection indicator
A small signal icon in the corner: 🟢 good (under 100 ms), 🟡 OK (100–200 ms), 🔴 laggy (over 200 ms). Tapping it shows the ping and whether you're connected directly or through the relay, plus what the last drop looked like (e.g. "same Wi-Fi, 15 s silent"), to help find network problems.

## 14. Art style 🔒
*Locked 2026-10-17. Exact shapes are refined in the game on a real phone.*
Background depth is in section 9; colors are in section 4.

### 14.1 How the art is made
| Part | Made with | Why |
|---|---|---|
| **Characters** | **Drawn in code**: PixiJS vector shapes plus particles | Perfectly smooth at any screen size, and every part can squash, stretch, blink and wobble (P4). Changes can be described in words and made in minutes. |
| **Tiles, decorations, doors, gems, mechanisms** | **SVG files** (vector drawings written by hand), turned into textures when the game loads | Crisp on every phone, tiny download, easy to edit |
| **Background layers** | SVG silhouettes plus fog and light in code | Matches the layered-depth plan (section 9) |
| **Liquids** | A **shader** (a small graphics program on the GPU) | Animated waves, a glowing surface, endless movement at almost no cost |
| **Lighting** | A light layer: dark world, each character and glowing object adds its own light | "Light tells the story" (section 4.1) |
| **Effects** | The particle system we already have | Embers, droplets, dust, sparkles |
| **Menus** | HTML and CSS, styled like temple stone and gold | Sharp text, easy layout, accessible |

**Not used:** pixel art (needs a pixel artist), AI-generated images (inconsistent style, unclear rights, breaks L4), and store-bought asset packs (they'd never match).
Everything is original and lives in the code repository, so any part can be changed or replaced by a real artist later.

### 14.2 Personality: the names are the personality
*Chosen 2026-10-17 (replaces the earlier "cute" direction).* Both names have a double meaning:
- **Hot Boy**: made of fire, and **hot-headed**.
- **Cool Girl**: made of water, and **cool-headed**.

They're an opposites duo: **he rushes in, she thinks first.** They are stylish characters with attitude, not cute ones.

| | 🔥 Hot Boy | 💧 Cool Girl |
|---|---|---|
| In one line | Hot-headed show-off with a big heart | Calm, sharp and effortlessly cool |
| Traits | Bold, impatient, loud, brave, a bit reckless | Composed, smart, stylish, a little sassy |
| Shape language | **Sharp and spiky**: triangles, broad shoulders, leans forward | **Smooth and flowing**: long curves, slim and tall, stands upright |
| Hair | Wild **crown of flame spikes** all around his head (was a swept-back mohawk until the 2026-11-21 redesign). It is **stiff**: it never trails behind him, but it flickers, **grows bigger when running or excited** and shrinks near water | Long water hair swept over one eye, **flowing behind her like a ribbon** |
| Face | Angled eyebrows, cocky grin (**no fang** since 2026-11-21) | Half-closed confident eyes, one raised eyebrow, smirk |
| Signature item | A **dark red headband** across his forehead, its two long tails flying out behind him (2026-11-21). His big moment is **ignite**: a tall flame shoots up from the top of his head (like her sunglasses dropping) | **Sunglasses** resting on her head |

### 14.3 Body
Stylized slim figures with a **big head (about half head, half body)**, arms and legs, so they can act through poses (cross arms, fist pump, hair flip). At game size they're small, so **personality comes mostly from pose and movement**, then the face.

### 14.4 Personality in motion (also helps gameplay, P2)
| Moment | 🔥 Hot Boy | 💧 Cool Girl |
|---|---|---|
| Walking | Fast and bouncy, leaning forward, embers flying | Smooth glide, no bounce, hair flowing |
| Waiting | Taps his foot, punches the air, then waves "come on!" at his partner | Hands on her hips (owner's pick 2026-11-10, was crossed arms); after a while rolls her eyes: "whenever you're ready" |
| Jumping | Explosive takeoff with a burst of sparks | Graceful arc with a small splash ring |
| Landing | Heavy stomp, sparks splash out | Soft landing with a ripple |
| **Near the deadly liquid** | **Flame shrinks and sputters**: scared but acting tough | **Starts steaming and bubbling**: the only time she loses her cool |
| Dying | Fizzles out in an angry puff of steam | Evaporates with an annoyed look |
| Level complete | Fist pump, his flames erupt like fireworks | Hair flip, **sunglasses drop onto her face** 😎 |

### 14.5 Personality details
| | 🔥 Hot Boy | 💧 Cool Girl |
|---|---|---|
| Light | **Pulses** brighter when he's excited (running, jumping) | **Steady**, with a gentle shimmer like light through water |
| Trail | Small **scorch marks** that glow and fade | A **shiny wet trail** that reflects light for a moment |
| Sounds | Fire crackles, short "hah!" grunts | Soft splashes, a cool "hm." |
| Around them | Floating embers | Floating droplets |

**Reactions to each other** at the end of a level: a high-five at the doors, or her shaking her head when he celebrates too much.

**Trailing hair and footstep fire** *(added 2026-10-17, owner's request)*:
- **Cool Girl's long water hair streams behind her** like a ribbon when she moves, with a little physics so fast moves leave a flowing streak, and drops fall from its tip.
- **Hot Boy's headband has two long tails** that trail behind him the same way, with the same kind of physics as her hair but snappier (cloth whipping in the wind), about as long as his body (shorter than her hair) and cut in a sharp V at the ends. *(2026-11-21: they replace the flame tail that rose from his old mohawk; his flame hair itself is stiff and sheds the embers.)*
- **Hot Boy leaves small flames in his footsteps** (and a few when he lands) that flicker and go out after about half a second.
All three can be switched off in the Feel Lab.

### 9.3 Chapter themes 🔒
*Decided 2026-10-31 by the owner.* **One temple, one journey:** each chapter is a different part of the same jungle temple, with its own background and its own music (15.4). Homemade levels use the Chapter 1 look.

Two rules keep the game readable (P2, 4.1):
- **Only the scenery changes.** Characters, lava, water, poison, gems, doors and mechanisms keep exactly their colors and shapes in every chapter.
- **Backgrounds stay dark and muted.** No bright orange, cyan, violet or gold in the scenery, because those colors already mean something (4.2). Background shapes never look like platforms.

| Ch | Area | Look | Music |
|---|---|---|---|
| 1 | The Temple Gate | Jungle entrance: green moss, vines, roots, fireflies, moonlight | Today's song (warm marimba and hand drums): the home theme |
| 2 | The Flooded Halls | Damp grey-green stone, water stains, falling drips, low mist | Slower and echoey, drip-like plinks |
| 3 | The Deep Machine | Bronze-brown stone, huge slow gears far behind, chains, dust | Faster, ticking clockwork drums |
| 4 | The Summit | Open night sky with stars, distant mountains, broken roof arches, wind | Wide and hopeful, airy flute pads |
| 5 | The Hall of Eyes | Pale stone carved with giant eyes that slowly blink | Mysterious, floating chimes |
| 6 | The Sealed Vault | Deep underground: great round vault doors, tall sealed niches, heavy pillars, dust | Low, heavy, ancient drums and drones |
| 7 | The Whispering Vault | Coldest and darkest: grey-blue stone, hanging rocks, pale drifting wisps | Very quiet, breathy "whisper" sounds, rare chimes |
| 8 | The Steam Halls | Dark rusty-brown stone, old pipes along the walls, slow grey steam puffs rising | A steady steam-engine "chuff", low plucks, chimes with a hiss texture *(added 2026-11-06)* |
| 9 | The Heart of the Temple | Deep dark stone with faint carvings (no animals, so nothing can be mistaken for the code), and a slow, dim pulsing glow far behind: the heart | The home theme from Chapter 1 comes back, slower and bigger, so the journey ends where it began *(added 2026-11-06)* |
| 10 ⭐ | The Crumbling Wing (the Trials, 16.7) | A collapsed wing: dusty grey-olive stone, snapped pillars with their fallen pieces beside them, cracks down the back wall, rubble heaps; thin streams of dust and a pebble now and then *(added 2026-11-10)* | Quicker than the story: a chord line that keeps stepping down, a heavy drum, low uneven plucks, short dry chimes |
| 11 ⭐ | The Hourglass Hall (the Trials) | Dry khaki stone and chains; giant hourglasses in stone frames whose sand slowly runs out and turns over; sand heaps along the floor, fine sand in the air *(added 2026-11-12)* | The fastest tune: a ticking clock, like a second hand |
| 12 ⭐ | The Rising Dark (the Trials) | The temple is sinking: very dark grey-teal stone, leaning pillars, half a fallen arch, old tide marks with dried drips high on the back wall, a low drifting mist. No violet in the scenery: the only violet is the real tide *(added 2026-11-12)* | Slow and heavy with a long echo, while the level itself hurries you |
| 13 ⭐ | The Last Trial (the Trials) | The inner sanctum: dark neutral stone, tall plain columns, and one great round window far behind whose spokes carry faint marks of every area on the way; its heart swells very slowly; fine dust rises *(added 2026-11-16)* | The home theme one last time, at full speed with the heavy drum |

Every chapter keeps the duet (15.4): only the key, speed and instruments change. The home screen and map keep today's music. Built in two steps, checked with the owner in between: backgrounds first, then music.

**Backgrounds as built (2026-10-31):** preview in [`docs/levels/themes.png`](levels/themes.png). Each chapter's colors and scenery live in `src/render/themes.ts`; the still scenery is drawn once, and the moving parts (gears, blinking eyes, fog, twinkling stars) plus a floating air layer (fireflies, drips, dust, wind, wisps) sit behind the level, so they're hidden wherever there's stone. The side margins on wide phones take the chapter's colors too. Feel Lab › World › **Living background** switches the moving parts off.
**Music as built (2026-10-31):** each chapter's tune is in `src/engine/music.ts` (`TUNES`); levels pick their chapter's tune, and the home screen, lobby and map keep Chapter 1's.

| Ch | Key and chords | Speed | Hot Boy's layer | Cool Girl's layer | Texture |
|---|---|---|---|---|---|
| 1 | A minor: Am – F – C – G | 92 | hand drums, marimba plucks | quick chime arpeggio | — |
| 2 | D minor: Dm – B♭ – F – C | 74 | soft toms, few plucks | slow chimes, long echo | water drops |
| 3 | C minor: Cm – Cm – A♭ – G | 112 | clockwork tick-tock, a repeating pluck pattern | quick chimes, short echo | — |
| 4 | D major: D – A – Bm – G | 84 | soft toms, plucks | chimes; airy flute pads | wind gusts |
| 5 | E minor drifting to C minor and B | 68 | rare drums, plucks from the chords | slow floating chimes | — |
| 6 | E Phrygian: Em – F – Em – Dm | 78 | a big, deep ancient drum, low plucks | slow chimes | — |
| 7 | F♯ minor, quieter overall | 64 | a soft pulse, rare plucks | rare long chimes, big echo | breathy whispers |
| 8 | G minor: Gm – E♭ – B♭ – F | 96 | a steam-engine "chuff" on every beat, low plucks | chimes on the beat | a steam hiss now and then |
| 9 | A minor: the home theme's chords (Am – F – C – G) | 72 | hand drums, plucks | chimes with a long echo; airy flute pads | — |
| 10 ⭐ | D minor: Dm – C – B♭ – A (stepping down) | 104 | a big, deep drum, low uneven plucks | short dry chimes, little echo | — |
| 11 ⭐ | E minor: Em – C – Am – B | 120 | clockwork tick-tock, a pluck pattern that keeps returning to one high note | chimes on the beat; airy flute pads | — |
| 12 ⭐ | B minor: Bm – G – Em – F♯ | 88 | a big, deep drum, a few low plucks | long chimes, long echo | water drops |
| 13 ⭐ | A minor: the home theme's chords (Am – F – C – G) | 112 | a big, deep drum, quick plucks | quick chimes; airy flute pads | — |

Gem notes and the symbol-stone notes follow the playing tune's scale, so they always fit the music (15.4). The tunes are first versions: the owner listens on the phone and asks for changes.

- **Changed while building:** Chapter 6 shows round vault doors and tall niches instead of the 8 animal carvings, because background animals could be mistaken for the real code carvings (P2). Floating block-shaped niches were also replaced by tall arched ones, so nothing in the background looks like a ledge.

### 14.6 The temple world
- **Stone tiles:** carved blocks with soft rounded corners, a light top edge (light from above), dark cracks. Edges join automatically ("autotiling"), so walls never look like a grid.
- **Moss and vines** on top edges and hanging down, in muted green only.
- **Liquids:** a shader surface that glows; lava heavy, water quick, poison thick (section 4.4).
- **Gems:** faceted crystals with a shine that sweeps across. The Hot Boy gem has a flame shape and the Cool Girl gem a drop shape.
- **Doors:** stone arches with the player's symbol glowing above; they glow brighter as their player gets close.
- **Mechanisms:** brass and gold with carved runes (section 10.1).
- **Font:** a rounded, friendly font such as *Fredoka* (free license), bundled with the game.

### 14.7 Silhouette test
Every character and object must be recognizable as a **plain black shape**. If two things look the same in silhouette, one of them gets redesigned (P2).

## 15. Sound and music 🔒
*Locked 2026-10-17.*

### 15.1 The most important rule: sound is a bonus, never required
Many people play on their phone **with the sound off** (and on iPhone the silent switch can mute web games). So **nothing important is told by sound alone**: every sound also has a visual (P2). Sound makes the game *feel* better (P4); it never decides whether you can play it.

### 15.2 How the sounds are made
| Kind | Made with | Why |
|---|---|---|
| Most effects (jumps, clicks, chimes, UI) | **Synthesized in code** with the phone's built-in audio engine (Web Audio) | Tiny download, every sound can vary slightly each time, easy to tweak in words |
| Organic textures (fire crackle, water lapping, stone rumble) | Code synthesis first; if that sounds too fake, **free CC0 recordings** (no credit needed, free to use) that we layer and process | Real fire and water are hard to fake well |
| Voices ("hah!", "hm.") | **Planned for later:** you and a friend record a few short sounds that we process (pitch, effects). Until then, no voices. | A personal touch |
| Music | **Composed in code** as layered loops (section 15.4). If it isn't good enough, switch to free licensed tracks (CC0 or credited CC-BY) | Matches our "everything in code" approach and has no license risk |

(L4 means nothing is taken from Fireboy & Watergirl. Free-license library sounds are allowed.)

### 15.3 Sound personality
| | 🔥 Hot Boy | 💧 Cool Girl |
|---|---|---|
| Steps | Small crackly taps | Soft wet pats |
| Jump | Whoosh plus a spark burst | Light splash plus an airy swish |
| Land | Heavy thump with sizzling sparks | Soft ripple |
| Near danger | Fizzing and sputtering as his flame shrinks | Bubbling and hissing as she starts to boil |
| Death | Steam hiss, then an angry "pfft" | Boiling bubble, then an evaporating sigh |
| Victory | Small firework pops | Glassy chime plus a "click" as the sunglasses drop |
| Voice (if used) | Short, loud "hah!", "yeah!" | Calm "hm.", "nice." |

### 15.4 Music: a duet
- **Mood:** an ancient jungle temple, mysterious, rhythmic and warm. Instruments: **kalimba and marimba plucks, hand drums, soft low flute, deep drones, distant chimes**.
- **The music is a duet**, and it reacts to play:
  - Base layer: drones and soft ambience, always playing.
  - **Hot Boy's layer: hand drums and warm plucks**, which get louder while he moves.
  - **Cool Girl's layer: airy chimes and flowing arpeggios**, which get louder while she moves.
  - When both are moving, the full song plays. Teamwork literally sounds better (P1).
- Gem pickups play notes **in the same key as the music**, so collecting sounds musical.
- Music **ducks** (quiets down) during death and swells on level complete.
- **Each temple chapter gets its own music variation** (9.3, decided 2026-10-31).

### 15.4b Menu music
- **Home screen:** a calm title theme that mixes both motifs: drums and chimes, slow and inviting.
- **Lobby:** while waiting alone, only **your** character's layer plays. When your partner joins, **their layer fades in** and the song is complete, so you hear that your friend arrived.
- **Level map:** a softer, quieter variation of the title theme.
- **Results:** a short "jingle" that gets bigger with more stars, then the level map music returns.

### 15.5 Complete sound list (first version)
| Group | Sounds |
|---|---|
| Characters | steps, jump, land, near-danger loop, death, victory, idle waiting gesture |
| Liquids | lava bubbling loop, water lapping loop, poison gloop loop, splash when entering your own liquid |
| Mechanisms | button press click and stone rumble, lever clunk, platform grinding loop (start and stop), gate sliding, door hum when near, door opening |
| Gems | pickup chime, with a rising pitch for quick combos; warm tone for Hot Boy's gems, glassy tone for Cool Girl's |
| UI | tap, back, ready, partner joined (two-note chime), stars counting up (three rising notes), hold-to-restart rising tone and pop |
| Ambience | temple room tone, distant wind, dripping water, faint jungle insects far away |

### 15.6 Mixing rules
- **Priority:** your own action feedback > partner events > music > ambience.
- **Small phone speakers have little bass**, so important sounds live in the mid range and must sound good on a phone speaker. We test on the phone speaker, not just headphones.
- **Frequent sounds are quiet** (steps), and rare events are louder (death, victory). Nothing gets annoying after 100 repeats.
- **Every sound varies slightly** in pitch and volume each time (section 8).
- **Stereo position:** sounds come from where they happen: lava on the left is heard more on the left. Hazard loops get **louder as you get closer**, an extra warning (always with a visual too).
- Your partner's sounds play slightly quieter than your own.
- **Settings:** music volume, sound volume, vibration on or off. *Built 2026-10-31 in the pause menu (sound, music and vibration buttons plus two volume sliders), saved on the phone. Vibration is hidden on iPhone, which can't vibrate from a web page.*

## 16. Level design 🔒
*Locked 2026-10-17.*

### 16.1 Level design rules
Every level must follow all of these, plus the pillars, the level metrics (7.7) and the thumb zones (5.3).

| # | Rule | In simple words |
|---|---|---|
| D1 | **Both players are needed** | Each player helps the other at least once. Nobody spends the level just waiting (P1). |
| D2 | **One new idea per level** | Introduce one new thing at a time. Never two new things at once. |
| D3 | **Teach → test → twist** | First meet a new thing where it's safe, then use it with a little risk, then combine it with something you already know. |
| D4 | **Teach without words** | The level itself shows the idea. Hints are tiny and drawn into the level (a glowing arrow, a symbol), never text boxes. The one exception is the **chapter riddle** (11.2): a mysterious line at the start of a chapter, never an instruction. |
| D5 | **Readable at the start** | From the first second you can see the doors, the hazards and the mechanisms, and start planning (P2). |
| D6 | **No unfair surprises** | No hidden traps, no blind jumps, no death you couldn't see coming. |
| D7 | **Both stay busy** | Paths split and meet again so both players are doing something most of the time. |
| D8 | **Gems guide and tempt** | Easy gems show the way; harder gems sit in riskier spots, a choice for players chasing ⭐⭐. |
| D9 | **Short** | The first levels take under 1 minute; later levels up to about 5. |
| D10 | **Doors close together** | The two exit doors are near each other, so the team finishes together. |
| D11 | **Difficulty is a wave, not a wall** | A hard level is followed by an easier breather. Each chapter ends with a level that combines everything. |
| D12 | **Playtested by two people on phones** | Before a level is final, two people play it on phones. We watch where they die and fix whatever felt unfair. |
| D13 | **Proven winnable** | Every level has a written solution (`tools/routes.ts`) that a robot plays with the real game physics. `npm run check:routes` must pass before a level ships. *Added 2026-10-21 after level 1-5 shipped unwinnable.* |
| D14 | **Every level is its own room** | No level is a copy of another: not mirrored, not with the roles swapped, not the same room with one more mechanic. A robot compares the stone and pools of every pair of levels, as built and mirrored (`npm run check:unique`), and fails when two share 80% or more. An idea may come back; the room may not. *Added 2026-11-16 by the owner: too many levels looked the same (16.7 "The remake").* |

**Lessons learned while building Chapters 2–4** (keep these in mind for new levels):
- **Every step onto a lever flips it** (since 2026-11-10). So never put a lever in a corridor that both players, or one player twice, must walk through: each pass flips it again. Put it in a dead end against a wall (step on, step back off: one flip), on a little shelf, or somewhere only one player goes (6-5, 7-5 and 9-5 moved theirs for this).
- **A ferry or lift sent with a lever:** the rider steps off the lever onto the lift without crossing the lever again (2-4, 2-5).
- **No pool or gap right at the mouth of a low tunnel.** You can't jump without headroom, so you'd fall in every time.
- **Mind the ceiling over a climb.** A 2- or 3-tile climb needs room for your head above the spot you're jumping from (this is what broke 1-5).
- **Symbol stones go on their own shelves, never in a row on the floor** *(added 2026-10-24 while building password gates)*. A stone counts the moment you stand on it, so walking along a row of stones would press every one you cross, and a wrong one resets the code (G7). Put each stone on a 1-tile shelf 3 tiles up (a full jump) with a 2-tile walkway under it: you walk *under* the stones you don't want and jump *up* onto the one you do. The Feel Lab vault room (`?lab=vault`) shows this layout.

### 16.2 Chapter 1: The Temple Gate (first 5 levels)
Sketches drawn on the real 32 × 18 grid: [`docs/levels/chapter1-sketch.png`](levels/chapter1-sketch.png) (made with `tools/level_sketch.py`).

| # | Name | Teaches | How it works |
|---|---|---|---|
| 1 | **First Steps** | Moving, jumping 1–3 tiles, your own liquid is safe, both doors are needed | Two separate lanes: Hot Boy walks through lava on the upper lane, Cool Girl through water on the lower one. They meet on a staircase up to the doors. |
| 2 | **Wrong Pool** | The other's liquid is deadly, violet kills both, the 3-tile ledge, 3-wide jumps | One shared path: Cool Girl jumps over lava, Hot Boy over water, both over poison. The risky gems float right above the pools. |
| 3 | **Hold the Button** | Pressure buttons and a gate | A gate splits the room. Hot Boy holds the button so Cool Girl can pass, then she holds the button on the other side so he can pass. |
| 4 | **Going Up** | Elevators held by a button; a lever that stays | One holds the button while the other rides the elevator up to a high shelf. Up there, a lever raises a second elevator to bring the partner up. |
| 5 | **Crossing Together** | Everything combined: the chapter "exam" | A ferry platform crosses a wide poison pit while either button is held, and the players take turns sending it across. On the far side a lever opens the gate to the doors. |

These sketches are a starting point. The real levels are built and tuned in the game and playtested (D12).

### 16.3 Level designer ("design your own level") 🔒
*Locked 2026-10-20.*

**The golden rule: a level is accepted (✅ Verified) only after two players finish it together**, online on two phones, with both characters at their doors (the normal finish rule, 13). Trying it alone on one phone is allowed while building, but never verifies. This is also how we know a homemade level can be beaten: no computer check can prove that.

**Where levels live:** on the phone, in a **My levels** list (browser storage, like progress). No server, no account. The website and the future app work the same way, but each keeps its own list.

**Fingerprint:** every level has a fingerprint (a hash of its tiles and mechanisms). The ✅ belongs to that exact fingerprint, so **changing even one tile removes the ✅** (the editor warns first), and the level has to be finished together again.

**How a friend gets the level:**
1. **In the room:** pick it on the temple map (**My levels** tab). Your phone sends the whole level (about 1 KB) over the phone-to-phone connection, and you play it through the normal lobby → map → play → results flow. Either player can pick one of their own levels. On the results screen the friend can **Keep a copy**.
2. **As a link** (`…/?level=…`): the whole level packed into a link. Opening it shows a preview and **Save to My levels**. **Only verified levels can be shared by link** ("beat it together to share it"). The link is also your **backup**: send it to yourself to keep a level safe.

**Copies from friends** keep the maker's name and can't be edited; **Make my own copy** starts a new unverified draft.

**Stars:** the ⭐⭐⭐ time for a homemade level is set by the first verified run (that time + 20%).

**The editor (on the phone):**
- Paint the 32×18 grid: stone, lava, water, poison, erase. The outer stone border is fixed.
- Place gems, both start spots and both doors.
- Place buttons, levers, moving platforms (drag the width, then tap where it travels) and gates (drag a box), and give each a rune.
- Undo / redo, zoom, rename, delete.
- **Try alone**: both characters on one phone with a swap button, like the Feel Lab.
- **Password gates (16.7, G14):** place **symbol stones** (tap a floor spot, pick one of the 8 animals) and **carvings** (tap a wall spot, pick an animal and its 1–4 dots). Set the level's **pattern** (2–4 animals in order, repeats allowed) and give it a rune: entering the pattern turns that rune on and it stays on, like a lever, so it can open a gate or move a platform. A wrong stone resets the stones (G7). Stones and carvings also take the 👁 "Seen by" setting, so a maker can split the carvings between the players (different eyes). The pattern, stones and carvings are part of the share link and the ✅ fingerprint.

**Built-in checks** (so homemade levels follow 5.3, 7.7 and 16.1):
- **Errors (can't play yet):** missing or doubled start spot or door; a start or door inside stone or liquid or floating in the air; a platform or gate with no button, lever or pattern for its rune; something outside the grid; a pattern that uses an animal with no stone in the level; stones placed but no pattern set.
- **Warnings (allowed):** "almost" jumps (4-tile ledges, 5-tile gaps); things in the thumb corners; a button or lever that controls nothing; no gems; a pattern animal with no matching carving (players would have to guess); carvings that don't match the pattern's order or dots.

**Password tools as built (2026-10-24):**
- Two new tools on the left bar: **🐾 Symbol** (tap a floor spot, pick an animal) and **🗿 Carving** (tap an empty wall spot, pick its dots, then the animal; the animal that matches the code is suggested in gold). Tap an existing one to change or remove it. The animal pictures in the menus are drawn by the same code as in the game.
- **🔑 Code** on the right bar: pick 2–4 animals in order (repeats allowed) and the rune it opens. The button then shows the rune and the code length.
- The 👁 "Seen by" brush works on stones and carvings too. **Try alone** plays the code like the real game.
- One extra warning beyond the list above: **a stone on a walkway** (players walking past would press it), from the level rule in 16.1.
- Levels without password things keep exactly their old fingerprint, so no existing ✅ falls off (`npm run check:custom` guards this).

**Honest limit:** someone technical could fake the ✅ inside a link, or read a homemade level's pattern from it. That's fine between friends; real protection would need a server.

**Later, not now:** a public online list of everyone's levels (needs a server and accounts).

### 16.4 Chapter 2: The Flooded Halls 🔒
*Built 2026-10-21.* Sketches drawn from the real levels: [`docs/levels/chapter2.png`](levels/chapter2.png).

| # | Name | New idea | How it works |
|---|---|---|---|
| 1 | **Two Keys** | Your lever opens your **partner's** gate | Two lanes, one above the other. Each lane is blocked by a gate, and the lever that opens it is in the other lane. Runes show which is which. |
| 2 | **Trapdoor** | A gate lying flat is a **bridge**; opening it leaves a **hole** | Hot Boy holds a button so Cool Girl can pass her gate. She crosses the bridge, then a lever turns the bridge into a hole, so he can climb up through it. |
| 3 | **Don't Let Go** | Closing gates **crush**: hold on until your friend is through | Three rooms with two gates and four buttons. You leapfrog: each holds a button while the other passes, then the one who passed holds the next one. |
| 4 | **Send It Back** | **Two levers, one rune**: the lift moves while either one is on | A diagonal lift over poison with a lever at the bottom and one at the top. The first rider goes up; then both levers must be off to send the lift back down for the partner. |
| 5 | **The Flooded Hall** | Exam: everything from Chapter 2 | Swapped lane levers on little shelves, a lever ferry over a poison flood, and a trapdoor to the top that is held open from below, then from above. |

### 16.5 Chapter 3: The Deep Machine 🔒
*Built 2026-10-21.* Sketches: [`docs/levels/chapter3.png`](levels/chapter3.png).

| # | Name | New idea | How it works |
|---|---|---|---|
| 1 | **Going Down** | A lift that **goes down** while powered | You start high. One holds the top button while the other rides down. To bring the partner down, both buttons are released so the lift returns up, then the bottom button brings it down. |
| 2 | **Stairway** | A **button and a lever with the same rune**: hold it, then lock it | One button raises three platforms into stairs over poison. The climber flips the lever at the top, which keeps the stairs up for the holder. |
| 3 | **Gem Run** | A breather full of gems, for ⭐⭐⭐ runs | Easy jumps under rows of gems. One holds the gate button; the other locks the gate open with the lever on the far side. |
| 4 | **Three Seals** | **Flooded tunnels**: only the right element gets through | Three gates seal the doors. A low tunnel full of water hides one lever (only Cool Girl), and a crawlway full of lava hides another (only Hot Boy). The last seal is a button plus a lever. |
| 5 | **The Deep Machine** | Exam: everything from Chapter 3 | Down a sinking lift (with a lava crawlway at the bottom), two flooded-tunnel levers that open the gates, then up a button-and-lever stairway to the doors. |

### 16.6 Chapter 4: The Summit 🔒
*Built 2026-10-21.* Sketches: [`docs/levels/chapter4.png`](levels/chapter4.png).

| # | Name | New idea | How it works |
|---|---|---|---|
| 1 | **Stepping Stones** | Closed gates are **pillars you stand on**; open them and they're gone | Cool Girl hops across gate pillars over poison. The button that opens Hot Boy's gate also removes the pillars, so she must be across before she presses it. Then he opens her gate. |
| 2 | **Counterweight** | **One rune moves two lifts in opposite directions** | When the left lift rises, the right one sinks. He rides up while she holds the bottom button. Then he holds the top button, so the right lift waits at the bottom for her, and lets go to bring her up. |
| 3 | **Twin Falls** | A breather: fall down your own side and collect gems | Each drops down a cascade of ledges. In the door room, each lets the other in with a button. |
| 4 | **The Tower** | Climb **together through trapdoors** | Two trapdoors, each held open from below by one player, then from above by the other. |
| 5 | **The Summit** | Final exam: one rune moves the **stepping stones and both lifts** | Pressing the button lifts one player but removes the stones the other needs. Choosing who presses when, and talking about it, is the whole puzzle. |

**Star times** for Chapters 2–4 are first guesses (D12): tune them after real playthroughs.


### 16.7 Ideas for future chapters 💬
*Proposed 2026-10-24 by the owner; none decided yet.* Rule for all of them: **introduce each new mechanic alone, in its simplest form, before mixing it with others** (D2, D3).

| Idea | What it is | Fits the pillars? | Difficulty to build |
|---|---|---|---|
| **Different eyes** | Some things (platforms, buttons, levers, gates, even the exit or your partner) are visible on only one player's screen. You have to tell each other what you see. | ✅ Great for P1: talking becomes the puzzle | Easy: each phone already draws its own screen |
| **Password gates** | Symbols (letters, numbers, animals, shapes) are hidden through a chapter's levels. A gate at the end opens only if you enter them. | ✅ Works well mixed with "different eyes": each player sees half the code | Easy–medium. The code should change every playthrough, so it can't be looked up online. Players should also be able to note symbols in a journal, in case they come back days later. |
| **Don't touch** | If the two characters touch, both die. *Designed 2026-11-06: see "Don't touch: design" below and Chapter 8 (16.11).* | ⚠️ Risk to P3/P6: online, each phone sees the partner slightly late, so a touch you didn't see on your screen would feel unfair. It needs a forgiving rule (only a clear overlap counts) and a test on two real phones. | Medium |
| **Chained together** | A chain links the two. One stands as the anchor while the other hangs and swings. | ⚠️ Big risk to P6: your movement would depend on your partner's delayed position over the network, which can cause rubber-banding. It must be prototyped first (Feel Lab, then two phones). | Hard: the hardest idea on this list |
| **1v1 race** | A mirrored level cut in half; each player races their own half against the clock, and the faster one wins. | ❌ Breaks P1 ("together or not at all") if it is a chapter. It can live as a separate **Versus mode** next to the story. *Shown as a "Soon" tile on the main screen (11.1, 2026-11-06).* | Medium |
| **Story and lore** | A short story told through each chapter: why the two are in the temple, what's at the summit. | ✅ Told with pictures and the temple itself, little or no text (D4) | Easy–medium (mostly art and writing) |
| **A background per chapter** | Each chapter gets its own look (flooded halls, machinery, summit sky), using the same depth layers (9.1). *Decided 2026-10-31, with music per chapter: see 9.3.* | ✅ | Medium (art) |

**Suggested order:** first different eyes, then password gates (and mixing the two), story and backgrounds alongside, then don't touch. Chained together needs a prototype before it's promised. The 1v1 race becomes a separate Versus mode.

**Owner's plan (2026-10-24):** build all of the above **except chained together** (parked), plus many more chapters and levels, and a deeper but still simple story.

More ideas from the same talk:
- **Bigger level sizes** (two larger sizes) for harder levels. ⚠️ This breaks 5.1 "one level = one screen": on a phone either everything gets tiny or the camera must scroll. Discuss before building.
- **Update check:** *built 2026-10-31.* The website checks `version.json` (written by every build) when it opens, every 10 minutes and whenever you come back to it; a newer version shows a "New version available · Update" banner, never during a level. The store app is updated by the store.

#### Different eyes: design 🔒
*Designed one question at a time and completed 2026-10-24. The first chapter that uses it is 16.8.*

| # | Question | Decision |
|---|---|---|
| E1 | How do players tell each other what they see? | **Voice call only** 🔒. No in-game pointing or signals; the game assumes friends are on a phone call or Discord, as 13.6 already says. Levels must be solvable by **describing** things out loud ("the button is on the top-left ledge"), so hidden things go in easy-to-name places. |
| E2 | What things can be hidden? | **Helpful things and dangers** 🔒: platforms, ledges, buttons, levers, lifts, gates, gems, **and lava, water and poison**. Both characters are always visible to both. Hidden exits wait for a later chapter. ⚠️ Hidden dangers press on P2 ("never die and think *what killed me?*"), so they need a fairness rule (next question, E3). |
| E3 | How are hidden dangers kept fair? | **Show only what killed you** 🔒. Nothing hidden is ever hinted while you play. When you die in something you couldn't see, **only that one thing** flashes into view on your screen (true color and shape) before the restart, so P2 holds: you always learn what killed you. The rest of the hidden map is never revealed, and after the restart the killer is hidden again. **Warn space (level rule):** a hidden danger always has walking space before it, never mid-jump or right after a landing, so the partner has time to shout "stop!" |
| E4 | Does the player who sees something know their partner can't see it? | **No** 🔒. Hidden things look exactly like normal things on the screen of the player who sees them. The two players work out together, by talking, who sees what. |
| E5 | Is a hidden thing real for the player who can't see it? | **Always real** 🔒. There is one shared world and only the drawing is hidden: you can stand on a platform you can't see, press a button you can't see, and die in lava you can't see. Online sync and the route robot (D13) work as before. |
| E6 | Who sees what? | **Both patterns, chosen per level, and never told** 🔒. A level can split the hidden things (each player sees some the other doesn't) or give one player everything while the other sees only the plain level. The game never says which; players find out by talking. Who sees what stays the same for the whole level. |
| E7 | How does the level designer (16.3) mark hidden blocks? | **A "Seen by" setting on each block** 🔒: Both (default), Only Hot Boy, or Only Cool Girl. In the editor, hidden blocks carry a small orange or blue eye badge so the maker can see them. The badge never appears in play (E4). The ✅ rule doesn't change: two players must finish the level together online. |

**How hidden things look and sound (built 2026-10-24):**
- A hidden **stone** is drawn as empty air, and a hidden **pool** is drawn as plain stone floor, so it looks safe (that's what makes level 5-3 work).
- A hidden **mechanism or gem** isn't drawn at all, and a hidden mechanism makes **no sound or vibration** for the player who can't see it.
- Your character's "near danger" reaction (14.4) ignores dangers you can't see.
- **Death flash (E3):** the whole hidden pool (or the hidden gate that crushed you) appears on your screen with a pulsing white outline, until the restart.
- In the level designer, the 👁 button on the right picks the "Seen by" brush; tap it again to switch between Only Hot Boy, Only Cool Girl and Both. Start spots and doors can't be hidden (E2).
- The level checks warn when a hidden pool has less than 2 tiles of floor before it (warn space, E3). `npm run check:custom` makes sure no official level breaks this.

#### Password gates: design 🔒
*Designed one question at a time and completed 2026-10-24. The first chapter that uses it is 16.9.*

| # | Question | Decision |
|---|---|---|
| G1 | Where are the symbols found, compared with the gate they open? | **Across the chapter** 🔒. Symbols are hidden in the earlier levels of a chapter, and the password gate is in the chapter's last level. Known cost: replaying the last level means remembering (or finding again) the earlier symbols, so this needs a journal and a code that stays the same on both phones between play sessions (decided in later questions). |
| G2 | How do players enter the code? | **Walk onto symbol stones** 🔒. The gate has a row of stone buttons, each carved with a symbol; stepping on them in the right order opens it. Controls stay left, right, jump (6.1), no keypad covers the level (P2), and both players can share the stepping. |
| G3 | When is a new random code picked, and how long does it last? | **Per team, until the gate opens** 🔒. The first time a team plays the chapter, the host's phone picks a random code and sends it to the partner; both phones save it. It stays the same between sessions (even days apart) until the team **finishes the vault level** (both at their doors), then a fresh code is picked for the next playthrough. *(Changed 2026-10-24 while building: was "until the gate is opened". A team could open the gate and then die before the doors; the level restarts with the gate closed, so they still need the same code.)* Every team's code is different, so it can't be looked up online. |
| G4 | Is there an in-game journal? | **No** 🔒. Players remember the symbols themselves (paper, a screenshot, memory). This replaces the earlier journal idea in the table above. It works because the code doesn't change until the gate opens (G3), so notes from days ago stay right. |
| G5 | What kind of symbols, and how many in a code? | **4 animal carvings** 🔒, picked from a set of 8 temple animals: snake, monkey, jaguar, frog, bird, fish, bat, turtle. Easy to say out loud (E1), told apart by shape and not only color (4.1), and right for the jungle temple. One symbol per level in levels 1–4. |
| G6 | How do players know the order? | **Level order** 🔒. Level 1's symbol is first, level 2's second, and so on. Each carving also has 1–4 dots under it as a reminder. |
| G7 | What happens on a wrong symbol? | **The stones reset** 🔒. A wrong stone flashes, makes a low thud, and all stones pop back up. No death and no penalty (12); the only cost is time, and with it the ⭐⭐⭐ time star. |
| G8 | How are the gate's stones laid out? | **Split, 4 on each side** 🔒. A wall splits the gate room: Hot Boy's side has 4 of the 8 animal stones, Cool Girl's side the other 4. Each can step only on their own side's stones, so entering the code is turn-taking ("your turn: the frog!"). Both are needed (P1, D1). |
| G9 | Where does a symbol sit in its level? | **On the main path, glowing when near** 🔒. Carved into the back wall somewhere you must pass to finish the level. Faint from far away; it lights up gold with a soft chime when either player walks past. It can't be missed, only forgotten, and since finishing a level unlocks the next (12.2), the team always passes all 4. | *Changed 2026-11-14 (H2): carvings now sit off the main path, in 4 of a chapter's levels 1–9, and from far away show only a blank stone plaque: the animal and its dots appear only while someone is near.*
| G10 | Can both players see each symbol? | **Both see them in the first password chapter** 🔒, so the idea is taught on its own (D2). A later chapter mixes it with different eyes: each player sees only 2 of the 4 symbols and must share them on the call. |
| G11 | What rules does the random code follow? | **Fully random** 🔒: any 4 of the 8 animals, repeats allowed (8 × 8 × 8 × 8 = 4,096 codes). A repeated animal is entered by stepping off its stone and on again. ⚠️ Sometimes all 4 animals are on one side, so one player does all the stepping while the other only calls out the code; accepted by the owner, since both still need each other to find and remember the symbols (D1). |
| G12 | Which code is used with a different friend? | **One code per friend pair** 🔒. Each phone gets a hidden random ID (no account) and remembers a separate code for every partner it plays the chapter with. A new friend means a fresh code for that pair; the old friend's code stays safe. Joining a friend straight at level 5 means replaying levels 1–4 together to find your shared symbols. |
| G13 | How is the password chapter shaped? | **Stones only in level 5** 🔒. Levels 1–4 are normal levels that each carry one carving; the 8 symbol stones first appear at the final gate in level 5. Simpler to build. ⚠️ Players meet the stones and the full test at once, so level 5 must make stepping on a stone easy to read: it sinks, glows and chimes, and a wrong one clearly resets (G7). |
| G14 | Can homemade levels use symbol stones? | **Yes, with the maker's own pattern** 🔒 *(changed 2026-10-24 by the owner; was "not yet")*. A homemade level is a single level, so its code lives inside that level: the maker **picks a fixed pattern** (2–4 animals, repeats allowed), places the **symbol stones** and places the **carvings** that reveal it, all in the same level. The code is the same every time that level is played (only official chapters use random codes, G3). Harder to build, accepted on purpose. Details in 16.3. |

**Build notes (not questions):** the route robot (D13) plays password levels with a fixed test code, since the real code is random. The code travels from the host like other room data (13.1) and is saved on both phones next to progress (12.4). Official and homemade levels use the same stone mechanism: a correct pattern turns a rune on (it stays on). In official level 6-5 the pattern comes from the team's saved random code; in a homemade level it comes from the level itself.

#### Don't touch: design 🔒
*Designed one question at a time with the owner, 2026-11-06. The first chapter that uses it is 16.11.*

| # | Question | Decision |
|---|---|---|
| T1 | What happens? | **Fire meets water: both burst into steam** 🔒. In a "Don't touch" level, if the two characters clearly overlap, both die in a cloud of steam and the level restarts for both, like any death (13.3). No penalty (12). In every other level they still walk through each other (7.3). |
| T2 | How is it kept fair online (P3, P6)? | **Both screens must agree** 🔒. A touch counts only when the bodies overlap clearly: by at least **half their width and half their height** (a brush or a near miss is survived, 7.4). Each phone checks its own character against the partner *as shown on its own screen*, and tells the other phone when it sees a clear overlap. **Only when both phones saw one** (within half a second of each other) do both burst. If only one screen saw it, nothing happens. So a death always shows on both screens, and close calls stay exciting instead of unfair. The cost: the burst comes about 0.1 s after the overlap, while the phones check with each other. In the Feel Lab and the route robot both characters are on one screen, so the true overlap is used. |
| T3 | How do players know a level uses it (P2, D4)? | **Hiss and steam when close** 🔒. In a Don't touch level, when the two are within about 2 tiles, both characters hiss and throw off steam, stronger the closer they get (like the "near danger" reaction, 14.4). Levels without the rule look and sound exactly as before. No text. |
| T4 | Can homemade levels use it? | **Later** 🔒. First the rule is tested on two real phones in Chapter 8 (D12). Once it feels fair, the level designer gets a simple on/off switch; the ✅ rule stays the same (16.3). |

**Level rules for Don't touch** (keep these in mind when building):
- The two starts and the two doors are at least **3 tiles apart**, so nobody starts in danger and the team can finish together (D10).
- **"Fits only one"** is shown by a 1-tile-wide shaft or ledge: two 0.7-tile bodies can't stand in it side by side without a clear overlap.
- **Jumping over a friend who stands still** is always safe with a full jump (it clears them by about 2 tiles). *Added 2026-11-14:* only with headroom, at least 5 tiles of space above the floor (8-4 has exactly 5 and clears by 2.9 tiles). Under a lower ceiling the jump is cut short and lands right beside the friend (16.11, 8-6). Passing while *both* move is where the screens can disagree, so levels never require it.
- A level is a Don't touch level as a whole (it doesn't switch on and off inside a level).

**As built (2026-11-06):**
- A level sets `apart`. A "clear overlap" means the two bodies overlap by at least half their width (0.35 tiles) and half their height (0.68 tiles); the check is `touching()` in `src/game/body.ts`, used by the game and the route robot alike.
- **T2 online:** while a phone sees its own character clearly overlapping the partner (as drawn on that phone), it tells the other phone a few times a second (a new `touch` message, so the play version's `PROTOCOL` went from 1 to 2). A phone bursts its own character only when both phones saw a touch within half a second of each other; the usual death message then shows the partner's burst too. In the Feel Lab both characters are on one phone, so the overlap is final.
- **T3:** within 2 tiles both characters get their "near danger" look (14.4), steam puffs rise between them and a soft hiss grows louder the closer they get. The death is a big steam cloud with a hiss for both (`steam` cause).
- The route robot plays Don't touch levels with the rule on and fails a level if the two ever clearly overlap. `npm run check:routes` also tests the rule itself in a flat room: walking into each other bursts both, a full jump over a friend who stands still is safe, a brush at the edge is survived, and without the rule they walk through each other.
- Try it alone in the Feel Lab: `?lab=8-1` (swap with 🔥/💧).

#### The Trials: bonus chapters for teams who finished the story 💬
*Proposed 2026-11-10. The owner approved the placement and all three mechanics the same day. The mechanics are built; the levels are not.*

Three **extremely hard** chapters (5 levels each) for skilled teams. Hard never means unfair: every pillar, hard limit, the level metrics (7.7), the thumb zones (5.3) and D6 still hold.

**What HARD means 🔒** *(agreed with the owner 2026-11-16; replaces "tight timing, long chains, demanding jumps and several mechanics at once").* Adding a mechanic to an old room does not count as hard, and no level is a mirrored one (D14).

A level in **Chapters 10–12** is hard when it has at least three of these four:

| Kind of hard | In simple words |
|---|---|
| **Hard to figure out** | You can't see the solution in the first look. The team needs a plan with steps in the right order. |
| **Hard to do together** | Both players must act at the same moment, or one must act for the other, guided by voice. |
| **Hard to do** | Jumps and timing leave little room for error (about half a second), always inside the level metrics (7.7). |
| **Hard to hold** | A chain of 8–12 steps with no safe place to rest. One mistake restarts the level. |

"Figure out" and "together" are the main sources of hard; "hard to do" comes second, because tight finger-work on a touch screen frustrates (P1, P3). **Measure:** a team that finished the story needs about 10–20 tries per level.

**SUPER HARD (Chapter 13):** all four kinds in every level; chains of 15 or more steps; both players under pressure the whole time, nobody stands and waits; timing room down to about a third of a second, never less (lag, R5); every level has one trick the team has never seen. **Measure:** about 30–50 tries per level.

**Hard never means:** a death you couldn't see coming (D6); a jump beyond the level metrics or timing that lag can break (R5); long waiting or redoing a slow easy part after each death; luck; the same room again with one more thing added (D14).

**The tide is faster 🔒** *(owner, 2026-11-16: "way too slow").* A tide's speed is now set from the robot: in Chapter 12 the robot must lose when the tide is 1.5× faster than built (2× in 12-1, which teaches it), in Chapter 13 at 1.35×; never faster than 0.6 tiles a second in Chapter 12 and 0.8 in Chapter 13, so it stays readable (V3). Before, the spare time was 1.8× to 11×. The 1.25× test (V5) stays. These are first numbers: tune them from play.

| # | Decision |
|---|---|
| R1 | **Behind the "Bonus levels" tile** 🔒 (11.1, 12.2). The story stays 9 chapters and still ends at the heart of the temple (16.12). In the code they are Chapters 10–12 in `CHAPTERS` with a bonus mark, so the solo test, the route robot, themes and tunes work as for any chapter. |
| R2 | **They open when either player has finished 9-5** 🔒 (12.3). Not with stars as 12.2 first said: star times are still guesses. Part of the one purchase (12.6: "every future chapter"). |
| R3 | **Rules relaxed on purpose:** D2 (levels mix several ideas; only a chapter's first level shows its new mechanic alone) and D11 (no breather levels). A clean run still fits D9. |
| R4 | **No password gates:** entering a code again after every death is tedious, not hard. |
| R5 | **Lag room:** anything timed between the two players must leave room for the partner being shown about 0.1 s late (13.2). The route robot (D13) has to prove each level. |

| Chapter | New mechanic | Status |
|---|---|---|
| 10 **The Crumbling Wing** | **Crumbling stones** (below) | **built**, 10 levels (16.13) |
| 11 **The Hourglass Hall** | **Timed switches** (below) | **built**, 10 levels (16.14) |
| 12 **The Rising Dark** | **The rising tide** (below) | **built**, 10 levels (16.15) |
| 13 **The Last Trial** | everything at once, and a password (H5) | **built**, 5 levels (16.16) |

First level ideas (they will change while building):
- **10:** Fragile Bridge · No Way Back · Steam on Thin Stone (Don't touch) · Blind Bridge (Different eyes) · The Collapse (exam).
- **11:** Run! · Relay · Catch the Lift · Count Me Down (Different eyes) · The Hourglass (exam, Don't touch).
- **12:** Higher Ground · Burning Bridges (crumbling) · Last Breath (timed) · Trust Fall (eyes, Don't touch) · The Last Trial (everything).

#### The remake: every level its own room 💬
*Started 2026-11-16. The rules are agreed (D14, "What HARD means" above). Chapters 6–12 were remade on 2026-11-20 and Chapter 13 on 2026-11-21; left: the old cousins 1-4/4-2 and 5-1/5-5 (the owner decides).*

The owner played the 100 levels and found that many look the same: on the road to 100, most new levels were an older room mirrored or with a mechanic added. The look-alike robot (`npm run check:unique`) agrees. Each family below keeps its first room; the others get a new room under the same id, so saved progress and the map stay as they are.

| Chapter | Clear copies (90% or more the same) | Close cousins (80–89%) |
|---|---|---|
| 4 | | 4-2 (of 1-4) |
| 5 | | 5-5 (of 5-1) |
| 6 | 6-2 (of 1-4), 6-8 (of 3-4), 6-9 (of 3-2) | 6-6 (of 4-2) |
| 7 | 7-4 (of 6-4), 7-5 … 7-9 (of 5-1 … 5-5) | |
| 8 | 8-6 (of 4-4), 8-7 (of 3-2), 8-8 (of 4-2), 8-9 (of 8-1), 8-10 (of 8-5) | 8-2 (of 6-2), 8-4 (of 8-3) |
| 9 | 9-5 (of 4-1), 9-6 (of 2-2), 9-7 (of 1-5), 9-8 (of 3-5), 9-9 (of 4-5), 9-10 (of 7-10) | |
| 10 | 10-6 (of 8-4), 10-7 (of 8-1), 10-8 (of 5-5), 10-9 (of 9-2), 10-10 (of 8-10) | 10-1, 10-4 (of each other and 5-1) |
| 11 | 11-1 (of 5-3), 11-7 (of 11-3), 11-9 (of 11-5), 11-10 (of 10-10) | 11-2 (of 11-1), 11-3 (of 10-1), 11-8 (of 11-5) |
| 12 | 12-6, 12-7 (of 12-3), 12-8, 12-10 (of 12-5) | |
| 13 | 13-2 (of 12-5), 13-3 (of 12-9), 13-4 (of 13-1) | 13-1 (of 12-1) |

That is 36 clear copies and 11 close cousins. The cousins are mostly simple rooms (a flat floor with gaps, a lift room); the owner decides which of them to remake.

**Rules for a remade level:** a new room that passes `check:unique` against every other level; the same place in its chapter's teaching order; a hidden carving stays in the levels that carry one (6-8, 7-4, 7-6, 7-8, 9-6, 9-8, 13-1 to 13-4); a written solution the robot wins (D13); and in Chapters 10–13 the new room is built to "What HARD means".

**Proposed order of work (stop for the owner after each step):** the story first, where only the room changes: Chapter 6, then 7, 8, 9. Then the Trials, where the new rooms are also made harder: Chapters 10, 11, 12, and last 13 (super hard).

#### The road to 100 levels 🔒
*Asked for and decided by the owner 2026-11-12. Nothing of it is built yet; Chapter 10's first five levels are (16.13).*

| # | Decision |
|---|---|
| H1 | **100 levels in 13 chapters** 🔒. Chapters 1–5 keep 5 levels (25). Chapters 6–12 grow to **10 levels each** (70). A new **Chapter 13** has 5. The story is Chapters 1–9 (65 levels); the Trials are Chapters 10–13 (35 levels). This changes 12.2 ("5 levels each"): the map gets room for 10 level stones in a chapter. |
| H2 | **Password chapters (6, 7, 9): 4 carvings, hidden** 🔒. The code stays 4 animals (G5) and the 8 symbol stones stay as they are (G8). The 4 carvings move to **side spots off the main path, in 4 of levels 1–9**, and the game never says which levels. The vault moves to **level 10**. The dots still give the order (G6). This changes G1, G9 ("on the main path, can't be missed") and G13. Known cost, accepted before (16.10): a carving you miss or forget means replaying levels to find it. |
| H3 | **Nobody loses progress** 🔒. A level that a player could already play stays open after the new levels are added: a level is open when the one before it is finished **or any later level is already finished**, on either phone (12.3). The new levels simply show as unfinished. A saved result for an old vault (6-5, 7-5, 9-5) moves with the vault to level 10. |
| H4 | **Mechanics are added one at a time** 🔒. From Chapter 10 on, each level adds at most one more mechanic to the mix, until every mechanic is on at once. The ladder is below. |
| H5 | **Chapter 13 "The Last Trial": everything at once** 🔒 (the owner: "if possible"). **The password gate joins, decided by the owner 2026-11-16:** Chapter 13 has its own team code (carvings in 13-1 to 13-4) and its vault in 13-5 stands above the tide's highest point, after every danger: once the team is in the vault nothing can kill them, so a death never forces the code to be entered again. This is the one exception to R4. |

**The ladder (H4).** C = crumbling stones, S = timed switches, R = the rising tide, E = Different eyes, T = Don't touch, P = password. Buttons, levers, lifts and gates are in every level.

| Chapter | Levels 1–5 | Levels 6–10 |
|---|---|---|
| 6 The Sealed Vault | as built, carvings moved (H2) | five more with the story's basic mechanisms; vault at 10 |
| 7 The Whispering Vault | as built, carvings moved | five more with P + E; vault at 10 |
| 8 The Steam Halls | as built | five more with T, the last ones T + E |
| 9 The Heart of the Temple | as built, carvings moved | five more mixing E, T and P; vault and the ending at 10 |
| 10 The Crumbling Wing | C · C · C+T · C+E · C+T (built) | C+E+T in steps, exam at 10 |
| 11 The Hourglass Hall | S · S · S+C · S+E · S+T | S+C+T · S+C+E · … · S+C+E+T at 10 |
| 12 The Rising Dark | R · R+C · R+S · R+E · R+T | R+C+S · R+C+S+E · … · R+C+S+E+T at 10 |
| 13 The Last Trial | all of C, S, R, E, T in every level; P joins at the end (H5) | — |

**Order of work** (one step at a time, stopping for the owner after each):
1. Chapter 11, levels 1–5. 2. Chapter 12, levels 1–5.
3. The plumbing for 10-level chapters: the map, the unlock rule (H3), moving the vaults and their saved results.
4. Five more levels for each story chapter: 6, 7, 8, 9 (with H2 for 6, 7 and 9).
5. Five more for each Trial chapter: 10, 11, 12. 6. Chapter 13. 7. Wrap-up: all checks, and the store and marketing texts.

Steps 1–3 are done (2026-11-12 and 2026-11-14). Step 4 is done: Chapters 6 to 9 have their 10 levels (16.9–16.12), so the story now has 65 levels. Step 5 is done: Chapters 10, 11 and 12 have their 10 (16.13–16.15). Step 6 is done: Chapter 13 (16.16). **The game has 100 levels.** Step 7 is done too (2026-11-16): the store and marketing texts say 100 levels in 13 chapters, and everything was pushed to `main`. **What is left is not building but testing:** two-phone playtests of the 55 new levels, real star times, and tuning tide speeds, clock lengths and crumble timing from what players do. The test APK has the solo test in Settings, so the owner can try every level alone on a phone.

**As built: the plumbing for 10-level chapters (step 3, 2026-11-14)**
- **The vaults are level 10 now:** 6-5, 7-5 and 9-5 became **6-10, 7-10 and 9-10** (same maps, same codes). Their chapters list 5–9 as planned levels (`rows: null`) until those are built.
- **Planned levels are skipped.** The unlock chain and "Next level" walk only the levels that exist (`BUILT_LEVELS` in `levels.ts`), so 6-4 leads straight to 6-10 for now. The map shows a planned level as a dimmed "soon" stone.
- **Saved results move with the vaults (H3).** The first time a phone opens the new version, a result saved for 6-5, 7-5 or 9-5 moves to 6-10, 7-10 or 9-10 (`progress.ts`). It happens once per phone, so a result for the new 6-5 later is never moved.
- **The unlock rule (H3):** a level is open when the built level before it is finished, **or when it or any later level is finished**, on either phone. An old save never loses a level it could play.
- **The ending moved with the vault:** the story's last level (`FINALE_ID`) is 9-10, which plays the ending and opens the Trials.
- **The map:** a 10-level chapter has two rows of smaller stones, 1–5 left to right on top and 6–10 back right to left below. With 13 tabs, a phone held sideways shows the chapter tabs as one row you slide; the open chapter stays in view, so Ready fits on the screen.
- **Tests:** `npm run check:custom` now also checks the rules above with pretend saves (a new player, an old save that reached 7-2, a phone that saw the move already, either phone opening a level). Checked by hand in the browser with an old save, on a desktop screen and at 844 × 390.
- **Known gap until step 4:** an old player who finished 6-5 (the old vault) skips straight from 6-4 to 6-10 as before; the new 6-5 to 6-9 appear as unfinished levels once they are built, and stay optional for players who are already past them (H3).

#### Crumbling stones: design 🔒
*Approved by the owner 2026-11-10 and built the same day. First used in Chapter 10.*

| # | Question | Decision |
|---|---|---|
| K1 | What is it? | **A stone block that falls away after you stand on it** 🔒. Any character standing on it starts it. It never kills by itself: what is under it does. |
| K2 | How do you see it coming (D6, P2)? | **It shakes for 0.7 s first** 🔒, with a crackle, falling dust and widening cracks. It stays solid for the whole shake, so running across is always safe; only standing still is not. Coyote time (7.6) still gives a jump just after it goes. |
| K3 | Does it come back? | **Yes, 5 s after it falls** 🔒. A faint outline shows where, and fills in over the last second. It never grows back while someone is in its space. So a mistake never leaves a level unwinnable, and the partner has to wait or find another way. |
| K4 | How does it look (4.2)? | **Stone with gold cracks** 🔒: gold means "this does something". No rune, because nothing powers it. Each block is one tile, and a bridge falls block by block behind you. |
| K5 | How does it work online (13.1, P6)? | **Your phone starts the shake for your own character** 🔒 and tells the partner's phone, which starts the same 0.7 s clock about 0.1 s later. The host's world state (5× a second) carries every block's clock, so a lost message is repaired. Your own fall is always decided by your own phone. |
| K6 | Homemade levels? | **Later** 🔒, like Don't touch (T4): first two phones test it in Chapter 10. |

**Level rules for crumbling stones** (keep these in mind when building):
- Never the floor under a start, a door, a button, a lever or a symbol stone (the level check refuses it).
- What waits under a crumbling stone is visible before you step on it (D6): a pool, or a floor you can see.
- A jump that starts or ends on a crumbling stone uses the standard sizes (7.7), and never needs a pause on the stone.
- In a Don't touch level, two players are never asked to share a crumbling stretch at the same time.

**As built (2026-11-10):**
- A mechanism `{ kind: 'crumble', x, y, w }`: a row of `w` one-tile blocks (`src/game/mechanisms.ts`, `CRUMBLE_SHAKE` 0.7 s, `CRUMBLE_BACK` 5 s). It can carry `seen` like any mechanism (Different eyes).
- Online: a new `crumble` message and `cr` in the host's world state, so the play version's `PROTOCOL` went from 3 to 4.
- The route robot runs it with the real physics. `npm run check:routes` also tests the rule itself in the test room: running across is safe, standing still drops you, the bridge grows back, single stones work as quick steps, a block waits while someone is in its space, and two phones (0.1 s apart, one message lost) see every block fall and return within 0.11 s of each other.
- Try it alone in the Feel Lab: `?lab=crumble` (swap with 🔥/💧).

#### Timed switches: design 🔒
*Approved by the owner 2026-11-10 and built the same day. First used in Chapter 11.*

| # | Question | Decision |
|---|---|---|
| S1 | What is it? | **A button that pops back up slowly** 🔒. It is on while someone stands on it, and stays on for a set time after they step off. Each switch has its own time (1–15 s). It powers its rune like a button (10.1). |
| S2 | What if you step on it again? | **The time is full again** 🔒, like winding it back up. |
| S3 | How do you see the time left (P2, D6)? | **A gold ring that drains** 🔒, around the switch's rune **and on every gate and lift it powers**, so the runner never has to look back. The ring blinks in its last quarter, and the switch itself rises back up as the time runs out. A tick sounds twice a second, faster in the last 1.5 s (a bonus, never required: 15.1). |
| S4 | Does a timed gate crush? | **Yes, like every closing gate** 🔒 (10.2). The countdown is drawn on the gate, so the death is always one you saw coming. |
| S5 | How is it kept fair online (P6, 13.2)? | **The host's clock counts, and every level keeps 0.5 s to spare** 🔒. Each phone starts the clock when it sees the step-off, so the two can differ by the network delay (about 0.1–0.2 s); the guest's clock then follows the host's. **Level rule:** the route robot must also win the level with every clock 0.5 s shorter. |
| S6 | Homemade levels? | **Later** 🔒, like Don't touch (T4). |

**Level rules for timed switches** (keep these in mind when building):
- **Clearly enough time or clearly not** (the spirit of 7.7): a run the level wants passes with every clock 0.5 s shorter; a shortcut the level forbids misses by a clear margin too. Never "almost".
- Both the switch and what it powers are on screen together (5.1), so the ring on the gate can always be seen.
- A hidden timed switch (Different eyes) keeps its gate or lift visible to the runner, ring included.

**As built (2026-11-10):**
- A mechanism `{ kind: 'timer', x, y, rune, secs }` (`src/game/mechanisms.ts`). `runeClock()` gives the ring for a rune that only a running clock keeps on.
- Online: the host's world state carries every clock (`tm`), so the play version's `PROTOCOL` went from 4 to 5. No new message: like a button, each phone sees who stands on the switch.
- The route robot: a level with timed switches writes its solution as a function and is played twice, as written and with every clock 0.5 s shorter (`LAG_CUT` in `tools/route_check.ts`). `npm run check:routes` also tests the rule in the test room: the run through the gate (also 0.5 s short), the gate shutting 3 s after the step-off, the crush, a timed lift, and two phones 0.1 s apart seeing the time run out at most 0.1 s apart, whoever pressed.
- Try it alone in the Feel Lab: `?lab=timer` (swap with 🔥/💧).

#### The rising tide: design 🔒
*Approved by the owner 2026-11-10 and built the same day. First used in Chapter 12.*

| # | Question | Decision |
|---|---|---|
| V1 | What is it? | **Violet poison that rises from the bottom of the level** 🔒 at one steady speed, up to a set height. It is poison like any other (4.2): deadly to both. It fills every open space under its surface. |
| V2 | When does it start? | **When the first player moves** 🔒. Until then it rests where everyone can see it, so the team can plan on the call first (D5). A deep rumble and a small shake mark the start (P4). |
| V3 | How is it kept readable and off the thumbs (P2, L6, 5.3)? | **It never speeds up, slows down or jumps** 🔒, and it is always seen by both players (it can't be hidden with Different eyes). **A tide level keeps both bottom 4 × 4 corners solid stone**, so no poison edge is ever under a thumb. Its resting surface shows from the first second. |
| V4 | When does it kill (7.4)? | **When your feet are clearly under the surface** 🔒: 0.3 tiles. A splash at the edge is survived. Your character's "near danger" look (14.4) grows as it gets close. |
| V5 | How is it kept fair (P3, P6)? | **Each phone decides its own character's death, and every level has time to spare** 🔒. Both phones raise the tide at the same speed from the first move; the guest follows the host's surface. **Level rule:** the route robot must also win the level with the tide rising 1.25× faster, so a team slower than the robot still makes it. |
| V6 | Homemade levels? | **Later** 🔒, like Don't touch (T4). |

**Level rules for the tide** (keep these in mind when building):
- Both bottom corners solid, the resting poison visible at the start (checked by `npm run check:custom`).
- The tide stops at a height the level sets. The doors are above it, so reaching them is always safe (D10).
- No waiting puzzle may depend on the tide's exact height: it is a clock for the whole level, not a platform.

**As built (2026-11-10):**
- A level sets `tide: { from, to, speed }` (surface y at rest, highest y it reaches, tiles per second). The state lives in `Mechanisms` (`src/game/mechanisms.ts`, `TIDE_DEPTH` 0.3).
- Online: the host's world state carries the surface (`td`), so the play version's `PROTOCOL` went from 5 to 6.
- The route robot: a tide level writes its solution as a function and is played twice, as written and with the tide 1.25× faster (`TIDE_RUSH` in `tools/route_check.ts`). `npm run check:routes` also tests the rule in the test room: it waits for the first move, both climb ahead of it (also 1.25× faster), it stops under the top platform, it catches someone who stays below, and two phones 0.1 s apart keep their surfaces within 0.04 tiles.
- Try it alone in the Feel Lab: `?lab=tide` (swap with 🔥/💧). There the tide sinks back when it catches someone.

How to sell the game: see [`docs/MARKETING.md`](MARKETING.md).

### 16.8 Chapter 5: The Hall of Eyes 🔒
*Planned and built 2026-10-24.* Sketches: [`docs/levels/chapter5.png`](levels/chapter5.png). Teaches **Different eyes** (16.7, E1–E7): one new idea per level, simplest first. Every hidden danger follows the warn-space rule (E3), and every level has a route-robot solution (D13).

| # | Name | New idea | How it works |
|---|---|---|---|
| 1 | **Invisible Bridge** | **Hidden platforms** (the simplest case) | A poison pit splits the room, and the poison is visible to both. Each player sees the stepping stones the *other* one needs. He talks her across ("jump now… one more"), then she talks him across. Nothing hidden can kill yet. |
| 2 | **The Hidden Rune** | **Hidden buttons** | She drops into the lower hall; he stays on top. His gate's button is down in her hall, and only he can see it: he guides her onto it ("go right… stop there") and walks through. Then her gate's button is on his side, and only she can see it: she guides him onto it and walks to her door. |
| 3 | **Watch Your Step** | **The first hidden danger** | Two lanes. His floor hides two water pools that only she sees; her floor hides two lava pools that only he sees. To each player the floor looks like plain stone. With walking space before every pool, each shouts "jump now!" for the other. If you die, the pool that got you flashes into view (E3). |
| 4 | **One Pair of Eyes** | **One player sees everything** | Cool Girl sees the whole hidden layout; Hot Boy sees only bare walls. She talks him along a short path of invisible ledges over poison. At the end he holds a button that opens her door, so both are still needed. |
| 5 | **Blind Trust** | **Final exam** | Hidden platforms, buttons and dangers for **both** players at once, plus hidden gems for the stars. Each player must guide and be guided. |

**Star times** are first guesses (D12): tune them after real playthroughs.

### 16.9 Chapter 6: The Sealed Vault 🔒
*Planned and built 2026-10-24.* Sketches: [`docs/levels/chapter6.png`](levels/chapter6.png) (a carving shows **?**, because its animal comes from the team's code). Teaches **Password gates** (16.7, G1–G14). Levels 1–4 each carry one animal carving on the main path (G9), with 1–4 dots for its place in the code (G6). Both players see every carving (G10). The symbol stones appear only in level 5 (G13).

| # | Name | New idea | How it works |
|---|---|---|---|
| 1 | **The First Mark** | **Carvings**: a wall symbol that glows and chimes when you pass | An easy shared path with a button-and-gate swap (Chapter 1 style). The carving (1 dot) sits right where the two meet, so neither can miss it. |
| 2 | **The Lift Shaft** | A carving you pass **while riding** | One holds a button while the other rides a lift up past the carving (2 dots), then a lever brings the partner up the same way. |
| 3 | **Resting Hall** | Breather (D11) | An easy gem run like 3-3. The carving (3 dots) sits in the middle of the gems. |
| 4 | **Behind the Seal** | The carving is **inside a sealed room** | A trapdoor relay (Chapter 2/4 style): each opens the way for the other into a small chamber with the carving (4 dots), and both leave by the doors. |
| 5 | **The Vault** | Exam: **symbol stones** | A route through mixed mechanisms leads to the split vault room (4 stones per side, G8). The players take turns stepping on the code; the vault gate opens onto the doors. |

**How they were built:**
- 6-1: his upper lane and her lower lane meet in a hall with the carving; then the 1-3 button swap through a gate.
- 6-2: one lift. She rides it up while he holds the button; he lets go so it comes back down and steps on; she walks over a lever at the top that sends it up again.
- 6-3: two gem blocks with a 4-tile jump over water between them (Hot Boy jumps it, Cool Girl may walk through); the carving sits beside the second block; a button-and-lever gate at the end.
- 6-4: a trapdoor in the chamber floor, held open from below and then from above (like 4-4); the carving is between the trapdoor and the doors.
- 6-5: up top he holds a gate button for her, and each opens the other's trapdoor with a lever. Below, each lands in their half of the vault: 4 stones on shelves with a walkway underneath (16.1). The code opens both vault gates onto the doors in the middle.

**Proven winnable:** the route robot plays 6-5 with the test code **and 45 other codes** (all four animals on one side, the same animal four times, 40 random), and checks that every carving in 6-1…6-4 lights up on the way.

**Star times** are first guesses (D12). Level 5's target time (90 s) allows for a couple of wrong guesses (G7).

#### Ten levels (2026-11-14, 16.7 "The road to 100 levels", H1–H2)
The chapter grew to 10 levels. The vault is now **6-10** (the table above calls it level 5). Levels 6-5 to 6-9 are new, and the carvings moved:

**Where the carvings are (H2).** Four of levels 1–9 carry one carving, off the main path, and the game never says which. From far away a carving is a blank stone plaque; its animal and dots show only while someone is near it (within about 2.6 tiles), so the team has to go and look. The route robot proves each one can be reached, and that the shortest winning route never comes close enough to read it (it stays 3.7 to 6.8 tiles away).

| Level | Dots | Where | Who can reach it |
|---|---|---|---|
| 6-1 | 1 | on a ledge 3 tiles above his start (a short climb nobody needs) | Hot Boy |
| 6-4 | 2 | the far end of the door room, away from the doors | both |
| 6-6 | 3 | at the end of a low, flooded tunnel | Cool Girl (water) |
| 6-8 | 4 | down a second shaft off the lava crawlway, past more lava | Hot Boy (lava) |

6-2 and 6-3 lost their carvings; their maps are unchanged. 6-1 gained the ledge (three tiles of stone).

**The five new levels** use only the story's basic mechanisms, each from an earlier chapter, mirrored and extended:

| # | Name | Based on | How it plays |
|---|---|---|---|
| 5 | **Crossed Keys** | 2-1 + 6-4 | Two lanes. Each lane's gate opens with the lever on a shelf in the other lane (jump up onto the shelf, drop back off: one flip). His lane drops into hers past both gates; then a trapdoor to the door room, held from below and then by a button right beside the hole. |
| 6 | **The Weighing Room** | 4-2, mirrored | One rune raises one lift and sinks the other. She holds the bottom button while he rides up; he holds the top button so her lift waits at the bottom, then lets go to bring her up. Carving 3 is in the flooded tunnel. |
| 7 | **Three Gates** | 2-3 with a third gate | A crushing relay: a button two tiles before and after each of three gates; each holds while the other passes. A lava pool in one middle room and a water pool in the other. |
| 8 | **The Drowned Archive** | 3-4, mirrored | Three seals: a lever at the end of a water tunnel (only she), one at the end of a lava crawlway (only he), and a button-and-lever seal. Carving 4 is down a side shaft off the crawlway. |
| 9 | **The Last Stair** | 3-2 + 3-3, mirrored | One button raises three platforms into stairs over poison; the first up locks them with a lever. A last gate before the doors: one holds its button, the other locks it open from the far side. |

**Proven winnable:** all ten pass the route robot; every gem in 6-5 to 6-9 is collected on the way (the older levels keep their old gems), and the vault still opens with 45 codes. **Star times** for 6-5 to 6-9 are first guesses (D12): 45, 50, 40, 55 and 50 s.

**For players who were already past Chapter 6:** they keep 6-10 (their old 6-5 stars moved there) and everything after it (H3). The new levels show as unfinished. Their code doesn't change, and the carvings still show the same animal for the same dots, so notes from before stay right.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14)
Four levels of Chapter 6 were copies of older rooms (6-2 was 1-4's lift room, 6-6 was 4-2's counterweight room, 6-8 was 3-4 mirrored, 6-9 was 3-2 mirrored). Each one now has a brand-new room. Each new room still teaches what the old one taught, with the same simple parts (buttons, levers, lifts, gates, pools). 6-1, 6-3, 6-4, 6-5, 6-7 and 6-10 did not change. Picture: [`docs/levels/chapter6.png`](levels/chapter6.png).

| # | Name | The room | What each player does |
|---|---|---|---|
| 2 | **The Hanging Tower** | A stone tower hangs from the middle of the room with the doors on its top. There is a lift on each side of it, a water pool on his side and a lava pool on hers. | He jumps the water onto his lift and climbs to a little shelf with a lever. The lever sends HER lift up. She rides it to the tower top and stands on the button there, which brings HIS lift up. |
| 6 | **The Balance Hall** | Three floors: the start room at the bottom, a middle floor with a flooded cellar under it, and the door hall at the top. A low lift goes from the bottom to the middle floor, and a high lift from the middle floor to the top. | One rune moves both lifts in opposite ways: when it is on, the low lift goes up and the high lift goes down. He holds the floor button while she rides the low lift up and steps onto the high lift. Then he lets go: her lift rises and his comes back down. She holds the top button so his lift rises and the high lift comes down for him. Then she lets go and it carries him up. |
| 8 | **The Twin Wells** | A long top hall above two wells: a water well on the left and a lava well on the right. The door room is underneath. | She holds a button while he drops through his trapdoor into the lava well. She drops down her open water well. Each walks to the lever at the end of their well, and each lever opens the OTHER player's gate into the door room. |
| 9 | **Steps from the Pit** | A deep poison pit between a low left rim and a high right rim. The doors are in a room under the right rim. | She holds the button that raises three steps out of the poison. He climbs them and steps on the lever at the far end of the rim, which locks the steps up, and then she climbs. Now he holds the trapdoor button, she drops into the door room and locks the trapdoor open with the lever in the corner, and he drops after her. |

**Where the two carvings are now** (same dots as before; from far away a carving is only a blank plaque):
- **6-6, 3 dots:** in the flooded cellar under the middle floor, at its far end. Only Cool Girl can wade there (she drops through the hole and climbs back out over a stone pillar). A water gem next to it tempts her.
- **6-8, 4 dots:** at the far end of a lava pool in the top hall, past his trapdoor. The pool is 6 tiles wide, too wide to jump, so only Hot Boy can wade there. A fire gem in the pool tempts him.

The route robot visits both carvings. A shorter version of each solution, without the visit, still wins and never comes closer than 4.25 tiles (6-6) or 4.75 tiles (6-8) to the carving (it lights at 2.6 tiles), so the team only finds it if they go and look.

**Proven winnable:** all ten levels of Chapter 6 pass the route robot, and every gem in the four new rooms is collected. Robot times and star times (about 2.5–3× the robot): 6-2 13.0 s → **35 s**, 6-6 18.0 s → **50 s**, 6-8 7.5 s → **20 s**, 6-9 14.9 s → **40 s**. These are first guesses (D12). The look-alike robot puts each new room well under the limit: 6-2 49% (closest 5-3), 6-6 62% (3-2), 6-8 46% (5-3), 6-9 53% (2-4).

**Lessons worth keeping:**
- **A trapdoor that is closing is already solid on top.** The moment someone steps off its button, you land on it instead of falling through. So a trapdoor whose button is a few tiles away always needs a friend to hold the button (6-8, 6-9), and nobody can "run for it" alone.
- **Every lift stop is 5 tiles from the next floor in 6-6, never 4** (rule 7.7): 5 is clearly too high to jump, so everyone sees that the lift is needed. A 4-tile gap looks almost jumpable and only frustrates.
- **Put a lift's top stop one tile clear of any ledge** (6-2). Then nobody standing under the ledge can get caught by a lift coming up.
- **For a lever that locks something, use a dead end** (the far end of a rim or well) or a little shelf. Then the lever flips once and nobody walks back over it.

### 16.10 Chapter 7: The Whispering Vault 🔒
*Planned and approved by the owner 2026-10-31.* Sketches: [`docs/levels/chapter7.png`](levels/chapter7.png). Mixes **Password gates** and **Different eyes** (16.7), as G10 promised: **each player holds half of the secret and has to say it out loud** (E1). A paid chapter (12.6).

| # | Decision |
|---|---|
| W1 | **Each carving is seen by only one player** 🔒: Cool Girl sees carvings 1 and 3, Hot Boy sees carvings 2 and 4 (G10). The other player sees a blank wall and hears no chime (16.7 "how hidden things look"). The game never says who sees what (E4). |
| W2 | **Its own team code** 🔒: Chapter 7 has its own random 4-animal code, separate from Chapter 6's, with the same rules: one per friend pair, replaced when the team finishes level 5 (G3, G11, G12). Levels 1–4 carry one carving each, the stones are only in level 5 (G13). |
| W3 | **Hidden stones in the vault** 🔒: the vault is split 4 and 4 as in 6-5 (G8), but on each side 2 of the 4 symbol stones are seen **only by the partner**. The shelf under a hidden stone stays visible, so you see an empty shelf and your partner tells you which animal sits there. A hidden stone is real (E5): you can step on it without seeing it. |
| W4 | **One new thing per level** 🔒 (D2): 7-1 teaches the hidden carving alone, 7-2–7-4 combine it with one Chapter 5 idea each, 7-3 is a breather (D11), and 7-5 is the exam. |

| # | Name | New thing | How it plays |
|---|---|---|---|
| 1 | **Half a Secret** | A carving **only one of you sees** | An easy shared path (like 6-1). Only Cool Girl sees the carving (1 dot); Hot Boy walks past a blank wall, so she has to tell him. Nothing can kill you. |
| 2 | **The Unseen Bridge** | The carving waits **across hidden stepping stones** | A poison pit with hidden stepping stones (like 5-1): each sees the stones the other needs. On the far side, carving 2 is seen only by Hot Boy. |
| 3 | **Quiet Hall** | Breather (D11) | An easy gem run with some hidden gems for the stars. Carving 3 (only Cool Girl) sits in the middle. |
| 4 | **The Hidden Key** | A **hidden button** opens the carving's room | The button that opens the sealed room is seen only by Cool Girl; she guides Hot Boy onto it. Inside, carving 4 is seen only by Hot Boy. |
| 5 | **The Whispering Vault** | Exam: **hidden stones** (W3) | A short climb with a hidden mechanism leads to the split vault. The players take turns on the code, guiding each other onto the stones they can't see. |

**Known risk (accepted, as in Chapter 6):** if a player forgets to say a carving out loud, the team only finds out at the vault and must replay that level to read it again (no journal, G4).

**How they were built (2026-10-31):**
- 7-1: both start on an upper ledge next to the carving. He drops into the lower lane (lava), she stays up (water). Each lane has a gate, and the lever that opens it is in the other lane (like 2-1). Both lanes lead to the doors on a ledge at the right.
- 7-2: they start on opposite sides and cross toward each other over two poison pits: a low hidden stone, then a high one, then the middle (each sees the partner's stones). Carving 2 is at the edge of the middle, right where Hot Boy lands. The doors are in the middle.
- 7-3: a hill, a lava pool next to a water pool, and a platform with carving 3 on top. Two gems are hidden: a fire gem only she sees and a water gem only he sees, so chasing ⭐⭐⭐ means telling each other. A button-and-lever gate to the doors at the end (like 3-3).
- 7-4: the chamber with the doors and carving 4 is up on the left, behind a trapdoor. The button that opens it sits past a 6-tile lava pool (only Hot Boy gets there), and only Cool Girl sees it. She climbs in and walks over a lever that locks the trapdoor open, then he climbs in.
- 7-5: up top, he walks over the lever that opens her trapdoor and stands on the gate button only she sees. She climbs onto a poison pit and crosses on stones only he sees, then walks over the lever that opens his trapdoor. The vault below is the same room as 6-5, but the monkey and frog stones (his side) are seen only by her, and the bird and bat stones (her side) only by him.

**Proven winnable:** every level passes the route robot; 7-5 is played with the test code **and 45 other codes**, like 6-5.

**Star times** are first guesses (D12). Level 5's target time (100 s) allows for wrong guesses and for guiding each other onto hidden stones.

#### Ten levels (2026-11-14, 16.7 "The road to 100 levels", H1–H2)
The chapter grew to 10 levels. The vault is now **7-10** (the tables above call it level 5). Levels 7-5 to 7-9 are new.

**Where the carvings are (H2, with W1 kept).** Cool Girl still sees carvings 1 and 3, Hot Boy 2 and 4. Each is off the main path, a blank plaque until someone is near (G9). The chapter's own twist: **in 7-6 and 7-8 the one who sees the carving is not the one who can reach it.** The one who sees it guides the other there; when the other stands next to it, it lights up on the seer's screen, and the seer reads it out. (For the one who can't see it, there is nothing on the wall at all, E4.)

| Level | Dots | Seen by | Where | Who goes there |
|---|---|---|---|---|
| 7-1 | 1 | Cool Girl | on a shelf 3 tiles over her walkway | Cool Girl |
| 7-4 | 2 | Hot Boy | the far end of the door room, across the open trapdoor | either |
| 7-6 | 3 | Cool Girl | at the end of a low lava tunnel behind their start | **Hot Boy** (only he can walk in) |
| 7-8 | 4 | Hot Boy | on a shelf past her door, up where only she climbs | **Cool Girl** |

7-2 and 7-3 lost their carvings; their maps are unchanged. 7-1's shelf is new (one tile, two tiles left of the lever, so dropping off it never skips the lever).

**The five new levels** take Chapter 5's layouts (Different eyes), mirrored, each with one more thing:

| # | Name | Based on | How it plays |
|---|---|---|---|
| 5 | **Steps in the Dark** | 5-1 | Each crosses a poison pit on stones only the other sees. Then the gate to the doors: its button is on his ledge, and only she sees it. |
| 6 | **Through the Fire** | 5-2 | Each gate's button is in the other's lane and seen only by the one it doesn't open. Carving 3 waits in the lava tunnel. |
| 7 | **Mind the Floor** | 5-3 + 2-1 | Each lane hides pools only the partner sees. Each lane's gate opens with a lever in the other lane, past its pools: you get through when your partner does. |
| 8 | **His Eyes Only** | 5-4, roles swapped | Now **he** sees every hidden ledge and talks **her** up over the poison; up top she stands on the button only he sees, which opens the gate to his door. Carving 4 is on the shelf past her door. |
| 9 | **Trust, Turned Around** | 5-5, roles swapped | The Chapter 5 exam with the two players' jobs, liquids and eyes swapped. |

**Proven winnable:** all ten pass the route robot; every gem in 7-5 to 7-9 is collected on the way, and the vault still opens with 45 codes. The robot also proves that the shortest winning route never reads a carving (it stays 3.1 to 6.4 tiles away; they light at 2.6). **Star times** for 7-5 to 7-9 are first guesses (D12): 45, 45, 40, 45 and 70 s.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14)
Levels 7-4 to 7-9 got brand-new rooms. Before, 7-5 to 7-9 were Chapter 5's five rooms turned around and 7-4 was 6-4's room. Each new room starts from its own shape. The teaching stays the same: hidden carvings plus Different eyes, and in every level one player sees and the other acts. 7-1, 7-2, 7-3 and the vault (7-10) are unchanged.

| # | Name | The room | What is hidden and from whom | What each player does |
|---|---|---|---|---|
| 4 | **The Quiet Lift** | Two floors with a lift shaft between them. The doors are up in the loft, and a lava pool and a water pool lie on the ground floor. | The button that sends the lift up. It sits on the steps past the lava, and only Cool Girl sees it. | She talks Hot Boy across the lava onto the button and rides the lift up. In the loft she stands on the second button to bring the lift back up for him. |
| 5 | **One Bridge, Two Halves** | Two cliffs with a poison lake between them and one row of four stepping stones, going up and down. | She sees stones 1 and 3, he sees stones 2 and 4. He also sees the gate button at the end of the little water tunnel under their start. | She walks into the water tunnel and holds the button he tells her about. Each calls out "jump now" for the stones the other can't see. He climbs past the doors to a lever that keeps the gate open, then she crosses. |
| 6 | **Two Stairs, One Tower** | A tower in the middle with both doors on top and a stair of ledges on each side. Her floor has water, his has lava. | Each stair has a lever in a corner that only the partner sees. Each lever opens the partner's gate into the tower. | Each one guides the other onto the lever they can't see: "go to the far corner of your middle ledge". |
| 7 | **The Switchback** | Three long floors stacked on top of each other. He starts on the top floor, she starts on the bottom. | The top and middle floors hide water pools only she sees. The bottom floor hides two lava pools only he sees. | She holds a button on the bottom floor that opens his trapdoor. He flips a lever on the middle floor that sends her lift up. On every floor, the one who sees the pool calls the other's jump. |
| 8 | **The Blind Well** | A wide well over poison between his high shelf and the rim with the doors. She starts in a water basin at the bottom. | He sees everything: the ledges up the well and the button on the rim. She sees none of it. | He opens her gate into the well and talks her up, ledge by ledge. On the rim she stands where he tells her. That spot is the hidden button that sends the ferry over the well to carry him across. |
| 9 | **The Ring of Trust** (exam) | A ring of corridors round a big block, with the doors on top. | This time she sees almost everything: the button for her lift, the ledges up his shaft and the water on his path. He sees only the lava on top of the block. | She talks him onto her lift button, past the water and up his ledges. He warns her about the lava. At the top she holds the gate open for him. Water at the top of her lift keeps him from taking the lift himself. |

**Where the carvings are now** (same dots, animals and eyes as before. In 7-6 and 7-8 the one who sees the carving still can't reach it):

| Level | Dots | Seen by | Where | Who goes there |
|---|---|---|---|---|
| 7-4 | 2 | Hot Boy | high on the far-left wall of the loft, away from the doors | either |
| 7-6 | 3 | Cool Girl | on a shelf high on his side of the tower, past the floating block | **Hot Boy** (it is on his stair) |
| 7-8 | 4 | Hot Boy | over a water shelf in her basin, up a step only he sees | **Cool Girl** (only she can stand in the water) |

**Proven winnable:** all ten levels pass the route robot, and every gem in 7-4 to 7-9 is collected. The robot also played the shortest winning routes of 7-4, 7-6 and 7-8, and none of them lights a carving: they come no closer than 5.2, 5.0 and 4.3 tiles, and a carving lights at 2.6. The look-alike check puts every new room at 61% or less (limit 80%, aim under 70%). Star times are first guesses (D12): 50, 35, 25, 30, 35 and 40 s. The robot's times are 16.3, 10.2, 5.4, 8.9, 10.0 and 11.3 s, and the star times leave extra room for talking.

**Lessons worth keeping:**
- A running jump under a ceiling 4 tiles high only covers about 2.7 tiles. In a low corridor, a hidden pool must be 1 tile wide, or the jump over it is unfair.
- A liquid on a ledge makes a spot only one player can use: water on a shelf lets only Cool Girl stand there. That is how "the one who sees it can't reach it" works in 7-8, and how water keeps Hot Boy off her lift in 7-9.
- Big solid blocks of stone are what make two rooms look alike. Hollowing one out (7-8's open hall over the poison) dropped its likeness to 3-2 from 78% to 56%.
- Never change a map row with a find-and-replace that treats `.` as "any character": it quietly rewrote every all-stone row in the chapter. Replace exact text only.

### 16.11 Chapter 8: The Steam Halls 🔒
*Planned and approved by the owner 2026-11-06.* Teaches **Don't touch** (16.7, T1–T4): fire meets water and both burst into steam. One new idea per level, simplest first; level 3 is a breather and level 5 the exam (D2, D3, D11). Every level of the chapter is a Don't touch level. A paid chapter (12.6).

| # | Name | New idea | How it plays |
|---|---|---|---|
| 1 | **Keep Apart** | **Touching kills** | You start on opposite sides and must swap places. One hops onto a small step and waits while the other walks underneath. A button swap (Chapter 1 style). Nothing else can kill you. |
| 2 | **One at a Time** | A lift that **fits only one** | You can't ride it together, so one rides up while the other holds the button, then the lift is sent back for the partner. |
| 3 | **Leapfrog** | Breather: **jump over your friend** | An easy gem run on one narrow path: one stands still, the other leaps over them. |
| 4 | **Tight Squeeze** | The helper is **in the way** | The gate button sits in the only corridor. The holder must stay still on it, so the other jumps over them and through the gate (let go too early and the gate crushes). |
| 5 | **The Steam Halls** | Exam: everything from Chapter 8 | Swapping sides, the one-person lift, and leaping over the button holder. |

**Must happen before the chapter is final (D12, T2):** a test on **two real phones** over the internet, to check that the "both screens agree" rule feels fair.

**How they were built (2026-11-06):** sketches in [`docs/levels/chapter8.png`](levels/chapter8.png).
- 8-1: he starts on the left, she on the right; his door is reached from the right end of the door ledge and hers from the left, so they must swap sides. Under the ledge a little shelf (3 up, with a 2-tile walkway underneath) lets one wait while the other walks below. Up top he holds her gate open from his porch, then she holds his gate open from a button between the doors.
- 8-2: the lift waits flush with the floor in a pocket one tile wide: you walk in until the wall stops you, which also centers you for the 1-wide shaft. She holds the bottom button while he rides up; then he jumps to the button on the left ledge and holds it to bring her up.
- 8-3: a low gem corridor with a water pool and a lava pool. She starts in front, but his door is past hers, so he leaps over her at her door. The fire gems hang where his leaps go.
- 8-4: a relay through two gates in a 5-tile-high corridor. Each gate has a button two tiles before it and two tiles after it. The holder stands still on the near button; the other leaps over them through the open gate onto the far button; then they swap. Letting go too early crushes (10.2).
- 8-5: below, a 6-tile lava pool guards the lift button, so only he can hold it, while the one-person lift is on the far left; they swap sides in the hall (one waits on the shelf). Then she holds the top button for his ride, and up top they leap over each other through a relay gate to the doors.

**Proven winnable:** every level passes the route robot with the touch rule on. **Star times** are first guesses (D12).

#### Ten levels (2026-11-14, 16.7 "The road to 100 levels", H1)
Chapter 8 has no password, so it only grew: 8-6 to 8-10 are new and come after 8-5. They bring Don't touch to older layouts; the last two add Different eyes (the ladder, H4).

| # | Name | Based on | How it plays |
|---|---|---|---|
| 6 | **The Tower, Apart** | 4-4 | Two trapdoors, each held from below and then from above by a button beside the hole. The rooms are 4 tiles low, too low to leap over a friend safely, so **the order is the puzzle**: whoever is ahead climbs first and the other holds behind them. Climb in the wrong order and you meet with no way past (restart from the pause menu). |
| 7 | **Up the Stairs** | 3-2 | She holds the button that raises the stairs; he leaps over her to reach them and locks them at the top. The first one up takes the far door, so nobody passes on the ledge. |
| 8 | **The Balance** | 4-2 | The counterweight lifts. Up on the narrow ledge he holds the top button; she arrives beside him and leaps over him to her door. |
| 9 | **The Hidden Shelf** | 8-1, mirrored | Swap sides without touching: she waits on a shelf **only he sees** while he walks under it; then he holds her gate from a porch button **only she sees**. |
| 10 | **Blind Steam** | 8-5, mirrored | The chapter's exam. Hidden: the shelf she waits on (only he sees it), the lift button he holds (only she sees it), and the top button she holds for his ride (only he sees it). Then the relay through the gate, each leaping over the other. |

**Kept fair (T level rules):** every pass is a full jump over a friend who stands still, never two moving players. The robot measured each leap: the jumper's feet stay at least 2.9 tiles above the friend's while their bodies overlap sideways (a burst needs less than 0.68). While building, the first 8-6 had a leap inside a 4-tile-high room; the jumper bumped the ceiling and landed 0.75 tiles from the friend, a near miss that two phones might see differently. That is why 8-6 became an ordering puzzle. **Lesson:** never ask for a leap over a friend under a ceiling lower than 5 tiles.

**Proven winnable:** all ten pass the route robot with the touch rule on, and every gem in 8-6 to 8-10 is collected on the way (their gems were placed on the arcs the players really jump). **Star times** for 8-6 to 8-10 are first guesses (D12): 55, 40, 45, 45 and 70 s.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14)
Seven of Chapter 8's rooms were copies (8-6, 8-7 and 8-8 were old rooms with Don't touch switched on, 8-9 and 8-10 were 8-1 and 8-5 mirrored, 8-2 was a lift room like 1-4, 8-4 was nearly 8-3). They are now new rooms with the same ids. 8-1, 8-3 and 8-5 did not change. Each new room is built around its own way of getting past each other, and every pass is a friend who stands still (never two moving players). Sketches: [`docs/levels/chapter8.png`](levels/chapter8.png).

| # | Name | The room | How the two get past each other | What each player does |
|---|---|---|---|---|
| 2 | **One at a Time** | A low room on the left, a poison pool on the right, and a high ledge hanging above with the doors. | A cable car one tile wide climbs slantwise over the pool: it fits only one, so they ride it in turns. The first one up goes to the far button, past both doors. | She holds the floor button while he rides up. He holds the button beyond the doors while she rides. |
| 4 | **Tight Squeeze** | A hill in a cave: a gate at the foot of the hill, a second gate on the far side, the doors in a low room beyond. | Each gate's button is on the only path, so the one holding it is in the way: the other leaps over them (5+ tiles of headroom) and through the gate. | She holds the first button, he leaps over her and holds the button past the gate for her. Then he holds the second button and she leaps over him; she holds the far button so he can come through. |
| 6 | **The Burrow** | Two long tunnels, one above the other, each with a little cellar under its floor (one behind water, one behind lava). The doors are at the far end of the lower tunnel. | The tunnels are too low to leap over a friend. The cellar's button opens the gate ahead, and whoever stands down in the cellar is out of the way, so the friend walks past above. | Upper tunnel: she ducks into the water cellar and holds, he goes through and holds the gate from the far side for her. Lower tunnel: he ducks into the lava cellar and holds, she goes through and holds the gate for him. |
| 7 | **Under and Over** | A low tunnel under a big block, with water at the left exit and lava at the right; the doors are on top of the block. | Nobody can pass in the tunnel. In its middle is a one-person lift in a pocket: she stands on it, he steps on the plate beside it, which lifts her into the shaft above while he walks under her (the plate on the far side keeps her up). On top, the second one leaps over the first. | She waits on the lift, then climbs out on the left (water). He walks under her, climbs out on the right (lava), and stands still on top while she leaps over him to her door. |
| 8 | **The Poison Crossing** | A poison pool with one-tile stones and a big island in the middle; a low nook at each end of the pool, floored with water on his side and lava on hers, with a lever at the end. The doors are pits in the island, closed by trapdoors. | Out and back across the stones, in opposite directions. The stones are too far apart to leap over a friend, so they pass on the island: one stands still, the other leaps. On the way back, the first one home drops into their door pit and the other jumps over. | She crosses to his side and flips the lever in the water nook (it opens his door pit). He crosses to her side and flips the lever in the lava nook (it opens hers). |
| 9 | **The Zigzag** | Three floors joined by two trapdoors; he starts on the top floor, she on the bottom one; the doors are on the low middle floor, which has one small dip. | The middle floor is too low to leap over a friend: the dip is the only place to pass. One steps down into it and the other hops over. | Different eyes: he holds the top button (only she sees it) so she can climb up, on a ledge only he sees. She holds the button at the end of the middle floor (only he sees it) so he can drop down. Then they pass at the dip. |
| 10 | **The Ring of Steam** | The exam. A ring round a big block: a one-person lift up the left side, ledges up the right side behind a wide lava pool, a tall hall on top with a gate between the doors. | One-person lift, then the two meet at the gate from opposite sides: she holds its near button and he leaps over her through it. | Different eyes everywhere: he holds the lift button (only she sees it) while she rides; he climbs ledges only she sees; she holds the near gate button (only he sees it); he holds the far one (only she sees it) so she can walk through to her door. |

**Proven winnable:** all ten levels of Chapter 8 pass the route robot with the touch rule on, and the seven new ones collect all their gems (4 each). Robot times and star times (about 2.8× the robot, first guesses, D12): 8-2 16 s → 45 s, 8-4 8.5 s → 25 s, 8-6 18 s → 50 s, 8-7 8 s → 20 s, 8-8 8.5 s → 25 s, 8-9 12.5 s → 35 s, 8-10 10 s → 30 s. Every leap over a friend clears them by at least 2.5 tiles (a burst needs less than 0.68). The look-alike robot: each new room is at most 66% like any other level (8-10 vs 5-3).

**Lessons:**
- A pocket is the easiest fair way to pass under a low ceiling: a cellar, a dip or a lift shaft one tile wide. The one in the pocket is at least 2 tiles below the friend, so there is never a near miss.
- A pool can only keep one player out if it is too wide to jump: 6 tiles in a 4-tall corridor (8-10), or any width in a 2-tall nook (8-8).
- A button is a natural "stand still here" mark: put the passing place where someone already has to wait.

### 16.12 Chapter 9: The Heart of the Temple 🔒
*Planned and approved by the owner 2026-11-06.* The finale: **no new rule**. Each level mixes ideas players already know, and the chapter has **its own team code** (password gates, G1–G13): one carving in each of levels 1–4, the symbol stones at the final gate in level 5. Some carvings are seen by only one player (as in Chapter 7). A paid chapter (12.6).

| # | Name | Mix | How it plays |
|---|---|---|---|
| 1 | **The Long Way Back** | Warm-up: Chapters 1–4 | Swapped levers, a trapdoor and a lift. Carving 1, seen by both. Not a Don't touch level. |
| 2 | **Steam and Shadows** | Different eyes + Don't touch | You cross hidden stepping stones toward each other and must not meet in the middle. Carving 2, seen only by Cool Girl. |
| 3 | **The Last Rest** | Breather (D11) | A gem run with hidden gems and a leapfrog (Don't touch). Carving 3, seen only by Hot Boy. |
| 4 | **The Turning Gears** | Counterweight lifts + a trapdoor + pools, Don't touch | One rune sends one lift up as the other comes down. The button that holds the trapdoor open sits right beside the hole, so the climber jumps up through it and lands past their friend (a vertical leapfrog). Carving 4, seen by both. *(Changed 2026-11-06 with the owner while building: was "the two lifts pass each other", but two lifts side by side always keep the riders more than half a body apart, so under T2 they could never touch.)* |
| 5 | **The Heart of the Temple** | Final exam: everything | A climb with hidden things and Don't touch, then the split vault (4 stones each side, 2 per side seen only by the partner, like 7-5). The gate opens onto the doors at the heart of the temple. |

**How they were built (2026-11-06):** sketches in [`docs/levels/chapter9.png`](levels/chapter9.png).
- 9-1 (not a Don't touch level): two lanes, each gate opened by the lever in the other lane (2-1). Up in the top right he holds a button that opens a trapdoor and brings her lift up through it. Carving 1 sits by that button.
- 9-2: he starts on the left bank and she on the right, but his door can only be reached from the right bank and hers from the left (a wall splits the door ledge). They cross the same poison pit on three hidden stones (he sees the middle one, she sees the two outer ones), so they have to go one at a time. Carving 2 (only she sees it) is on the wall where she lands.
- 9-3: a gem run over a lava pool, a water pool and a little hill, with one hidden gem each. Carving 3 (only he sees it) is on the hilltop; at the end he leaps over her at her door.
- 9-4: the counterweight (like 4-2) brings both from the bottom floor to the middle one. A trapdoor leads to the door hall; it is held open from below, then from above by a button right beside the hole, so the second climber pops up beside their friend and must land on the other side. Carving 4 is by the doors.
- 9-5: the 7-5 vault with the roles swapped and Don't touch on. She holds the gate button only he sees; he leaps over her, crosses stones only she sees and opens her trapdoor. In the vault she has the left half and he the right; on each side 2 stones are seen only by the partner.

**Proven winnable:** every level passes the route robot; 9-5 is played with the test code **and 45 other codes**, like 6-5 and 7-5. **Star times** are first guesses (D12).

**The ending (story, 16.7):** small and wordless (D4). Level 9-5's background shows the glowing heart of the temple. When both reach their doors in 9-5, a short celebration plays (the heart lights up, fire and water sparks swirl together) and the results screen says "You reached the heart of the temple". A bigger story (pictures between chapters) can come later as its own project.
*As built:* the whole of Chapter 9 shows the heart (great carved rings with marks of every earlier area, and a slow, dim two-beat glow). Finishing the last official level lights the heart up, sends fire and water sparks swirling out of the doors with a cloud of steam, and adds "🔥💧 You reached the heart of the temple." to the results.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14)
Levels 9-5 to 9-10 were old rooms: 9-5 to 9-9 were the last levels of Chapters 1–4 mirrored with something added, and the finale 9-10 was 7-10's vault with the roles swapped. All six are now new rooms with the same ids and the same mix of ideas (Different eyes, Don't touch, carvings). 9-1 to 9-4 are unchanged. Sketches: [`docs/levels/chapter9.png`](levels/chapter9.png).

| # | Name | Mix | The room | What each player does |
|---|---|---|---|---|
| 5 | **The Island Tower** | Different eyes | A tall stone tower stands in a poison lake; the doors are on top of it, and a lift runs up each side. | Each crosses their half of the lake on a stepping stone only the partner can see. She stands on a button on her bank (only he sees it) to lift him up the tower; on top he stands on a button (only she sees it) to lift her. |
| 6 | **Upstairs, Downstairs** | Don't touch, carving 3 | Two rooms upstairs, split by a wall, over one long hall downstairs with a small water pool. | She walks over the lever that opens his trapdoor; he drops down and walks onto the lever that opens hers. They land on each other's side, so she waits in the pool while he leaps over her. |
| 7 | **The Floating Floor** | Don't touch, Different eyes | A wide floor floats in the middle of the room over a poison pit, with a lift on each side. | His lever sends her lift up; her lever on the floating floor sends his lift up. Up there they must pass: the lava only he sees, the water only she sees. She waits in the water while he leaps over her. |
| 8 | **Three Floors Down** | Different eyes, carving 4 | A zigzag of three floors: the top floor, a low middle hall, the bottom floor. | They warn each other about the pools on the top floor. One holds the button at its end so the other can pass the gate in the middle hall, then holds the button below (only she sees it) for the partner. The lever at the far end of the middle hall (only she sees it) opens the door gate. |
| 9 | **The Crossroads** | Don't touch, Different eyes | A cross: a chimney at the top, a long hall left to right, a poison pit below the middle. | The ferry over the pit is seen only by her. He holds the button on his ledge while she rides across; then he walks off his ledge onto the ferry he can't see, and she holds the button only he sees. At the end he leaps over her to his door. |
| 10 | **The Beating Heart** | The finale: everything, and the vault | A shaft on the left, a vault on two floors (his upstairs, hers downstairs), the doors at the right end of each floor. | See below. |

**Where the carvings are.** 9-6: carving 3 (seen only by Hot Boy) is on a shelf above her upstairs room; only she can climb there, so he has to ask her to go and look. 9-8: carving 4 (seen by both) is on a little shelf just past the end of the top floor, a jump nobody needs. Both are off the main path: the robot's shortest winning route stays 5.4 tiles (9-6) and 3.5 tiles (9-8) away; a carving lights up at 2.6.

**The new finale vault (9-10).** She starts high and must go low; he starts low and must go high. She holds the button for his lift (it fits only one), he leaps over her on the ledge and walks onto the lever that opens her gate; she drops down, jumps the lava only he can see, and walks over the lever that opens his gate. Then each is alone on their own floor of the vault, so they can never touch in there, and nothing inside can kill: a death never makes the team enter the code again. The twist: **every stone on your floor is seen only by your partner**. You see four empty shelves, so the partner has to tell you which animal sits where ("your third shelf is the frog"), and the code is entered by taking turns, floor by floor. When the code is right, both vault gates open onto the two doors, one above the other at the right end.

**Proven winnable:** all ten levels of Chapter 9 pass the route robot, every gem in 9-5 to 9-10 is collected on the way, and the new vault opens with 45 different codes (one side only, repeats, 40 random). The robot's times and the first-guess star times: 9-5 9.2 s (30 s), 9-6 6.6 s (25 s), 9-7 9.8 s (30 s), 9-8 15.7 s (45 s), 9-9 10.3 s (35 s), 9-10 15.8 s (80 s; more time because the team must remember the code and talk through every stone). Closest other rooms (`check:unique`): 9-5 50%, 9-6 62%, 9-7 53%, 9-8 53%, 9-9 61%, 9-10 68% (5-2, which is also a room on two floors); 9-10 is 42% or less like 6-10 and 7-10.

**Lessons worth keeping:**
- A lift that waits one tile above the floor blocks the walkway beside it: someone who drops next to it must hop over it or land on it.
- A room with a 4-tile ceiling cuts every full jump short. A floor where players must jump pools needs 5 tiles of air above it, the same as a leap over a friend.
- A ferry seen by only one player makes a good "blind drop": the one who can't see it walks off the ledge when the partner says "now".

### 16.13 Chapter 10: The Crumbling Wing 🔒 (the Trials)
*Approved by the owner and built 2026-11-10.* Sketches: [`docs/levels/chapter10.png`](levels/chapter10.png). The first of the Trials (16.7, R1–R5): a bonus chapter behind the "Bonus levels" tile, open once either player has finished 9-5. New here: **crumbling stones** (16.7, K1–K6). A paid chapter (12.6).

**Relaxed on purpose (R3):** D2 (10-3 to 10-5 mix crumbling stones with Don't touch, Different eyes, lifts and crushing gates) and D11 (no breather level). Everything else holds.

Four ways the chapter uses a crumbling stone:
- **A bridge you can't stop on**, and that your friend can't use for about 6 s after you.
- **A single stone as a step:** land, and jump again within 0.7 s.
- **A floor that is a door:** walk over it from above and it opens a hole for your friend below (for 5 s); stand on it and you drop through yourself.
- **A wall you dig through:** a column of stones from the hall above down to the floor. Stand on top and you sink through it block by block, which opens the wall below for a few seconds.

| # | Name | What it asks | How it plays |
|---|---|---|---|
| 1 | **Fragile Bridge** | The mechanic alone: bridges and one single stone | Two lanes. Each crosses a 6-tile crumbling bridge to a solid island, then hops over one single stone to the far bank. He holds his island button for her gate; past it she holds a button for his. |
| 2 | **Give Way** | A crumbling floor is a door | She holds the button for his lift. Upstairs he walks over the crumbling floor above her step, and she jumps up through the hole before it grows back. Then a second lift to the top, three single stones to hop, and a crumbling floor over the door room: stand on it and drop in, then hold the lift for your friend. |
| 3 | **Steam on Thin Stone** | Don't touch on one path | They start at opposite ends of one path of three crumbling bridges and two islands, and must swap sides. One waits on an island; the other runs the middle bridge and leaps over them. A bridge your friend just used is gone, so you wait for it. Then a button-and-gate swap up to the doors. |
| 4 | **Blind Bridge** | Different eyes | Each lane's crumbling stones are seen only by the partner; the pits and the solid island are seen by both. You can't stop to listen on a stone you can't see, so your friend describes a whole stretch first ("two stones, a gap of two, one stone, a gap of two"), and then you run it from memory. |
| 5 | **The Collapse** | Exam: dig, run through, leap, with Don't touch | She holds the button for his lift. Up top he sinks through the crumbling column, which opens the wall in the hall below. He steps onto the gate button; she runs through the open wall before it grows back and, in the same run, leaps over him through the gate. Then he leaps over her (after her stones grow back), and a last lift is held from below, then from the door room. |

**Fairness notes:**
- What is under every crumbling stone is visible before you step on it (a pool, or a floor): K level rules.
- In 10-4 the hidden stones never hide a danger: the poison is seen by both (E2, E3). Not seeing your own stone shake is the level's point; the solid islands seen by both are the places to stop and listen (E1).
- In 10-3 and 10-5 (Don't touch) nobody is asked to pass a moving friend: every leap is over a friend who stands still on solid ground (T level rules).
- **Known cost in 10-5:** if she misses the open wall (about 4 s), he is on the far side and she is not, so the team restarts from the pause menu. Accepted for an exam level: restarts are instant (11.2).
- No pit is 5 tiles wide: with a bridge gone, a pit is either a clear 4-tile jump or clearly too wide (7.7).

**Proven winnable:** every level passes the route robot with all gems (so every gem can be reached), with Don't touch on in 10-3 and 10-5. **Star times** are first guesses (D12): 25, 60, 50, 60 and 70 s. 10-4's allows for the talking.

**Still needed (D12):** a playthrough by two people on two phones. The robot proves each level can be won, not how hard it feels; 10-1 is the gentlest on purpose, since it shows the new mechanic alone.

#### Ten levels (2026-11-14, 16.7 "The road to 100 levels", H1, H4)
Levels 10-6 to 10-10 are new and come after 10-5. Each takes a proven Don't touch or Different eyes level and turns some of its stone to crumbling stone, adding one idea at a time up to the exam:

| # | Name | Based on | Mix | How it plays |
|---|---|---|---|---|
| 6 | **Dust Relay** | 8-4 | C + T | The relay through two gates, with the floor around each gate turned to dust over poison. The buttons stand on solid stone; whoever leaps over the holder lands on dust and must keep going. |
| 7 | **Hold On a Second** | 8-1 | C + T | Swap sides without touching, but the shelf she waits on crumbles: he waits beside it and runs under her the moment she lands (or as she jumps); when it falls she drops behind him. |
| 8 | **Blind Dust** | 5-5 | C + E | Blind Trust with every hidden stepping stone crumbling: you cross stones you can't see without stopping, guided. |
| 9 | **Steam and Dust** | 9-2 | C + E + T | Cross toward each other on hidden crumbling stones, one at a time: they fall behind the first one across, so the second waits until they grow back. |
| 10 | **The Last Collapse** | 8-10 | C + E + T | The exam: the hidden shelf she waits on crumbles too, there is the one-person lift, and the relay gate stands on dust over the hall below. |

**Timing measured (fairness, 13.2):** in 10-7 and 10-10 he may start running under the shelf up to 0.8 s after she leaves the ground (about 0.6 s after she lands) and still be clear when she drops; the shelf's shake is the warning, and he can start as soon as he sees her jump. Every leap over a friend keeps at least 2.5 tiles of clearance.

**Proven winnable:** all ten pass the route robot (with Don't touch on where the level has it), and every gem in 10-6 to 10-10 is collected on the way. **Star times** for 10-6 to 10-10 are first guesses (D12): 40, 35, 70, 50 and 80 s.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14, "What HARD means")

All ten levels of Chapter 10 got a brand-new room. Every room starts from its own shape (a staircase, a pit crossed twice, two low halls over a narrow chasm, a tower of two shafts, a shaft beside two floors, two floors with a gap, a zigzag of three floors, islands, a hall over a crawlway, three floors over a lake), and each level keeps its mix from the ladder (H4).

C = crumbling stones, E = Different eyes, T = Don't touch. Buttons, gates and lifts are in every level.

| # | Name | Mix | The room | The plan the team must find | Which kinds of hard | Tightest window |
|---|---|---|---|---|---|---|
| 1 | **Crumbling Stairs** | C | A staircase of five single stones rising over a poison drop to a door ledge. | He holds the top gate from the bottom while she runs the stairs; she can't stop on any stone. At the top she holds the gate for him once the stones have grown back. | do (five stones in a row, no stopping), together | 0.65 s on each stone (land and leave) |
| 2 | **Race the Gates** | C | A pit with a high ledge on the left, a ledge in the middle, a long bridge across the top and a door ledge on the right. | Two runs nobody can stop, one each. He holds her first gate; she climbs three single stones to the middle ledge, and he must leave his button the moment she is through and race up three single stones to open the middle ledge's gate before she gets there. Then she holds his gate; he runs the bridge at the top, and she must race over a stone to open the door gate before he reaches it (he can't wait on the bridge, and below its end is poison). | figure out (who runs, who races), together, do, hold (about 13 timed steps) | 0.5 s (when he leaves his button) and 0.8 s (when she leaves hers) |
| 3 | **Leapfrog on Dust** | C + T | Two low halls (too low to leap over a friend) on either side of a narrow chasm over a poison cave; only the chasm is tall, and its one stone crumbles. | He lets her out of the right hall, she lets him out of the left one. Each door is on the far side of the chasm, so they must swap: he hops onto the crumbling stone and she must leap over him at once, before the stone drops him; then he hops on to the other side. Waiting at the edge doesn't help: a friend at the edge can't be leapt (the ceiling there is low). | figure out (the stone is the only way past), together, do | about 0.6 s (her leap, measured from his hop) |
| 4 | **Blind Tower** | C + E | A tower of two shafts side by side over poison, with the doors in a room on top. | Four turns up the tower. He holds her floor gate; she climbs a stone only he can see to her ledge and holds his floor gate; he climbs to his ledge and holds the gate at the top of her shaft; she climbs out and holds the gate at the top of his. Every climb is called out by the one standing still. | figure out (whose turn), together (every climb is called out), do, hold (8 turns, a miss falls into poison) | 0.65 s on each blind stone |
| 5 | **Stone in the Middle** | C + T (exam of 1–4) | Two floors: a shaft of single stones on the left, a lower hall with a pit and a lift, and two low upper halls with a narrow chasm between them. | He holds her gate; she climbs three single stones up the shaft, and he must leave his button the moment she is through and race over the pit to open the gate at the top in time. She sends his lift up from her hall. Then they swap sides over the chasm: she hops onto the crumbling stone and he leaps over her at once. | figure out, together, do, hold (about 12 steps) | 0.65 s (when he leaves his button) and 0.55 s (his leap) |
| 6 | **Run for the Gate** | C + T | Two floors joined by a gap: an upper floor with her two buttons, a lower hall with his gate, and one crumbling bridge to a gated door ledge. | He holds her lift. She holds his gate; past it he can't stop (two single stones, then the bridge), so the door gate must already be open when he gets there. She must step off the first button exactly as he clears his gate and run across her floor (over the lift hole) to the second one. Then she waits on it for the bridge to grow back and he holds the door gate for her. | figure out (two buttons, one of her), together, do | 0.7 s (when she steps off her first button: 0.2 s early would crush him, 0.5 s late and he falls) |
| 7 | **The Low Shelf** | C + T | Three floors on top of each other, one way through: a zigzag. | She holds his gate on the top floor; he drops to the middle floor and holds hers on the bottom floor; she crosses a bridge and two single stones up. Now they must pass each other in a hall too low to leap over a friend. The only way out of her way is a crumbling shelf under a notch, reached from a crumbling stone; she can't wait on her bridge either, so both go on one call and she runs under him. | figure out (the shelf is the only way past), together, do, hold | about 0.8 s for his jump (on the shelf before she arrives; the shelf drops him 0.7 s later) |
| 8 | **Blind Islands** | C + E | Islands in a poison lake; a lift on the middle island rises to the two doors. | Every stepping stone is a single crumbling stone seen only by the partner, so each crossing is called out loud. He crosses first and boards the lift. Her island's button sends the lift up, so she must not step on it until he is aboard; then she must step off so the empty lift comes back, and he holds the button upstairs to bring her up. | figure out (when to step on and off the button), together (blind stones called out), do | 0.65 s on each blind stone |
| 9 | **Trust the Floor** | C + E + T | Two floors: a hall above, a low crawlway below, and a top room with the doors reached by a lift. | She holds his gate from the crawlway. Between them is a crumbling floor only she can see: to him it looks like a hole, so he must run across on her word. It falls behind him and she jumps up through the last hole before it grows back. The lift takes one at a time: he must go first, because the button upstairs (seen only by her) stands between the lift and his door; she must step off the lower button so the lift comes back, and he holds the upper one. | figure out (who rides first, on and off the button), together (a blind run on her word), hold | about 1 s (the jump up through the hole): the hard part is trust and order, not fingers |
| 10 | **The Crumbling Exam** | C + E + T | Three floors: a poison lake at the bottom, a low middle hall over it with pools at both ends, and the door room on top. | He holds the far gate while she crosses three stones only he can see. She sends his lift up; he waits until she is aboard hers and sends it up. In the low middle hall they must swap sides: on her call he steps onto a crumbling stone over the lake and up onto the shelf, and she runs under him over her own crumbling bridge. Her bridge is gone for a few seconds, which is when he calls out her blind climb (her stone over the water is seen only by him); then she calls out his (over the lava). | all four: figure out (lift order, who waits where), together, do, hold (about 14 steps, any slip kills) | 0.65 s on each blind stone; about 0.9 s for her run under the shelf |

**Proven winnable:** all ten levels pass the route robot with every gem (Don't touch on in 10-3, 10-5, 10-6, 10-7, 10-9 and 10-10). Robot times and first star times (about 2.5 to 3 times the robot, more where the players must talk a blind route through or act on one call): 10-1 12.0 s → 30 s · 10-2 7.1 s → 20 s · 10-3 5.4 s → 16 s · 10-5 8.3 s → 24 s · 10-4 6.9 s → 30 s · 10-6 15.6 s → 45 s · 10-7 10.7 s → 30 s · 10-8 12.6 s → 36 s · 10-9 14.1 s → 40 s · 10-10 17.0 s → 50 s. Every level is under 70% alike any other (`check:unique`); the closest pair inside the chapter is 10-5 and 10-8 at 65%.

**How the windows were measured:** the robot never hesitates, so for each step it was made to start late (or at a fixed moment) until it lost. A single crumbling stone gives about 0.65 s from landing to the next jump; two players acting on each other's move were measured the same way.

**Lessons worth keeping:**
- **A crumbling bridge alone never forces hurry.** Whoever waits can always wait 5 s for it to grow back. Real pressure needs a place where someone *can't* stand still (a crumbling floor, a single stone) together with a gate or a person in the way. 10-6 first had this hole: she could simply wait; a second gate she must open in time fixed it.
- **Any tall spot lets a friend be leapt over.** In a Don't touch level, a low hall (4 tiles) prevents leaping, but a notch, a hole or a shaft is tall enough to leap a friend standing 1 tile away. Put pools or crumbling stones where a friend would have to stand for that trick.
- **A button on a one-tile island is pressed the moment you land.** Use that on purpose (10-8: she must not land on her island until he is on the lift), or give the island a second tile.
- **A button upstairs that holds a lift up also stops it from coming back down.** The second rider needs the first to step off, then step on again once the lift is back.

- **The leapfrog on a stone (10-3, 10-5):** make only the chasm tall and keep the halls on both sides low. Then a friend standing at the edge can't be leapt over, so the only way past is to leap while the friend stands on the crumbling stone, which gives a window of about half a second.

**Not done (honest):**
- The robot times are short (5 to 17 s): the robot never hesitates and never talks. The levels are dense chains rather than long ones; a two-phone playtest should check that a team that finished the story needs about 10 to 20 tries.
- 10-9 has no tight timing; it relies on trust and order.
- The star times are first guesses (D12).

### 16.14 Chapter 11: The Hourglass Hall 🔒 (the Trials)
*Built 2026-11-12 (levels 1–5; five more are planned, 16.7 H1).* Sketches: [`docs/levels/chapter11.png`](levels/chapter11.png). The second of the Trials. New here: **timed switches** (16.7, S1–S6). Mechanics are added one at a time (H4): timed switches alone, then with crumbling stones, Different eyes and Don't touch. A paid chapter (12.6). D2 and D11 are relaxed (R3).

Three ways the chapter uses a clock:
- **Press and run:** one press is enough for you, or for both of you, if you don't stop.
- **Too short to make it yourself:** your friend waits at the gate and you press for them.
- **Two clocks at once:** each of you needs the other's clock still running, so you start together ("three, two, one, go").

| # | Name | Mix | How it plays |
|---|---|---|---|
| 1 | **Run!** | timed switches alone | Top: a 3 s switch and a gate 13 tiles and two pools away; one press lets both through. Bottom: a 1 s switch 16 tiles from its gate, clearly too short to make yourself, so she waits at the gate, and behind it a 3 s switch lets her open it for him. |
| 2 | **On Three** | timed switches alone | Two lanes, two gates each. Your own 2.8 s switch opens your first gate; your friend's opens your second. Leave your switches more than about a second apart and somebody's second gate has shut. |
| 3 | **Thin Time** | + crumbling stones | His 3.4 s switch opens her gate and hers opens his. Each gate stands at the end of a path of crumbling stones over poison, so nobody can cross first and wait: both leave together and hop without stopping. |
| 4 | **Count Me Down** | + Different eyes | Left: only he can cross the lava, and only she sees the 2.5 s switch behind it; she guides him onto it, and one press lets both through the gate. Right: only she can cross the water, and only he sees the lift's 4 s switch behind it. He rides up; when the clock runs out the lift comes back for her, and he holds the button on the door ledge. The gate and the lift show their rings to both. |
| 5 | **The Hourglass** | + Don't touch | Exam, three clocks in a row. Bottom: one press, two runners (she waits by the gate and goes first). The lift: she rides while he presses the switch on its shelf; the clock runs out, the lift returns, and she presses for him up top. Top: the last switch is in the corridor: press it and run for the gate, one after the other. |

**Room for lag (S5):** every level is also won by the robot with all clocks 0.5 s shorter. Measured with the robot at full clocks: in 11-2 the two may leave up to about 0.8 s apart, in 11-3 about 1.0 s.

**Lessons while building (keep for the next timed levels):**
- **A timed switch in a corridor is pressed by everyone who walks over it** (like a lever, 16.1). That is wanted for "press and run", and wrong for a switch that must be pressed at one chosen moment: put that one on its own shelf 3 tiles up (11-5's lift switch), like a symbol stone.
- **Never make the only waiting spot the tiles under a gate** (11-4 first had the lift right behind the gate).
- **A "start together" level has a point of no return.** In 11-2 a team that leaves too far apart ends up shut between two gates and restarts from the pause menu; in 11-3 the same mistake is a fall or a crush, which restarts by itself. Prefer the 11-3 kind.

**Proven winnable:** every level passes the route robot with all gems, also with every clock 0.5 s shorter, and 11-5 with Don't touch on. Checked too: 11-1's 1 s switch can't be made alone (the runner arrives at a shut gate, unharmed). **Star times** are first guesses (D12): 30, 20, 20, 60 and 55 s.

**Still needed (D12):** a playthrough by two people on two phones, above all for 11-2 and 11-3, where the count-in happens over a voice call.

#### Ten levels (2026-11-16, 16.7 "The road to 100 levels", H1, H4)
Levels 11-6 to 11-10 are new and come after 11-5. They put the clocks together with crumbling stones (C), Different eyes (E) and Don't touch (T), up to all four in the exam.

| # | Name | Mix | How it plays |
|---|---|---|---|
| 6 | **Close Behind** | S + C + T | New. He stands on a 4 s switch; then both run at once across a 12-tile crumbling bridge to the far gate. The bridge falls 0.7 s behind her, so he must stay close behind her without touching: single file, same speed. |
| 7 | **Blind Seconds** | S + C + E | 11-3 with each timed switch seen only by the partner, who talks you onto it before the count. |
| 8 | **Dust Hourglass** | S + C + T | 11-5 with the run to the first gate on dust over poison. She crosses first to wait by the gate, so he waits for the dust to grow back before he presses. |
| 9 | **Hidden Hourglass** | S + E + T | 11-5 with the switches you press seen only by your partner (his first switch and the lift switch only by her, her top switch only by him). |
| 10 | **The Last Hourglass** | S + C + E + T | 10-10's exam with a timed relay: he stands on a 2 s switch while she leaps over him through the gate, then he follows before it shuts, hopping the dust that fell under her landing. She is ahead, so she takes the far door. |

**Timing measured (13.2, S5):** in 11-6 he may start running up to about 0.3 s after her or 0.2 s before her (start too early and you run into her, too late and the bridge is gone); the easiest way is for her to go and him to follow. Every level also passes with every clock 0.5 s shorter, and every leap over a friend keeps at least 2.97 tiles of clearance.

**Proven winnable:** all ten pass the route robot, and every gem in 11-6 to 11-10 is collected on the way. **Star times** for 11-6 to 11-10 are first guesses (D12): 35, 25, 60, 60 and 80 s.

**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14, "What HARD means")
All ten levels of Chapter 11 got a brand-new room (none was kept: the old 11-4, 11-5 and 11-6 rooms were plain and the robot won them in seconds). Each level keeps its place on the ladder (H4). The solutions are in `tools/routes/ch11.ts`. "Spare time" is how much the clock may lose and the robot still wins: about what a person gets beyond a perfect run.

| # | Name | Mix | The room | The plan the team must find | Which kinds of hard | Spare time on the tightest clock |
|---|---|---|---|---|---|---|
| 1 | **The Clock Tower** | S | A tower in the middle, doors on top; his stair on the left, her lifts on the right | Round 1: she holds her switch (his two gates), steps onto her lift, and only then he steps on his stair switch (her lift) and climbs before her clock runs out. Round 2 the other way: he holds her gate, boards his lift, then she presses and runs. | figure out (who goes first each round), together, do, hold (12 steps) | 0.65 s |
| 2 | **The Sinking Bridge** | S | A ring around a block; the doors sit under two hatches | He presses the long clock far down and climbs; she presses the short clock up top, but it also sinks the bridge he crosses: she must wait until he is across, then press and run. Both drop through both hatches. | figure out, together, do | 0.65 s |
| 3 | **The Pit** | S + C | A poison pit with two islands and a pillar | Over crumbling stones to the islands on three (each opens the other's gate); she leaves her switch onto his lift before he presses; then one press on the pillar and both up the crumbling bridge in single file. | together, do, hold | 0.70 s |
| 4 | **Count Me Down** | S + E | Three floors joined in a zigzag | Bottom: three gates in a row and three shelf switches only he sees: she presses them blind, long clock first, short last. Middle: he wades the lava to a switch only she sees, then runs back before the lift goes up. Top: she wades to a switch only he sees and both run for the gate. | figure out (order of clocks), together, do, hold | 0.65 s |
| 5 | **The Steam Stair** | S + T | A staircase over poison, a lift, a low top corridor | One press, then up the stair in single file (she in front, he close behind, no touching). On the low top corridor nobody can pass, and her door is the far one, so she must ride up first. She brings him up with the switch by the doors and gets past his door before he arrives. | figure out (who rides first), together, do, hold | 0.75 s |
| 6 | **Pillar Hop** | S + C + T | A row of one-wide switch pillars over poison | Each pillar opens the gate one pillar further on, and only one fits on a pillar. He must end in front, so he hops over her once, then they step forward in turn ("you step, I step") before each clock runs out, and finish on crumbling stone in single file. | figure out (one leap, where), together, do, hold | 0.70 s (the dust run: about 0.4 s) |
| 7 | **Blind Bridges** | S + C + E | Two towers joined by crumbling bridges | Each crosses a bridge only the other can see, both on one count (each switch opens the other's gate). Then she presses a switch only he sees, which sends his lift up and opens the gate by the doors, and runs the top bridge (also unseen) while he rides. | together, do, hold | 0.70 s |
| 8 | **The Valley Lift** | S + C + T | A valley: a one-wide lift on an island, dust bridges | His press sends her up the lift and opens his gate: he must cross the dust before it shuts. Up top she holds his gate, but the switch is on his way to his door: she must let go as he starts over the dust and get past his door before he arrives. | figure out, together, do | 0.70 s |
| 9 | **No Passing** | S + E + T | A hall of low tunnels (nobody can pass) and open rooms | Her door is the far one, so she must go in front: he presses the first switch (only she sees it). In the open middle only he sees the lava and calls her jump. He climbs to the second switch (only she sees it) and runs after her through the last gate. | figure out (order), together, do | 0.70 s |
| 10 | **The Hourglass** | S + C + E + T | An hourglass: two chambers and a narrow neck with two hatches | Each presses a far switch only the other sees; she drops through the neck first, he half a second later before the hatches shut, both off the dust. She waits by the doors' gate; he runs over dust only she sees to a switch only she sees, then jumps back over two holes before the gate shuts. She takes the far door. | all four | 0.75 s |

**Proven winnable:** all ten pass the route robot with every gem, also with every clock 0.5 s shorter. Robot times: 7.8, 8.5, 6.1, 18.4, 13.6, 6.9, 8.3, 5.7, 4.8 and 7.9 s. **Star times** (first guesses, about 2.5–3× the robot): 22, 25, 18, 50, 38, 20, 24, 18, 15 and 24 s. Look-alike check: every level is under 70% (the closest are 11-6 ~ 3-4 at 68% and 11-9, 11-10 at 62%); inside the chapter the closest pair is 11-8 ~ 11-6 at 58%.

**Lessons worth keeping:**
- **A clock only adds pressure when someone has to leave the switch.** If the presser can just stand on it, the clock does nothing. Make the presser leave: their own gate is on the same clock, they must board a lift before the partner presses, or the switch is on the partner's way to their door.
- **One clock, two jobs** makes a puzzle by itself: the switch that opens the hatch also sinks the bridge (11-2), the switch that holds his gate is on his way to his door (11-8).
- **Under Don't touch, a low ceiling plus a far door decides the order** of the two (11-5, 11-9): nobody can pass in a low tunnel, so the one going to the far door must be in front from the start.
- **A switch in the walkway is pressed by whoever walks there** (11-3 first had his lift switch where he arrived, so the lift left without her).
- **The robot cannot jump from a shelf right under a ceiling**; walk off it instead. A lift coming down pushes anyone standing at its edge into the shaft: wait one tile away.
- **The level checker's "4-tile ledge" warnings in pit levels** come from the bottom of the poison (not a real climb). The 5-wide "almost" gaps were made 6 (11-4's lava, 11-8's top bridge).

**Still to watch (D12):** robot times are short (5–18 s) because the robot never hesitates; every level is a chain of hand-offs that people will need to talk through. 11-1: if she misses her lift, he is left on his shelf and the team must restart from the menu (a shut-in, not a death). 11-6: the follower on the dust has only about 0.4 s to spare. 11-8 and 11-9 are the shortest and most likely to feel too easy.

### 16.15 Chapter 12: The Rising Dark 🔒 (the Trials)
*Built 2026-11-12 (levels 1–5; five more are planned, 16.7 H1).* Sketches: [`docs/levels/chapter12.png`](levels/chapter12.png). The third of the Trials. New here: **the rising tide** (16.7, V1–V6). Mechanics are added one at a time (H4): the tide alone, then with crumbling stones, timed switches, Different eyes and Don't touch. A paid chapter (12.6). D2 and D11 are relaxed (R3).

Every level is a climb. Both bottom 4 × 4 corners are solid stone and the poison lies between them, visible from the first second. The tide starts with the first move, so the team can plan on the call for as long as it likes, and it stops under the door ledge, so reaching the doors is always safe.

| # | Name | Mix | How it plays |
|---|---|---|---|
| 1 | **Higher Ground** | the tide alone | Each climbs to a side ledge. The button on each ledge opens the gate on the other one; the first through climbs to the middle ledge and holds a button there for the second. The doors are one more climb up. |
| 2 | **Burning Bridges** | + crumbling stones | The only way up is two single crumbling stones. One holds the gate from the bottom while the other climbs; from the door ledge the first then holds the gate, and the second climbs the moment the stones are back, with the poison at their heels. |
| 3 | **Last Breath** | + timed switches | The lift rests up top. A 2.5 s switch brings it down; when the clock runs out it rises with whoever is on it, so the presser runs and jumps aboard. Up top, a 3.2 s switch on the right ledge opens the gate on the left one: one waits at the gate, the other presses and runs across the lift. |
| 4 | **Trust Fall** | + Different eyes | Two ledges on each side are seen only by the partner. You describe them before anyone moves; once someone does, each has a few seconds to jump onto a ledge they can't see. The middle platforms and the door ledge are seen by both. |
| 5 | **Keep Your Head** | + Don't touch | Exam so far. They climb onto one long ledge from opposite ends and must swap sides: one stands still, the other leaps over. Then he holds the button for her gate on the door ledge, and from up there she holds the button for his. |

**How fast the tide is.** Speeds were set with the robot, by finding how much faster the tide could rise before the robot's own run fails: 12-1 3.75×, 12-2 1.75×, 12-3 2×, 12-4 4× or more, 12-5 2×. The rule (V5) asks for at least 1.25×. The robot never hesitates, so these numbers are the room a real team has for talking and small mistakes.

| # | Rests at | Speed (tiles/s) | First deadline after the first move |
|---|---|---|---|
| 1 | y 15 | 0.3 | off the start ledge in about 4 s, off the side ledges in about 14 s |
| 2 | y 16.4 | 0.2 | off the bottom in about 13 s (the stones need about 7 s to come back) |
| 3 | y 16.2 | 0.2 | on the rising lift within about 12 s |
| 4 | y 15 | 0.35 | onto the first hidden ledge in about 4 s |
| 5 | y 15 | 0.25 | off the long ledge in about 17 s |

**Fairness notes:**
- In 12-4 the hidden things are ledges, never dangers; the tide is seen by both (V3, E2).
- In 12-5 the only pass is a leap over a friend who stands still (T level rules).
- 12-3's two clocks are also proven 0.5 s shorter (S5), together with the faster tide.

**Proven winnable:** every level passes the route robot with all gems, also with the tide 1.25× faster, and 12-5 with Don't touch on. `npm run check:custom` confirms the solid corners and the visible resting poison for all five. **Star times** are first guesses (D12): 30, 35, 40, 45 and 45 s.

**Still needed (D12):** a playthrough by two people on two phones. The tide speeds are the first thing to tune after it.

#### Ten levels (2026-11-16, 16.7 "The road to 100 levels", H1, H4)
Levels 12-6 to 12-10 are new and come after 12-5. Each builds on one of this chapter's own climbs (so the tide's rules already hold: solid bottom corners, the poison visible from the start) and adds more of the other mechanics, up to all five in 12-10.

| # | Name | Based on | Mix | How it plays |
|---|---|---|---|---|
| 6 | **Dust and Tide** | 12-3 | R + C + S | The near half of the right ledge is dust. He walks out to the timed switch, the dust falls behind him, and he must wait for it to grow back while the poison climbs, then press and run back across it to the gate. |
| 7 | **Blind Breath** | 12-6 | R + C + S + E | The same climb, and both switches he presses are seen only by her. |
| 8 | **Two Clocks Rising** | 12-5 | R + S + T | Swap sides on the long ledge without touching, then open each other's gate on a 2.5 s clock: each runs through on the other's count. |
| 9 | **Crumbling Trust** | 12-4 | R + C + E + T | Ledges only your partner sees, and every one crumbles under you: jump on and off without a pause as the poison climbs. |
| 10 | **The Rising Dark** | 12-8 | all five | The exam: each timed switch is seen only by the partner, and four tiles of the long ledge are dust, so after she runs over them and leaps over him, he must jump the 4-tile gap she leaves. |

**Time to spare (V5, measured):** the tide could rise 2× (12-6, 12-7), 2.5× (12-8, 12-10) and 4× (12-9) faster before the robot's own run fails; the rule asks for 1.25×. Every level with clocks also passes with every clock 0.5 s shorter, and every pass in a Don't touch level keeps at least 3.4 tiles of clearance.

**Proven winnable:** all ten pass the route robot with every gem. **Star times** for 12-6 to 12-10 are first guesses (D12): 45, 50, 50, 45 and 60 s.


#### Ten levels (2026-11-14, 16.7 "The road to 100 levels", H1–H2)
The finale grew to 10 levels. The vault and the ending are now **9-10** (the table above calls it level 5); finishing it still lights up the heart and opens the Trials. Levels 9-5 to 9-9 are new.

**Where the carvings are (H2).** Off the main path, a blank plaque until someone is near (G9). As in Chapter 7, in two of them the one who sees the carving is not the one standing next to it.

| Level | Dots | Seen by | Where | Who goes there |
|---|---|---|---|---|
| 9-1 | 1 | both | on a shelf over his lane | Hot Boy |
| 9-3 | 2 | Cool Girl | the corner behind the two starts | **Hot Boy** (it is behind him; Don't touch keeps her from walking through him) |
| 9-6 | 3 | Hot Boy | on a shelf above her start | **Cool Girl** (only she is up there) |
| 9-8 | 4 | both | on a shelf above the doors | either |

9-2 and 9-4 lost their carvings; their maps are unchanged. 9-1 gained its one-tile shelf.

**The five new levels** take the exam levels of Chapters 1–4, mirrored, and add the later chapters' ideas:

| # | Name | Based on | Adds | How it plays |
|---|---|---|---|---|
| 5 | **Stones in the Gap** | 4-1 | Different eyes | Gate pillars over poison that only he sees; the button that opens his gate also lowers them, so she must be across first. |
| 6 | **The Bridge Below** | 2-2 | Don't touch, carving 3 | He holds her gate from below; she crosses a bridge and walks over the lever that turns it into a hole, so he can climb up behind her. She is ahead, so she takes the far door. |
| 7 | **Ferry in the Fog** | 1-5 | Don't touch, Different eyes | The ferry crosses while either button is held, and each one's button is seen only by the other. A lever off the ferry opens the gate to the door ledge; he climbs first, then she does. |
| 8 | **The Old Machine** | 3-5 | Different eyes, carving 4 | The Deep Machine: a sinking lift, a lever behind water and one behind lava, stairs held by a button and locked by a lever only he sees. |
| 9 | **The Summit Again** | 4-5 | Don't touch, Different eyes | One rune moves the pillars and both lifts; the pillars are hidden from her. Up top he takes the far door first, so she can rise beside him without touching. |

**Kept fair:** in the Don't touch levels the two are never side by side closer than 4.67 tiles apart in height, and in 9-9 never side by side at all. The robot also proves the shortest winning route never reads a carving (3.5 to 4.9 tiles away; they light at 2.6).

**Proven winnable:** all ten pass the route robot, every gem in 9-5 to 9-9 is collected on the way, and the vault still opens with 45 codes. **Star times** for 9-5 to 9-9 are first guesses (D12): 45, 45, 50, 70 and 70 s.
**Note:** the "Ten levels" table above describes the rooms before the remake; the remake below replaces them.

#### The remake (2026-11-17, D14, "What HARD means")
All ten levels of Chapter 12 got a new room (none was kept: the old rooms were dashes or copies). R = the rising tide, C = crumbling stones ("dust"), S = timed switches, E = Different eyes, T = Don't touch.

| # | Name | Mix | The room | The plan the team must find | Which kinds of hard | Tide speed and where the robot loses |
|---|---|---|---|---|---|---|
| 1 | **Three Ledges** | R | Three long ledges zigzag up the whole room; both start on the bottom corners. | He goes up first while she holds the square button low on the right; from the top he holds it for her; then the doors are shut by a circle gate: one goes back to the far end of the middle ledge (under the tide's top) while the other walks in and holds the inner button. | figure out, together, hold | 0.31 tiles/s; robot loses at 2.0× |
| 2 | **Spent Stones** | R + C | A small island in the middle; crumbling stairs and a bridge of dust on the left, a water step and a ledge on the right, doors on a high shelf. | He waits on a low shelf just above the poison, holding her way up; she holds the gate on his dust bridge; he must cross stairs and bridge without stopping; then she has to go back DOWN to the low water step to open the door gates for him, and he lets her back up from inside. | figure out, together, do, hold | 0.40; loses at 1.5× |
| 3 | **The Well** | R + S | A deep well in the middle with one wide lift; closed rooms left and right with a low step each. | One sends the lift up from the floor with a timed switch; the other calls it back up from the top; but the doors' gate has its switch down low, so the last one must press it BEFORE riding, and the partner must call the lift on the word "now" (the clock leaves about one second). | figure out, together, do, hold | 0.38; loses at 1.5× |
| 4 | **Islands in the Dark** | R + E | Small floating islands over the poison; the doors on a wide island at the top. | They cross the low islands in opposite directions; each sees the islands the other needs and must call them out. He stops on a low island (only he sees its button) to open her last gate; she holds his from the door island. | figure out, together, do, hold | 0.35; loses at 1.5× |
| 5 | **Twin Chimneys** | R + T | Two chimneys in solid rock, joined by one window; a water step in the left one, a lava step in the right. | Each starts in the wrong chimney: they swap through the window, one standing still while the other leaps over. Then three holds in turn: he goes back down to the bottom of her chimney to open her step, he opens her door ledge from the lava step, she opens his. | figure out, together, do, hold | 0.36; loses at 1.5× |
| 6 | **The Pyramid** | R + C + S | A stepped pyramid in the middle, doors on its top; thin moats on both sides; a low tunnel runs through the third step; the top step's outer edges are dust. | She always climbs first, he always holds: he holds her first gate from the bottom step; she must run through the tunnel to his side to open his gate on a clock; he holds the star while she goes back; from the top step she opens his last gate on a clock. | figure out, together, hold | 0.60 (rests at y 15.6); loses at 1.55× |
| 7 | **Two Lanes of Dust** | R + C + S + E | Sideways before up: a long low lane of dust over the poison and a long high lane of dust, the doors at the top left, a short climb at each end. | One clock opens the gates at the far ends of BOTH lanes, and its switch is at the start of her lane: he must first climb to the start of his lane (on a step only she sees) and only then may she step on; then both run their dust lanes at the same moment; she climbs at the far end on steps only he sees. | figure out, together, do, hold | 0.45 (rests at y 16.4); loses at 1.5× |
| 8 | **The Diamond** | R + S + T | A diamond: a low step on each side, a crossing landing in the middle, a water step and a lava step above it, the door shelf on top with a gate before each door. | Each starts on the wrong side: they meet on the landing, one stands still, the other leaps over; each drops back down toward the poison for a gem; then each climbs the step only they can stand in. On the shelf her switch opens his gate and his opens hers, on 1.2 s clocks: they must step off together ("on three"). | figure out, together, do, hold | 0.37; loses at 1.5× |
| 9 | **Single File** | R + C + E + T | A three-quarter spiral round a big block: a low tunnel floored with dust under the block, a short climb at the right end, the door ledge on top of the block. | They must run the dust tunnel one right behind the other without touching (close up first: the follower may be at most about half a second behind, or the stones are gone), and six of its stones are seen only by him while she leads. She stops on the button at the tunnel's end, just above the poison, while he climbs (on a step only she sees) and holds the inner button by the doors; then she climbs and leaps over him to the far door. | figure out, together, do, hold | 0.34 (rests at y 16.4); loses at 1.5× |
| 10 | **High Tide Crossing** | R + C + S + E + T | A big plus sign of air: a floor on each side, a well in the middle with two single dust posts, a gated ledge high on each side, two blocks on top with the doors on the left one. | She must first cross the well on a dust bridge only he can see. Then each stands on a switch that opens the other's ledge gate and they step off together (1.6 s clocks); each hops a single dust post that only the OTHER can see and jumps straight on. On top, she holds the far button while he walks in PAST the doors to the inner button (so nobody has to pass anyone), and she hops the hidden dust stones across the well to her door. | figure out, together, do, hold | 0.60 (rests at y 14.6); loses at 1.55× |

**Proven winnable:** all ten pass the route robot with every gem, with the tide 1.25× faster and, where there are clocks, every clock 0.5 s shorter; 12-5, 12-8, 12-9 and 12-10 with Don't touch on. `custom_check` passes all ten; `unique_check`: every level is under 70% like any other level (closest: 12-5 66% like 3-4, 12-6 65% like 3-4, 12-10 64% like 11-10, 12-3 61% like 12-10). Robot times and star times (first guesses, D12): 12-1 14.4 s / 40 s, 12-2 10.6 / 30, 12-3 13.0 / 35, 12-4 9.0 / 25, 12-5 7.2 / 22, 12-6 7.4 / 22, 12-7 6.9 / 20, 12-8 8.3 / 25, 12-9 11.2 / 30, 12-10 9.3 / 28.

**How tight it is (besides the tide):** 12-3 the doors' clock leaves about 1.1 s; 12-7 the lane clock about 0.8 s; 12-8 the two door clocks 0.65–0.8 s if both step off together; 12-10 the two ledge clocks 0.65–0.8 s; 12-9 the follower in the dust tunnel may be at most about half a second behind the leader. Every other step is a hold, so it has no clock.

**Lessons worth keeping:**
- A timed switch only matters if the one who presses it cannot just stay on it: give the presser a run of their own (12-7: she presses and runs her lane), or make two people step off two switches together (12-8, 12-10). Otherwise it is a plain button.
- The tide only presses when someone has to WAIT low: put a hold or a switch just above the poison (12-2, 12-4, 12-9). The speed rule then gives a real deadline; without it the robot is never near the poison and the tide stays slow.
- The resting height is a second dial: lowering where the tide rests (y 16.4) or raising it (y 14.6) moves the robot's losing point when the speed is already at the 0.6 cap or too slow.
- A ledge 4 rows above a floor bumps your head: never put a jump's take-off under a ledge (it cut half the first drafts short). A button over a pool does not work (the feet sink into the pool cell).
- Dust under a low ceiling is a good "must keep running" lane; dust in single file with Don't touch makes the follower stay close but not too close (12-9).
- The robot still finishes most levels in 7–14 s, because it never talks. A real team needs the planning and the calling-out; that is where these levels are hard, so watch the first playtests for the number of tries, not the clock.

### 16.16 Chapter 13: The Last Trial 🔒 (the Trials)
*Built 2026-11-16.* Sketches: [`docs/levels/chapter13.png`](levels/chapter13.png). The end of the Trials and of the road to 100 levels (16.7, H5): **every mechanic in every level** (the rising tide, crumbling stones, timed switches, Different eyes and Don't touch), and **its own team code**: one carving in each of levels 1–4, off the main path, and the vault in 13-5 above the tide's highest point, after every danger. Once the team is in the vault nothing can hurt them, so a death never makes them enter the code again. A paid chapter (12.6). D2 and D11 are relaxed (R3).

| # | Name | Based on | How it plays |
|---|---|---|---|
| 1 | **The Ascent** | 12-1 | Each side ledge has a 3 s timed switch for the other side's gate, seen only by the partner; the middle ledge is part dust; the doors moved to the right, so whoever arrives first goes up first and nobody passes anyone. |
| 2 | **Two Shores** | 12-5, mirrored | She runs over the dust and leaps over him, he jumps the 4-tile gap she leaves; each climbs a side ledge only the other sees; each opens the other's gate on a 2.5 s clock. |
| 3 | **Falling Stars** | 12-9, mirrored | Each starts standing on a timed switch that holds the other's first gate open, so you leave together; then hidden crumbling ledges up to the doors. |
| 4 | **Mirror Image** | 13-1, mirrored | The Ascent turned around, with the poison rising faster. |
| 5 | **The Last Trial** | new | Below: crumbling steps off the start corners (hers seen only by him) to the long ledge, where the poison stops. Her switch on the ledge (only he sees it) opens his trapdoor into the vault for 3 s; inside, his switch (only she sees it) opens hers. Above: the split vault of 6-10, out of the poison's reach. The code opens both gates onto the doors. |

**Where the carvings are (H2):**

| Level | Dots | Seen by | Where |
|---|---|---|---|
| 13-1 | 1 | both | on a shelf above his start (a climb nobody needs, with the poison coming) |
| 13-2 | 2 | Cool Girl | on a shelf over the long ledge on his side: she sees it, he climbs to it |
| 13-3 | 3 | Hot Boy | on a shelf above her first hidden ledge: he sees it, she jumps to it and on to her next ledge |
| 13-4 | 4 | both | on the shelf above his start, now on the right |

**Measured (fairness):** the tide could rise 2.25× (13-2) to 4× (13-3, 13-5) faster before the robot fails (the rule asks 1.25×); every level also passes with every clock 0.5 s shorter; every pass in these Don't touch levels keeps at least 3.4 tiles of clearance (13-1, 13-3, 13-4 and 13-5 never put the two side by side at all). The shortest winning route never reads a carving (2.7 to 4.1 tiles away; they light at 2.6; 13-2's is the closest call).

**Notes from building 13-5:** each trapdoor stays an open hole for the rest of its 3 s clock, and half of each player's stones are across it, so you wait the 3 s before entering the code. His switch inside the vault sits at the far end of his half, away from the stones, so entering the code can never open her trapdoor under her. Even if someone steps on it again, falling through only lands on the long ledge above the poison: never a death, so the stones already entered stay down.

**Proven winnable:** all five pass the route robot with every gem, and the vault opens with the test code and 45 others (one side only, repeats, 40 random), with the tide on. **Star times** are first guesses (D12): 50, 60, 45, 45 and 120 s.
**Note:** the tables above describe the rooms before the remake; the remake below replaces them (13-5 keeps its vault).

#### The remake: SUPER HARD (2026-11-21, D14, "What HARD means")
All five levels were rebuilt. 13-1 to 13-4 are brand-new rooms; 13-5 keeps its vault (and the code, H5) but got a new, harder climb. Every level has the tide, crumbling stones, timed switches, Different eyes and Don't touch, and **one trick the team has never seen** (SUPER HARD). The solutions are in `tools/routes/ch13.ts` (13-5's in `tools/routes.ts`, `lastRoute`).

| # | Name | The new trick | The room | The plan the team must find |
|---|---|---|---|---|
| 1 | **The Hatch** | **Break the dust under your own feet so your friend can jump up through the hole.** | Two closed cells, each with a two-stone dust hatch in its roof; a bridge on lava above (only he can stand there). The doors are on the "wrong" sides. | He holds her gate from a low step by the poison (the button only she sees) while she climbs onto the roof of his cell. On his word she leaves the timed switch (only he sees it) that opens BOTH cells, and both run for their cell before it shuts: she over his hatch, which falls behind her. He jumps up through it, climbs onto the lava bridge while she holds its gate from inside her cell (the button only he sees), walks over her hatch to his door, and she jumps up to hers. Each passes over the other once. |
| 2 | **Keep It Running** | **Keep the clock alive: leave the switch, do a job elsewhere, and get back before it runs out.** | A wide gap with a ferry; a gate hangs over its path; the doors high on his side. | He powers the ferry from his side to bring her over, but the gate's button is up on a shelf: he must leave the switch, hold the button while she passes, and be back on the switch before its clock runs out, or the ferry turns back and the closed gate scrapes her off. Both switches are seen only by her: she calls them out from the ferry. Then her door is the far one, behind a gate whose timed switch he presses once she is at it, and the way up is two single dust steps: she must land on one and leave him the other. |
| 3 | **Before It Drowns** | **A lever the poison will take: whatever it shows then stays for good.** | Her lift on the left, his climb on the right, the doors on one shelf above. | The lever just above the poison drives her lift (on: up) and his bridge (on: a 6-wide hole). He flips it on when she is on the lift (only he sees the lift, only she sees the lever), and once she is off at the top, flips it off again before the poison gets there, and climbs. A timed switch on his first ledge (only she sees it) opens the gate to her door: from then on he must get up, leap over her (she waits on the stone, not on the dust he must not land on), and she must run through before it shuts. |
| 4 | **Falling Swap** | **The only place to pass is over crumbling stone: the one standing still stands on it.** | A long low tunnel where nobody can pass; a skylight in the middle whose floor is dust over the poison; doors split by a pillar. | Each starts on the timed switch (only the other sees it) that opens the other's way into the tunnel, so both leave on three. They start on the wrong sides, so they must swap under the skylight: one steps onto the dust just as the other jumps, and steps off the moment the leaper is over, before it falls. Only he sees the dust: to her it is a hole, and she steps out over it on his word. |
| 5 | **The Last Trial** | **One switch opens both trapdoors: press it, send your friend up, then run for your own** (and the vault, H5). | As before: crumbling steps from the corners, a long low ledge under the vault, the split vault above. Now the poison rises until it is just under the vault floor. | One timed switch in the middle of the ledge (only he sees it) opens both trapdoors into the vault: whoever presses it sends the other up first, then runs to their own trapdoor and jumps up through it before it shuts. Inside, the code as before. |

**Where the carvings are now (H2):**

| Level | Dots | Seen by | Where | Who goes there |
|---|---|---|---|---|
| 13-1 | 1 | both | on a one-tile ledge above his start | Hot Boy |
| 13-2 | 2 | Hot Boy | on a nub above her start | **Cool Girl** (he reads it from across the room) |
| 13-3 | 3 | Hot Boy | on a nub above her start | **Cool Girl** |
| 13-4 | 4 | both | on the tunnel roof at the far right, past his way up | Hot Boy |

**Measured (the robot):**

| # | Robot time | Tide (tiles/s; robot loses at) | Tightest clock (what it may lose) | Star time (first guess, D12) |
|---|---|---|---|---|
| 1 | 8.4 s | 0.65; 1.35× | both cells' clock 1.7 s (0.75 s) | 25 s |
| 2 | 11.8 s | 0.39; 1.35× | the ferry clock 3.2 s (0.7 s) | 32 s |
| 3 | 8.9 s | 0.37; 1.35× | her door clock 3.7 s (0.7 s) | 25 s |
| 4 | 6.1 s | 0.63; 1.35× | the two start clocks 1.2 s (0.6 s); the swap: she may step out from 0.35 s before his jump to 0.4 s after | 18 s |
| 5 | 11.5 s | 0.8 from y 14.3 to 7.6; 1.35× | the trapdoor clock 1.95 s (0.7 s) | 45 s |

**Proven winnable:** all five pass the route robot with every gem, with every clock 0.5 s shorter and the tide 1.25× faster, with Don't touch on; the vault opens with the test code and 45 others. `custom_check` passes all five; `unique_check`: 13-1 67% like 12-1, 13-2 56%, 13-3 57%, 13-4 49%, 13-5 53% (the limit is 80%, the aim under 70%).

**Lessons worth keeping:**
- A dust hatch only works from below if the cell under it is exactly 2 tiles high: the jump then just clears the roof (13-1).
- A timed switch must never stand on dust (the level checker forbids it): put the switch on stone and the dust on the way to it (13-2).
- A lever the poison is about to take is a clock everyone can see, and its last state stays (13-3).
- The leapfrog spot decides who must stand on the dust only if the skylight is about one leap wide (13-4).
- Raising where the poison rests (y 14.3 instead of 15) is the dial when a tide is already at the 0.8 cap (13-5).

**Still to watch (D12):** the robot finishes in 6–12 s because it never talks; every level is a chain of calls ("step on now", "the switch is two stones left") that people must make on a voice call. 13-4's swap and 13-1's run into the cells are the tightest moments. The 30–50 tries goal is for playtests to check.

---

## 17. Design topics ✅
We'll go through these in order and fill in a section for each.

1. ~~Color rules~~ ✅
2. ~~Design pillars and hard limits~~ ✅
3. ~~Screen and camera~~ ✅ (section 5)
4. ~~Controls~~ ✅ (section 6)
5. ~~Characters, movement and level metrics~~ ✅ (section 7)
6. ~~Game feel catalog~~ ✅ (section 8)
7. ~~Level building blocks~~ ✅ (section 10)
8. ~~The game flow~~ ✅ (section 11)
9. ~~Scoring and progress~~ ✅ (section 12)
10. ~~Online rules~~ ✅ (section 13)
11. ~~Art style~~ ✅ (section 14)
12. ~~Sound and music~~ ✅ (section 15)
13. ~~Level design rules and the first 5 levels~~ ✅ (section 16)

**All design topics are locked. The design phase is complete; next is building, starting with the Feel Lab (section 8.1).**

---

## 18. Decision log
| Date | Decision |
|---|---|
| 2026-10-17 | Name: **Hot Boy & Cool Girl**, set in an ancient jungle temple. |
| 2026-10-17 | Tech: web game (TypeScript, PixiJS, PeerJS), PWA, hosted free on GitHub Pages. |
| 2026-10-17 | Online-only 2-player, friends on both Android and iPhone. |
| 2026-10-17 | Color rules locked; **violet = danger to everyone**. |
| 2026-10-17 | Design pillars P1–P6 and hard limits L1–L6 locked. |
| 2026-10-17 | One level = one screen, no scrolling camera. |
| 2026-10-17 | Controls locked: slide-to-move on the left, tap/hold-to-jump on the right, coyote time and jump buffer. |
| 2026-10-17 | Game feel is built from the first prototype, starting with a Feel Lab (toggle panel, inspired by deepnight's demo). |
| 2026-10-17 | Characters locked: identical movement, run + jump only, walk through each other, forgiving hitboxes. |
| 2026-10-17 | Level metrics locked: levels use standard sizes matched to the jump; every jump is clearly possible or clearly impossible. |
| 2026-10-17 | Art direction: Silksong-style layered depth background. |
| 2026-10-17 | Level building blocks locked: Set 1 (first levels), Set 2 (later), Set 3 (someday); linked mechanisms share a gold rune symbol. |
| 2026-10-17 | Game feel catalog, layered-depth art direction and game flow locked. |
| 2026-10-17 | Scoring and progress locked: 3 team stars per level, no death penalty, finish to unlock, saves on both phones. |
| 2026-10-17 | Level size (32×18 grid), thumb zones, and ledge nudge, head nudge and small step-up locked. |
| 2026-10-17 | Online rules locked: each player owns their character, the host referees the world; hold-to-restart with a fill-ring animation. |
| 2026-10-17 | Character personality: hot-headed Hot Boy vs. cool-headed Cool Girl, stylish not cute (art style locked). |
| 2026-10-17 | Art style locked: characters drawn in code, world in SVG, shader liquids, dynamic lighting. |
| 2026-10-17 | Sound and music locked: sound is never required, code-made sounds, the music is a reacting duet, menu music added; recorded voices planned for later. |
| 2026-10-17 | Level design rules D1–D12 and Chapter 1 (5 levels) locked. **Design phase complete.** |
| 2026-10-17 | **Feel Lab built.** Building it showed that the first jump numbers broke the level metrics (6-tile gaps were jumpable), so the jump starting values changed: 0.30 s to the top (was 0.38) and falling 2× faster (was 1.6×). Max gap is now 4.9 tiles. |
| 2026-10-17 | **First playable slice built:** online play of Chapter 1 levels 1–2 (no mechanisms needed), with home, share link, lobby, results with stars, saving, and the online rules in 13 (host as referee, deaths restart both, hold-to-restart, pause and away icons, waiting and rejoin with the same code, version check, connection dot). For now the lobby and the level map are one screen. Levels 3–5 show "soon" until the mechanisms exist. Music is not in yet. |
| 2026-10-17 | **Chapter 1 complete (levels 3–5):** pressure buttons, levers, moving platforms and gates are in, all linked by gold runes. Both phones run them; your own touches react instantly, and the host corrects platforms and levers 5× a second. Riding a platform looks glued on the partner's screen too. **Lobby and level map are now separate screens** (characters first, then a temple map with a path of level stones). **The duet music is in**: drone and pad, Hot Boy's drums and plucks, and Cool Girl's chimes and arpeggios, each louder while that character moves, plus title, lobby (your own layer until your friend joins), map and results-jingle variations. **Trailing hair and footstep fire added (14.5).** "Design your own level" opened as a new topic (16.3). |
| 2026-10-17 | Level editor **parked for later**; its ideas (sharing in the room and by link, saved on the phone, built-in checks, beat it to share it) are saved in 16.3. |
| 2026-10-20 | **Level designer locked (16.3):** levels are saved on the phone and travel to the friend through the room or a link. A level is **✅ Verified only after two players finish it together online**; the ✅ is tied to the level's fingerprint, so any edit removes it. Only verified levels can be shared by link. |
| 2026-10-20 | **Gates crush:** a closing gate no longer waits for someone standing in the gateway; it crushes them (stone-dust death and a heavy thud), and the level restarts for both like any death. Holding a button for your friend now really matters. |
| 2026-10-21 | **Level 1-5 fixed:** it couldn't be won. The stone block under the doors hung exactly 3 tiles above the floor, a ceiling that made the 3-tile climb next to it impossible. The door ledge is now one tile thick. Lesson: the level checks can't see this; every level needs a route test or a real playthrough (D12). |
| 2026-10-21 | **15 new levels: Chapters 2–4 (16.4–16.6).** Five levels per chapter; the map has a tab per chapter and finishing a chapter opens the next. Each level teaches one new idea built from the existing blocks: swapped levers, trapdoors, crushing relays, two-lever lifts, sinking lifts, button-plus-lever stairs, flooded tunnels, gate stepping stones, counterweight lifts and a trapdoor tower. |
| 2026-10-21 | **Every level is now proven winnable (D13).** A robot plays a written solution for each level with the real physics (`npm run check:routes`). It caught two game bugs: a fully open gate twitched shut every frame (that could crush someone jumping through an open trapdoor), and an open gate still blocked as an invisible line. Both are fixed. An open trapdoor now shows only its end posts, so the hole doesn't look bridged. |
| 2026-10-24 | **Different eyes, E1 (16.7):** players share what only they can see by **voice call only**; no in-game pointing or signals. Hidden things must be easy to describe out loud. |
| 2026-10-24 | **Different eyes, E2 (16.7):** platforms, mechanisms, gems **and dangers** (lava, water, poison) can be hidden from one player; both characters always stay visible. Hidden dangers need a fairness rule (E3) to protect P2. |
| 2026-10-24 | **Different eyes, E3 (16.7):** nothing hidden is ever hinted. On a death, only the thing that killed you flashes into view on your screen, then hides again after the restart. P2 stays unchanged. |
| 2026-10-24 | **Different eyes, warn space and E4 (16.7):** a hidden danger always has walking space before it so the partner can warn in time. Hidden things carry no marking on the seer's screen; players find out who sees what by talking. |
| 2026-10-24 | **Different eyes, E5 (16.7):** hidden things are always real for both players; only the drawing is hidden on one screen. |
| 2026-10-24 | **Different eyes, E6–E7 (16.7):** a level can split the hidden things between the players or give one player all of them; the game never says which, and it stays fixed for the level. In the level designer, each block gets a "Seen by" setting (Both / Only Hot Boy / Only Cool Girl), shown as an eye badge in the editor only. |
| 2026-10-24 | **Different eyes design complete (16.7, E1–E7). Chapter 5 "The Hall of Eyes" planned (16.8):** Invisible Bridge, The Hidden Rune, Watch Your Step, One Pair of Eyes, Blind Trust. Not built yet. |
| 2026-10-24 | **Different eyes and Chapter 5 built.** Each phone draws the level through its own player's eyes: a hidden stone looks like air, a hidden pool looks like plain floor, hidden mechanisms and gems aren't drawn and make no sound. Dying in something hidden flashes just that thing until the restart. The level designer has a 👁 "Seen by" brush, and hidden things travel in share links and count in the ✅ fingerprint (levels without hidden things keep their old fingerprint). Two levels changed while building: 5-2 uses two hidden buttons (no lever), and 5-3 uses hidden pools in both lanes (no lift). All 25 levels pass the route robot. Star times for Chapter 5 are guesses (D12). |
| 2026-10-24 | **Password gates, G1–G2 (16.7):** symbols are hidden across a chapter's earlier levels and the gate is in its last level. The code is entered by walking onto carved symbol stones in order, so controls stay left, right, jump. |
| 2026-10-24 | **Password gates, G3–G4 (16.7):** each team gets its own random code, saved on both phones and kept until the gate opens; then a new one is picked. No in-game journal: players note the symbols themselves. |
| 2026-10-24 | **Password gates, G5–G7 (16.7):** the code is 4 animal carvings from a set of 8, one per level in levels 1–4, entered in level order (dots under each carving). A wrong stone just resets the stones; no death. |
| 2026-10-24 | **Password gates, G8–G10 (16.7):** the 8 gate stones are split 4 and 4 between the players' sides, so they take turns entering the code. Each symbol is on the main path and glows when someone is near. Both players see all symbols in the first password chapter; mixing with different eyes comes in a later chapter. |
| 2026-10-24 | **Password gates, G11–G12 (16.7):** codes are fully random (repeats allowed, so one player may do all the stepping). Each phone keeps a separate code per friend pair, using a hidden random phone ID. |
| 2026-10-24 | **Password gates, G13–G14 (16.7):** in the password chapter, levels 1–4 each carry a carving and the symbol stones appear only at the level-5 gate. Homemade levels don't get symbol stones yet. |
| 2026-10-24 | **Password gates design complete (16.7, G1–G14). Chapter 6 "The Sealed Vault" planned (16.9):** The First Mark, The Lift Shaft, Resting Hall, Behind the Seal, The Vault. Not built yet. |
| 2026-10-24 | **G14 changed: homemade levels get password gates (16.3, 16.7).** The maker places symbol stones and carvings and sets a fixed pattern (2–4 animals) for that one level; entering it turns a rune on. New level checks cover patterns, stones and carvings; all three count in the share link and the ✅ fingerprint. |
| 2026-10-24 | **G3 changed:** a team's code is replaced when they **finish** the vault level, not when the gate opens, so a death after opening the gate never locks them out. **Level rule added (16.1):** symbol stones sit on their own shelves 3 tiles up with a walkway underneath, because walking across a stone presses it. |
| 2026-10-24 | **Password gates and Chapter 6 built (16.7, 16.9).** Wall carvings glow and chime when a player is near; symbol stones sink, glow and chime, and a wrong one resets them all with a low thud. The host referees the stones online. Each pair of phones keeps its own random code (a hidden phone ID, saved next to progress). The route robot proves 6-5 with 46 different codes and checks every carving is on the path. Test rooms: `?lab=vault`, and `?lab=<level id>` opens any official level in the Feel Lab. Star times are guesses (D12). |
| 2026-10-24 | **Level designer: password tools built (16.3).** Symbol stone and carving tools with an animal picker, a 🔑 Code editor (2–4 animals and a rune), "Seen by" for both, and the new checks (plus a warning for a stone on a walkway). Stones, carvings and the code travel in share links and the room, and count in the ✅ fingerprint; levels without them keep their old fingerprint. |
| 2026-10-31 | **Making money decided (12.6):** Chapters 1–2 and the level designer are free; one $2.99 purchase unlocks the rest forever; friend's pass: if either player owns it, the room plays everything. Offer after level 2-5 and on 🔑 levels, never mid-level. The lock stays off until the Android app is live. |
| 2026-10-31 | **Ready-to-sell work built:** sound, music and vibration settings in the pause menu (15.6); a website update check with a banner (16.7); friends now need the same *play version* instead of the same build (13.6); the Android app project (Capacitor) with Google Play Billing; a privacy policy page; Google Play listing text, screenshots and feature graphic (`docs/store/`); release steps in `docs/RELEASE_ANDROID.md`. Not yet built into an app file (needs Android Studio) or tested with real purchases. |
| 2026-10-31 | **Chapter 7 "The Whispering Vault" planned and approved (16.10, W1–W4):** password gates mixed with different eyes. Each player sees only 2 of the 4 carvings (Cool Girl 1 and 3, Hot Boy 2 and 4), the chapter has its own team code, and in the vault 2 stones per side are seen only by the partner (the shelf stays visible). Levels: Half a Secret, The Unseen Bridge, Quiet Hall, The Hidden Key, The Whispering Vault. |
| 2026-10-31 | **Chapter 7 built (16.10).** All 35 levels pass the route robot; 7-5 is proven with 46 codes. No new mechanism was needed: hidden carvings and stones use the existing "Seen by" setting, and the chapter's own code uses the existing team-code system. As a paid chapter it is locked by the $2.99 purchase like Chapters 3–6. Star times are guesses (D12); a real two-phone playtest is still needed. |
| 2026-10-31 | **Chapter themes decided (9.3):** one temple, one journey. Each chapter is its own area of the temple with its own background and music (jungle gate, flooded halls, deep machine, summit sky, hall of eyes, sealed vault, whispering vault). Only the scenery changes; gameplay colors and shapes stay the same, and backgrounds stay dark and muted. Built in two steps: backgrounds, then music. |
| 2026-10-31 | **Chapter themes built (9.3):** every chapter has its own background (still scenery, moving parts and a floating air layer, all behind the level) and its own tune (key, chords, speed, drums and a texture such as drips, wind or whispers), while the duet stays. Gem and stone notes follow each tune's key. Chapter 6's background uses vault doors instead of animal carvings so it can't be mistaken for the code. Feel Lab › World › Living background turns the moving scenery off. |
| 2026-10-31 | **Connection and menu (13.3, 13.5, 13.7):** "Leave room" on the waiting screen right away (was after 2 minutes); "Hold for the level map" in the pause menu takes both players to the map; Wi-Fi hiccups wait 15 s before counting as a drop, and position updates are skipped instead of piling up. Still free: the public PeerJS servers. Android app: the back button goes one screen back, and sound pauses when the app is hidden. |
| 2026-11-06 | **Chapter riddles (11.2, D4):** the first level of Chapters 1–6 opens with a short riddle on a carved stone tablet that hints at the chapter's new idea without explaining it. It fades after a few seconds or on your first touch, and the level map keeps it under the chapter name. In Chapter 5 each player sees half of it. Chapter 7 and later chapters get no riddle (the owner's choice). D4 now allows this one kind of text. |
| 2026-11-06 | **Don't touch designed (16.7, T1–T4):** if the two characters clearly overlap (half their width and half their height), both burst into steam. Online, a touch counts **only when both phones saw it**, so close calls are survived and a death always shows on both screens. Both hiss and steam when within about 2 tiles, only in Don't touch levels. The level designer gets the switch later, after a two-phone test. |
| 2026-11-06 | **Chapter 8 "The Steam Halls" planned and approved (16.11):** Keep Apart, One at a Time, Leapfrog, Tight Squeeze, The Steam Halls. Every level is a Don't touch level. Needs a two-phone test before it is final. |
| 2026-11-06 | **Chapter 9 "The Heart of the Temple" planned and approved (16.12):** the finale, no new rule. Its own team code with carvings in levels 1–4 and the vault in level 5; levels mix eyes, password gates, lifts, trapdoors and Don't touch. A small wordless ending in 9-5. Themes and tunes for both chapters added to 9.3. The game will have **9 chapters, 45 levels**. |
| 2026-11-06 | **Don't touch, Chapter 8 "The Steam Halls" and Chapter 9 "The Heart of the Temple" built (16.7, 16.11, 16.12).** The game now has **9 chapters and 45 levels**, all passing the route robot (9-5 with 46 codes). A touch counts online only when both phones saw it (a new message: `PROTOCOL` 2). Both chapters have their own background (steam pipes; the heart) and tune (a steam-engine chuff; the home theme slower). Finishing 9-5 plays the small ending. Changed while building, with the owner: 9-4 uses a trapdoor leapfrog instead of "two lifts passing", which could never be dangerous under T2. Store and marketing texts now say 45 levels. Still needed: a two-phone test of Don't touch (D12, T2); star times are guesses. |
| 2026-11-06 | **Main menu designed (11.1, 11.2):** a main screen with the two characters drawn big in code (shading, rim light, shadows, each lighting the wall; tap them for a jump or a hair flip) over the furthest chapter's blurred background, and the modes as stone tiles: Co-op · Story and Level designer, plus Versus race and Bonus levels as "Soon". Co-op leads to Create / Join room (name box there and in Settings). A ⚙ Settings page: sound, music, vibration, name, full screen, Restore my purchase (app only, no Buy button), About / Privacy / Feedback links, version. Room links still join with no taps; leaving a room returns to the Co-op screen. No AI art (14.1, L4). |
| 2026-11-10 | **Owner's playtest fixes:** (1) **Levers flip on each step-on, from either side**, and standing on one doesn't flip it again (10.1); vault levers in 6-5, 7-5 and 9-5 moved to where only one player goes, and 2-1's lever into its dead end. Play version `PROTOCOL` 3. (2) **A closing gate crushes anyone even a little under it**, never pushes them aside (the old forgiveness let the movement code shove a player through the gate); standing right beside it is still safe. (3) 2-4 three stars under 20 s. (4) 3-1's doors had no gap between them: Hot Boy's door moved one tile left. (5) Unreachable gems fixed: 9-1's two gems over the doors moved down, and 7-1's high blue gem moved one tile left (checked with the real physics). (6) Cool Girl's waiting pose is now **hands on hips** (owner's pick of 4 drawn options), and her sunglasses show one lens from the side. Also built: the solo test (`?solo`) for trying every level alone. |
| 2026-11-10 | **The Trials proposed (16.7):** three extremely hard bonus chapters (10–12) for teams who finished the story. **Decided:** they live behind the "Bonus levels" tile and open when either player has finished 9-5 (not with stars); the story stays 9 chapters with its ending on 9-5; D2 and D11 are relaxed there on purpose; no password gates. **Still waiting for the owner** at that point: timed switches (Chapter 11) and the rising tide (Chapter 12). |
| 2026-11-10 | **Crumbling stones approved and built (16.7, K1–K6):** a stone block with gold cracks shakes for 0.7 s when someone stands on it, falls away, and grows back 5 s later (never inside a character). Each phone starts the shake for its own character and tells the other; the host's world state repairs a lost message (`PROTOCOL` 4). Test room `?lab=crumble`; the route robot tests the rule with the real physics and on two simulated phones. Homemade levels get it later. No levels use it yet. |
| 2026-11-10 | **Timed switches approved and built (16.7, S1–S6):** a switch that stays on for a set time after you step off, with a draining gold ring on the switch and on every gate and lift it powers. The host's clock counts online (`PROTOCOL` 5). **New level rule:** the route robot must also win a timed level with every clock 0.5 s shorter, so there is always room for lag. Test room `?lab=timer`. Homemade levels get it later. No levels use it yet. |
| 2026-11-10 | **The rising tide approved and built (16.7, V1–V6):** violet poison rises from the bottom at a steady speed once the first player moves, up to a set height; it kills when the feet are 0.3 tiles under. Tide levels keep both bottom 4 × 4 corners solid (5.3). The guest follows the host's surface (`PROTOCOL` 6). **New level rule:** the route robot must also win a tide level with the tide 1.25× faster. Test room `?lab=tide`. **All three Trials mechanics are now built; next is Chapter 10.** |
| 2026-11-10 | **Chapter 10 "The Crumbling Wing" built (16.13):** Fragile Bridge, Give Way, Steam on Thin Stone (Don't touch), Blind Bridge (Different eyes), The Collapse (exam). All five pass the route robot with every gem. It is a **bonus chapter**: `bonus` on `CHAPTERS`; the "Bonus levels" tile on the main screen is live and opens the map on the Trials; the story still says 9 chapters, "Next level" stops at 9-5, and the ending stays on 9-5 (`FINALE_ID`). Its own background (a collapsed wing) and tune (9.3). Changed while building: no pit is 5 tiles wide (7.7), so 10-1's first bridge is 6 and 10-4 has two wide pits instead of three. Star times are guesses; a two-phone playthrough is still needed. |
| 2026-11-12 | **The road to 100 levels decided (16.7, H1–H5):** Chapters 6–12 grow to 10 levels each and a new Chapter 13 "The Last Trial" has 5, for 100 levels in 13 chapters (story 65, Trials 35). In the password chapters (6, 7, 9) the code stays 4 animals, but the 4 carvings move to hidden side spots in 4 of levels 1–9 and the vault moves to level 10. Nobody loses progress: a level also stays open if any later level is already finished. From Chapter 10 on, mechanics are added one at a time until all are on at once in Chapter 13. Not built yet. |
| 2026-11-12 | **Chapter 11 "The Hourglass Hall", levels 1–5 built (16.14):** Run!, On Three, Thin Time (crumbling stones), Count Me Down (Different eyes), The Hourglass (Don't touch). All pass the route robot with every gem, also with every clock 0.5 s shorter. Its own background (giant hourglasses) and tune (9.3). Lessons added to 16.14: corridor switches are pressed by anyone walking over them, so a switch for one chosen moment goes on a shelf; never leave only the tiles under a gate to wait on. Known cost: a failed count-in in 11-2 means a restart from the pause menu. |
| 2026-11-12 | **Chapter 12 "The Rising Dark", levels 1–5 built (16.15):** Higher Ground, Burning Bridges (crumbling stones), Last Breath (timed switches), Trust Fall (Different eyes), Keep Your Head (Don't touch). All pass the route robot with every gem, also with the tide 1.25× faster. Each tide's speed was set from how much faster it could be before the robot fails (1.75× to 4×). Its own background (the sinking temple) and tune (9.3). All three Trial chapters now have their first five levels: 15 bonus levels, 60 official levels in total. |
| 2026-11-14 | **Ready for 10-level chapters (16.7, "The road to 100 levels", step 3):** the vaults moved to the end of their chapters (6-10, 7-10, 9-10) with 6-5…6-9, 7-5…7-9 and 9-5…9-9 planned but not built; saved vault results move with them once per phone; a level stays open if it or any later level is finished, so no old save loses anything; the ending is on 9-10; the map has two rows for a 10-level chapter, and on a sideways phone the 13 chapter tabs slide in one row. Tested with pretend saves in `check:custom` and by hand with an old save. |
| 2026-11-14 | **Chapter 6 has 10 levels (16.9):** new 6-5 Crossed Keys, 6-6 The Weighing Room, 6-7 Three Gates, 6-8 The Drowned Archive, 6-9 The Last Stair, each built from earlier chapters' mechanisms. The 4 carvings moved off the main path into 6-1, 6-4, 6-6 and 6-8 (H2), and **a carving now shows its animal and dots only while someone is near** (G9 changed): from far away it is a blank plaque. This applies to every carving, also in Chapters 7 and 9 and in homemade levels. The robot proves each carving can be reached and that the shortest route never reads it. |
| 2026-11-14 | **Chapter 7 has 10 levels (16.10):** new 7-5 Steps in the Dark, 7-6 Through the Fire, 7-7 Mind the Floor, 7-8 His Eyes Only, 7-9 Trust, Turned Around, built on Chapter 5's layouts with one more idea each (two with the roles swapped). The carvings moved off the main path into 7-1, 7-4, 7-6 and 7-8 (W1 kept). New for this chapter: in 7-6 and 7-8 the player who sees a carving can't reach it, so they guide the other there and read it when it lights up. |
| 2026-11-14 | **Chapter 8 has 10 levels (16.11):** new 8-6 The Tower, Apart (an ordering puzzle), 8-7 Up the Stairs, 8-8 The Balance, 8-9 The Hidden Shelf and 8-10 Blind Steam (the last two with Different eyes). Every pass is a leap over a friend who stands still, measured by the robot at 2.9+ tiles of clearance. **New Don't touch rule:** no leap over a friend under a ceiling lower than 5 tiles (a low ceiling cuts the jump short). |
| 2026-11-14 | **Chapter 9 has 10 levels (16.12), so the story is complete at 65 levels:** new 9-5 Stones in the Gap, 9-6 The Bridge Below, 9-7 Ferry in the Fog, 9-8 The Old Machine, 9-9 The Summit Again (the exams of Chapters 1–4, mirrored, with hidden things, Don't touch and carvings added). The carvings moved off the main path into 9-1, 9-3, 9-6 and 9-8. The ending stays on 9-10. |
| 2026-11-14 | **Chapter 10 has 10 levels (16.13):** new 10-6 Dust Relay, 10-7 Hold On a Second, 10-8 Blind Dust, 10-9 Steam and Dust and 10-10 The Last Collapse: proven Don't touch and Different eyes levels with crumbling stones added, up to an exam with all three. A crumbling shelf to wait on gives the runner about 0.6 s after landing to pass under; measured by the robot. The Don't touch ceiling rule is corrected to 5 tiles (8-4 leaps safely under 5). |
| 2026-11-16 | **Chapter 11 has 10 levels (16.14):** new 11-6 Close Behind (a single-file run across a crumbling bridge on one press), 11-7 Blind Seconds, 11-8 Dust Hourglass, 11-9 Hidden Hourglass and 11-10 The Last Hourglass (all four Trial and story mechanics with the clocks). 11-6's start window is about half a second, measured by the robot. |
| 2026-11-16 | **Chapter 12 has 10 levels (16.15), 95 in the game:** new 12-6 Dust and Tide, 12-7 Blind Breath, 12-8 Two Clocks Rising, 12-9 Crumbling Trust and 12-10 The Rising Dark (all five Trial and story mechanics with the tide). The tide has 2× to 4× time to spare in each. Left on the road to 100: Chapter 13 and the wrap-up. |
| 2026-11-16 | **H5 decided:** Chapter 13 gets the password gate after all: its own team code, carvings in 13-1 to 13-4, and the vault in 13-5 placed above the tide's highest point, after every danger, so a death never makes the team enter the code again (the one exception to R4). |
| 2026-11-16 | **Chapter 13 "The Last Trial" built (16.16): the game has 100 levels.** The Ascent, Two Shores, Falling Stars, Mirror Image and The Last Trial, each with every mechanic (tide, crumbling stones, timed switches, Different eyes, Don't touch), and the chapter's own team code: carvings in 13-1 to 13-4, the vault in 13-5 above the tide's highest point. Its own background (the inner sanctum) and tune (the home theme at full speed). All pass the route robot; the vault with 45 codes. |
| 2026-11-16 | **The road to 100 levels is finished.** Store and marketing texts updated to 100 levels in 13 chapters (a 65-level story and 35 Trials), store screenshot 4 regenerated, and everything pushed to `main`. The GitHub test APK now shows the solo test (🧪 Test levels alone) in Settings, built with `VITE_TEST_BUILD=1`; the Google Play build stays without it. Next: playtests, star times, tuning. |
| 2026-11-16 | **The remake begins (16.7 "The remake", D14, "What HARD means"):** the owner found many levels look the same and wants Chapters 10–12 harder and 13 super hard. Agreed: a new rule D14 (every level is its own room: no mirrors, no old room with one more mechanic), checked by a new robot (`npm run check:unique`, which finds 36 clear copies and 11 close cousins today); a definition of HARD (figure out, together, do, hold: three of four; 10–20 tries) and SUPER HARD (all four, 30–50 tries). **The tide is faster:** every tide's speed is now set so the robot loses at 1.5× (Chapter 12) or 1.35× (Chapter 13), capped at 0.6 and 0.8 tiles a second; speeds went from 0.2–0.35 to 0.24–0.8. No room is remade yet. |
| 2026-11-20 | **The remake of Chapters 6–12 is done.** Every look-alike story room in Chapters 6–9 is a new room (6-2, 6-6, 6-8, 6-9, 7-4 to 7-9, 8-2, 8-4, 8-6 to 8-10, 9-5 to 9-10, with a new finale vault in 9-10), and all 30 Trials levels of Chapters 10–12 are new HARD rooms (notes in 16.9–16.15). Every level keeps its id. All pass the route robot (with shorter clocks and a faster tide), and none is over 70% like another level. Still to do: Chapter 13 SUPER HARD (13-1 and 13-4 are copies), the old cousins 1-4/4-2 and 5-1/5-5, and playtests: the robot wins most Trials rooms in 5–18 s, so whether they take a team 10–20 tries must be checked by people. |
| 2026-11-21 | **Chapter 13 remade SUPER HARD (16.16).** 13-1 The Hatch, 13-2 Keep It Running, 13-3 Before It Drowns and 13-4 Falling Swap are new rooms, each with a trick the team has never seen (break the dust under your feet so your friend can jump up through it; keep a clock alive by leaving the switch and coming back; a lever the poison will take; pass over a friend who stands on crumbling stone). 13-5 keeps its vault and code, with a new climb: the poison rises to just under the vault, and one timed switch opens both trapdoors. Carvings 2 and 3 are now seen by Hot Boy and reached by Cool Girl. All pass the route robot (each tide set so the robot loses at 1.35×, clocks with about 0.7 s to spare); no Chapter 13 level is over 67% like another. Left in the remake: the old cousins 1-4/4-2 and 5-1/5-5. |
| 2026-11-21 | **Hot Boy redesign, first decisions (14.2):** the owner looked at six new looks and picked the **headband brawler**: a wild crown of flame spikes instead of the swept-back mohawk, and a dark red headband with two flying tails as his signature item (like her sunglasses). For the face, the owner tried six moods and six drawing styles and liked none better than today's face, so he keeps it **without the little fang**. Shape, colours and body stay as they are. Built the same day (next line). |
| 2026-11-21 | **Hot Boy redesign built (14.2, 14.5, 11.1):** his flame hair is a stiff crown (it flickers, grows and shrinks, but no longer trails); the trailing flame tail is gone and his **headband gets two long tails** with the hair physics (snappy, V-cut ends, shorter than her hair); face as before without the fang; body proportions unchanged. New **ignite**: tapping him on the main screen makes a tall flame shoot up from his head (replaces the jump). Later, in its own session: tapping your own character in a level plays its effect (his ignite, her sunglasses), seen on both phones. |
