// Chapter 1: The Temple Gate (design doc 16.2). Maps come from the sketches in
// docs/levels/chapter1-sketch.png (tools/level_sketch.py). Legend: see parseLevel() in level.ts.
import { parseLevel, type LevelData } from './level.ts';
import { getMyLevel, roomLevel } from './myLevels.ts';
import type { CustomLevel } from './custom.ts';
import type { Animal, MechDef, Pattern, Tide } from './mechanisms';
import { CHAPTER_2 } from './chapter2.ts';
import { CHAPTER_3 } from './chapter3.ts';
import { CHAPTER_4 } from './chapter4.ts';
import { CHAPTER_5 } from './chapter5.ts';
import { CHAPTER_6 } from './chapter6.ts';
import { CHAPTER_7 } from './chapter7.ts';
import { CHAPTER_8 } from './chapter8.ts';
import { CHAPTER_9 } from './chapter9.ts';
import { CHAPTER_10 } from './chapter10.ts';
import { CHAPTER_11 } from './chapter11.ts';
import { CHAPTER_12 } from './chapter12.ts';
import { CHAPTER_13 } from './chapter13.ts';

export interface LevelDef {
  id: string;
  name: string;
  /** The one new idea this level teaches (16.1 D2), shown on the map. */
  idea?: string;
  /** ⭐⭐⭐ needs all gems and a time under this (12.1). First guesses: tune after playtests. */
  targetTime: number;
  /** null = designed but not built yet. */
  rows: readonly string[] | null;
  mechs?: MechDef[];
  /** Different eyes (16.7): an overlay map of who alone sees each cell (legend: SEEN_LEGEND in level.ts). */
  seen?: readonly string[];
  /** Password gates (16.7): the order to step on the symbol stones and the rune it turns on. */
  pattern?: Pattern;
  /**
   * Official password chapters (16.7, G3): this level uses the team's random code for chapter `teamCode`.
   * Each carving shows the animal for its dots (dots 1 = first animal), and the pattern's code is the team code.
   */
  teamCode?: number;
  /** Don't touch (16.7, T1): touching the partner bursts both into steam. A level has it as a whole. */
  apart?: boolean;
  /**
   * The rising tide (16.7, V1–V6): violet poison rises from `from` to `to` (y in tiles) at `speed` tiles a second,
   * once someone moves. Such a level keeps both bottom 4 × 4 corners solid stone (5.3).
   */
  tide?: Tide;
}

export const CHAPTER_1: LevelDef[] = [
  {
    id: '1-1',
    name: 'First Steps',
    idea: 'move and jump; your own liquid is safe',
    targetTime: 20,
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..........................H..C#',
      '#....r.......r.............#####',
      '#.h......##................#####',
      '#####LL#####LLL######....#######',
      '#####################....#######',
      '#......................#########',
      '#......................#########',
      '#......................#########',
      '#..........b...##.b..###########',
      '#....c.##......##....###########',
      '##########WWW#####WW############',
      '################################',
    ],
  },
  {
    id: '1-2',
    name: 'Wrong Pool',
    idea: 'your partner\'s liquid is deadly; violet kills both',
    targetTime: 18,
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#........................rb....#',
      '#..............................#',
      '#..................r........H.C#',
      '#......................##PP#####',
      '#......................#########',
      '#..........b...###WWW###########',
      '#..............#################',
      '#....h.c.......#################',
      '##########LLL###################',
      '################################',
    ],
  },
  {
    id: '1-3',
    name: 'Hold the Button',
    idea: 'a button works only while someone stands on it',
    targetTime: 30,
    rows: [
      '################################',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#...r.b........##..........H.C.#',
      '#...###...........r....b..######',
      '#...###...................######',
      '#...###.h.c...............######',
      '##################WW###LL#######',
      '################################',
    ],
    mechs: [
      { kind: 'button', x: 12, y: 15, rune: 'circle' },
      { kind: 'button', x: 21, y: 15, rune: 'circle' },
      { kind: 'gate', x: 15, y: 13, w: 2, h: 3, rune: 'circle' },
    ],
  },
  {
    id: '1-4',
    name: 'Going Up',
    idea: 'lifts; a lever stays where you push it',
    targetTime: 35,
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#...................b..r.......#',
      '#.........................H.C..#',
      '#.............######LL#WW#######',
      '#.............##################',
      '#.............##################',
      '#........b..r.##################',
      '#.............##################',
      '#.............##################',
      '#.............##################',
      '#.............##################',
      '#...hc........##################',
      '#######PP#######################',
      '################################',
    ],
    mechs: [
      { kind: 'button', x: 6, y: 15, rune: 'triangle' },
      { kind: 'platform', x: 12, y: 15, w: 2, to: [12, 7], rune: 'triangle' },
      { kind: 'lever', x: 16, y: 6, rune: 'circle' },
      { kind: 'platform', x: 9, y: 15, w: 2, to: [9, 7], rune: 'circle' },
    ],
  },
  {
    id: '1-5',
    name: 'Crossing Together',
    idea: 'everything from Chapter 1 together',
    targetTime: 45,
    rows: [
      '################################',
      '#........................#######',
      '#........................#######',
      '#........................#######',
      '#........................#######',
      '#........................#######',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#........................H.C...#',
      '#........................###...#',
      '#..............r.b...........r.#',
      '#..............................#',
      '#.......................b...####',
      '#...........................####',
      '#.....h.c...................####',
      '##########PPPPPPPPPPPP##WW######',
      '################################',
    ],
    mechs: [
      { kind: 'button', x: 4, y: 15, rune: 'circle' },
      { kind: 'button', x: 27, y: 15, rune: 'circle' },
      { kind: 'platform', x: 10, y: 14, w: 3, to: [19, 14], rune: 'circle' },
      { kind: 'lever', x: 22, y: 15, rune: 'triangle' },
      { kind: 'gate', x: 28, y: 6, w: 1, h: 7, rune: 'triangle' },
    ],
  },
];

