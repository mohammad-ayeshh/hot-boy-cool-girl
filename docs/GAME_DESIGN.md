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

## 2. Design pillars (principles we never break) 💬
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

## 3. Hard limits (non-negotiable constraints) 💬
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

## 5. Topics still to design ❓
We'll go through these in order and fill in a section for each.

1. ~~Color rules~~ ✅
2. **Design pillars and hard limits**: review and lock sections 2 and 3
3. **Screen and camera**: how much of the level fits on a phone screen
4. **Controls**: touch layout and buttons
5. **Characters and movement**: looks, speed, jump, how they feel
6. **Level building blocks**: hazards, buttons, levers, platforms, boxes, gems, doors, and which ones come first
7. **The game flow**: open link → room → level select → play → results
8. **Scoring and progress**: time, gems, stars, unlocking levels
9. **Online rules**: who hosts, disconnects, restarting, dying
10. **Art style and effects**: character design, temple look, lighting, particles
11. **Sound and music**
12. **Level design rules** and the first 5 levels

---

## 6. Decision log
| Date | Decision |
|---|---|
| 2026-10-17 | Name: **Hot Boy & Cool Girl**, set in an ancient jungle temple. |
| 2026-10-17 | Tech: web game (TypeScript, PixiJS, PeerJS), PWA, hosted free on GitHub Pages. |
| 2026-10-17 | Online-only 2-player, friends on both Android and iPhone. |
| 2026-10-17 | Color rules locked; **violet = danger to everyone**. |
