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

| Property | Value | Feel |
|---|---|---|
| Run speed | 7.5 tiles/s | crosses the screen in ~4 s |
| Time to full speed | ~0.08 s | snappy but not robotic |
| Time to stop | ~0.06 s | stops where you expect |
| Max jump height (hold) | 3.5 tiles | clears a 3-tile ledge with half a tile to spare |
| Min jump height (quick tap) | ~1.2 tiles | |
| Time to top of jump | ~0.38 s | |
| Falling | 1.6× faster than rising | jumps feel weighty, not floaty |
| Apex hang | gravity halves near the top | a moment of control at the peak |
| Max fall speed | capped | long falls stay readable |
| Longest gap you can jump | ~4.5 tiles (running, full jump) | a 4-tile gap is safe |

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
| Lever 🟨 | Pushed left or right by walking into it; it stays where you left it |
| Moving platform / elevator 🟨 | Moves while its linked button is held, or by lever position |
| Stone gate 🟨 | Slides open or closed, linked to a button or lever |

### 10.3 Set 2: once the basics work
| Block | Why later |
|---|---|
| Pushable box | Needs careful online sync (who is pushing) |
| 45° slopes | Extra physics; very much part of the original's feel |
| Elemental barriers | e.g. a fire curtain only Hot Boy can pass |
| Shared gems 🟨 | Either player can collect them |

### 10.4 Set 3: later ideas
Light beams and mirrors, wind fans, ice floors, portals, timed switches, falling blocks.

## 11. Game flow 🔒
*Locked 2026-10-17.*
The path from opening the link to playing must take **under 30 seconds** (P5).

### 11.1 Screens
| Screen | What happens |
|---|---|
| **Home** | Two big buttons: **Create room** and **Join room**. An optional nickname, remembered on the device. |
| **Invite** | The host sees the 4-letter code plus a **Share** button that sends a link like `…/hot-boy-cool-girl/?room=ABCD` through WhatsApp or any app. Opening that link **joins the room automatically**, with no typing. |
| **Lobby** | Both characters are shown; each player taps the one they want. The host starts as Hot Boy, and a **Swap** button switches roles. |
| **Level map** | A temple map with all levels; locked ones show a padlock. **Either player** can pick a level, the other sees it highlighted, and **both tap Ready** to start. |
| **Play** | The level. |
| **Results** | Time, gems and stars count up. Buttons: **Next level**, **Retry**, **Level map**. Both tap the same choice to continue. |

### 11.2 Flow rules
- **No tutorial screens.** The first levels *are* the tutorial: they teach by design, with short hints drawn into the level itself.
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
- Levels are grouped into **chapters** of about 8 levels each (different parts of the temple).
- **Finishing a level unlocks the next one**, with any number of stars. You never get stuck because you can't get 3 stars.
- A few **bonus levels** unlock with stars, as a reward for players who want more challenge.

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
- **Hold-to-restart animation:** while held, a ring fills around the button over 1 s and the button gently shakes and brightens. Releasing early drains the ring back smoothly. When full, a small pop, a vibration and a flash confirm the restart.

### 13.4 Pause and leaving the app
- The pause menu **doesn't freeze** the game. The partner sees a small "in menu" icon over that character.
- If a player switches apps, gets a call, or locks the phone, their character stands still and the partner sees an "away" icon.

### 13.5 Disconnects
- If the connection drops, the remaining player sees **"Waiting for partner…"** and the level pauses.
- The **room code stays the same** for the whole session. When the missing player comes back (same link or code), they reconnect automatically and the **level restarts**.
- After **2 minutes** of waiting, the remaining player gets a button to go back to Home.

### 13.6 Room rules
- A room holds **exactly 2 players**. A third person sees "This room is full".
- **Same version check:** both phones must run the same game version. If not, the older one sees "Your friend has a newer version, tap to update" (important, because updates auto-deploy).
- **No anti-cheat.** You only play with friends; we don't spend effort on it.
- **No chat or voice** in the game; friends use a phone call or Discord. *Later idea:* 4 quick signals over your character (👋 "Here!", ✋ "Wait", 👉 "Go!", 😅 "Oops").

### 13.7 Connection indicator
A small signal icon in the corner: 🟢 good (under 100 ms), 🟡 OK (100–200 ms), 🔴 laggy (over 200 ms). Tapping it shows the ping and whether you're connected directly or through the relay.

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
| Hair | Blazing flame mohawk swept back; **grows bigger when running or excited** | Long water hair swept over one eye, **flowing behind her like a ribbon** |
| Face | Angled eyebrows, cocky grin with a little fang | Half-closed confident eyes, one raised eyebrow, smirk |
| Signature item | His flaming hair | **Sunglasses** resting on her head |

### 14.3 Body
Stylized slim figures with a **big head (about half head, half body)**, arms and legs, so they can act through poses (cross arms, fist pump, hair flip). At game size they're small, so **personality comes mostly from pose and movement**, then the face.

### 14.4 Personality in motion (also helps gameplay, P2)
| Moment | 🔥 Hot Boy | 💧 Cool Girl |
|---|---|---|
| Walking | Fast and bouncy, leaning forward, embers flying | Smooth glide, no bounce, hair flowing |
| Waiting | Taps his foot, punches the air, then waves "come on!" at his partner | Crosses her arms and leans; after a while rolls her eyes: "whenever you're ready" |
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

## 15. Sound and music 💬

### 15.1 The most important rule: sound is a bonus, never required
Many people play on their phone **with the sound off** (and on iPhone the silent switch can mute web games). So **nothing important is told by sound alone**: every sound also has a visual (P2). Sound makes the game *feel* better (P4); it never decides whether you can play it.

### 15.2 How the sounds are made
| Kind | Made with | Why |
|---|---|---|
| Most effects (jumps, clicks, chimes, UI) | **Synthesized in code** with the phone's built-in audio engine (Web Audio) | Tiny download, every sound can vary slightly each time, easy to tweak in words |
| Organic textures (fire crackle, water lapping, stone rumble) | Code synthesis first; if that sounds too fake, **free CC0 recordings** (no credit needed, free to use) that we layer and process | Real fire and water are hard to fake well |
| Voices ("hah!", "hm.") | Option A: **you and a friend record** a few short sounds and we process them (pitch, effects). Option B: synthesized "babble" voices. Option C: no voices | A personal touch would be fun |
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
- **Different temple chapters get a different music variation** (later).

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
- **Settings:** music volume, sound volume, vibration on or off.

---

## 16. Topics still to design ❓
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
12. **Sound and music**: drafted (section 15)
13. **Level design rules** and the first 5 levels

---

## 17. Decision log
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
