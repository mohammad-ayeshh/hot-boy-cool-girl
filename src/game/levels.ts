// Chapter 1: The Temple Gate (design doc 16.2). Maps come from the sketches in
// docs/levels/chapter1-sketch.png (tools/level_sketch.py). Legend: see parseLevel() in level.ts.
import { parseLevel, type LevelData } from './level.ts';
import { getMyLevel, roomLevel } from './myLevels.ts';
import type { CustomLevel } from './custom.ts';
import type { Animal, MechDef, Pattern } from './mechanisms';
import { CHAPTER_2 } from './chapter2.ts';
import { CHAPTER_3 } from './chapter3.ts';
import { CHAPTER_4 } from './chapter4.ts';
import { CHAPTER_5 } from './chapter5.ts';
import { CHAPTER_6 } from './chapter6.ts';

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

export interface Chapter { n: number; name: string; levels: LevelDef[] }
export const CHAPTERS: Chapter[] = [
  { n: 1, name: 'The Temple Gate', levels: CHAPTER_1 },
  { n: 2, name: 'The Flooded Halls', levels: CHAPTER_2 },
  { n: 3, name: 'The Deep Machine', levels: CHAPTER_3 },
  { n: 4, name: 'The Summit', levels: CHAPTER_4 },
  { n: 5, name: 'The Hall of Eyes', levels: CHAPTER_5 },
  { n: 6, name: 'The Sealed Vault', levels: CHAPTER_6 },
];
/** Every official level in play order: finishing one unlocks the next, across chapters (12.2). */
export const ALL_LEVELS: LevelDef[] = CHAPTERS.flatMap((c) => c.levels);
export const chapterOf = (id: string): Chapter | undefined => CHAPTERS.find((c) => c.levels.some((l) => l.id === id));

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
  return parseLevel(def.rows!, mechs, def.seen, pattern);
};
export const nextLevel = (id: string): LevelDef | undefined => {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i < 0 ? undefined : ALL_LEVELS[i + 1];
};
