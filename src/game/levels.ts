// Chapter 1: The Temple Gate (design doc 16.2). Maps come from the sketches in
// docs/levels/chapter1-sketch.png (tools/level_sketch.py). Legend: see parseLevel() in level.ts.
import { parseLevel, type LevelData } from './level';

export interface LevelDef {
  id: string;
  name: string;
  /** ⭐⭐⭐ needs all gems and a time under this (12.1). First guesses: tune after playtests. */
  targetTime: number;
  /** null = designed but not built yet (needs mechanisms). */
  rows: readonly string[] | null;
}

export const CHAPTER_1: LevelDef[] = [
  {
    id: '1-1',
    name: 'First Steps',
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
  { id: '1-3', name: 'Hold the Button', targetTime: 30, rows: null },
  { id: '1-4', name: 'Going Up', targetTime: 35, rows: null },
  { id: '1-5', name: 'Crossing Together', targetTime: 45, rows: null },
];

export const findLevel = (id: string): LevelDef | undefined => CHAPTER_1.find((l) => l.id === id);
export const levelData = (def: LevelDef): LevelData => parseLevel(def.rows!);
export const nextLevel = (id: string): LevelDef | undefined => CHAPTER_1[CHAPTER_1.findIndex((l) => l.id === id) + 1];