/** A chapter riddle (11.2): one line for both, or a half for each player (Chapter 5). */
export type Riddle = string | { fire: string; water: string };
/** `bonus`: one of the Trials (16.7): after the story, behind the "Bonus levels" tile. */
export interface Chapter { n: number; name: string; levels: LevelDef[]; riddle?: Riddle; bonus?: boolean }
export const CHAPTERS: Chapter[] = [
  { n: 1, name: 'The Temple Gate', levels: CHAPTER_1, riddle: 'What burns one cradles the other. No door opens for one alone.' },
  { n: 2, name: 'The Flooded Halls', levels: CHAPTER_2, riddle: 'Your key hangs in another’s hand.' },
  { n: 3, name: 'The Deep Machine', levels: CHAPTER_3, riddle: 'The machine forgets what you only hold, and remembers what you lock.' },
  { n: 4, name: 'The Summit', levels: CHAPTER_4, riddle: 'What lifts one lowers the other. Choose who rises first.' },
  { n: 5, name: 'The Hall of Eyes', levels: CHAPTER_5, riddle: { fire: 'Not every eye is shown the same stone…', water: '…trust the voice beside you.' } },
  { n: 6, name: 'The Sealed Vault', levels: CHAPTER_6, riddle: 'The walls are counting. Remember what they tell you.' },
  { n: 7, name: 'The Whispering Vault', levels: CHAPTER_7 },
  { n: 8, name: 'The Steam Halls', levels: CHAPTER_8 },
  { n: 9, name: 'The Heart of the Temple', levels: CHAPTER_9 },
  { n: 10, name: 'The Crumbling Wing', levels: CHAPTER_10, bonus: true },
  { n: 11, name: 'The Hourglass Hall', levels: CHAPTER_11, bonus: true },
  { n: 12, name: 'The Rising Dark', levels: CHAPTER_12, bonus: true },
  { n: 13, name: 'The Last Trial', levels: CHAPTER_13, bonus: true },
];
/** The story (Chapters 1–9), and the Trials after it (16.7). */
export const STORY_CHAPTERS: Chapter[] = CHAPTERS.filter((c) => !c.bonus);
export const BONUS_CHAPTERS: Chapter[] = CHAPTERS.filter((c) => c.bonus);
/** The story's last level (16.12): finishing it plays the ending, and opens the Trials. */
export const FINALE_ID: string = STORY_CHAPTERS[STORY_CHAPTERS.length - 1].levels.slice(-1)[0].id;
/** Every official level in play order: finishing one unlocks the next, across chapters (12.2). */
export const ALL_LEVELS: LevelDef[] = CHAPTERS.flatMap((c) => c.levels);
/** The levels that exist (a planned level has no map yet): the unlock chain and "Next level" walk these. */
export const BUILT_LEVELS: LevelDef[] = ALL_LEVELS.filter((l) => l.rows !== null);
export const chapterOf = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.levels.some((l) => l.id === id));
/** The riddle line one player sees (11.2), or '' for a chapter without one. */
export const riddleFor = (ch: Chapter, elem: 'fire' | 'water'): string =>
  !ch.riddle ? '' : typeof ch.riddle === 'string' ? ch.riddle : ch.riddle[elem];

export const findLevel = (id: string): LevelDef | undefined => ALL_LEVELS.find((l) => l.id === id);
/** Any playable level: an official one, a homemade level shared in this room, or one saved on this phone. */
export const getLevel = (id: string): LevelDef | CustomLevel | undefined => findLevel(id) ?? roomLevel(id) ?? getMyLevel(id);
/** A level's mechanisms and pattern with a team code filled in (unchanged for levels without `teamCode`). */
export function withCode(def: LevelDef, code?: Animal[]): { mechs: MechDef[]; pattern?: Pattern } {
  const mechs = def.mechs ?? [];
  if (!def.teamCode || !code) return { mechs, pattern: def.pattern };
  return {
    mechs: mechs.map((m) => (m.kind === 'carving' ? { ...m, animal: code[m.dots - 1] ?? m.animal } : m)),
    pattern: def.pattern && { ...def.pattern, code: [...code] },
  };
}

export const levelData = (def: LevelDef, code?: Animal[]): LevelData => {
  const { mechs, pattern } = withCode(def, code);
  const data: LevelData = { ...parseLevel(def.rows!, mechs, def.seen, pattern), theme: chapterOf(def.id)?.n };
  if (def.apart) data.apart = true;
  if (def.tide) data.tide = def.tide;
  return data;
};
export const nextLevel = (id: string): LevelDef | undefined => {
  const i = BUILT_LEVELS.findIndex((l) => l.id === id);
  const next = i < 0 ? undefined : BUILT_LEVELS[i + 1];
  // the story ends at its last level: "Next level" never leads from the ending into the Trials (16.7, R1)
  return next && id === FINALE_ID ? undefined : next;
};
