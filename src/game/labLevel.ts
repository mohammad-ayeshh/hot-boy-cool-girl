// The Feel Lab metrics room (design doc 7.7): every standard size in one screen.
//
//  Bottom lane (floor at row 15): steps 2, 1 and 3 tiles high, a 2-tile-high tunnel,
//  lava / water / poison pools and a 6-tile-high wall on the right.
//  Top lane (row 9): gaps of 2, 3, 4 (the longest real gap) and 6 tiles (must be impossible).
//  Climb up via the 3-tile block under the 3-tile gap.
//  Bottom-left and bottom-right 4 × 4 corners stay plain floor/wall (thumb zones, 5.3).
import { parseLevel } from './level.ts';
import type { MechDef, Pattern } from './mechanisms';

export const LAB_ROWS = [
  '################################', // 0
  '#..............................#', // 1
  '#..............................#', // 2
  '#..............................#', // 3
  '#..............................#', // 4
  '#..............................#', // 5
  '#.................b............#', // 6   gem above the 4-tile gap
  '#..............................#', // 7
  '#.r.....b............r.........#', // 8   gems on the top lane
  '#####..###...###....###......###', // 9   top lane: gaps 2 · 3 · 4 · 6
  '#............###.............###', // 10
  '#....r.......###...........b.###', // 11
  '#.........##.###.b...r.......###', // 12  gems above lava / water (risky)
  '#....##...##.................###', // 13
  '#.hc.##.#.##.rb..............###', // 14  steps 2 · 1 · 3, tunnel, starts
  '################LLL#WWW#PPP#####', // 15  pools
  '################################', // 16
  '################################', // 17
] as const;

export const labLevel = () => parseLevel(LAB_ROWS);

// The vault test room (16.7, password gates), at ?lab=vault: try symbol stones and carvings on one phone.
// Start on the top shelves past the carvings (frog 1, bat 2, bat 3, monkey 4), drop down, and enter the code
// on the stones. Each stone sits on its own shelf 3 tiles up with a walkway under it, so you walk *under* the
// stones you don't want and jump up onto the one you do (walking across a stone would press it).
// The code opens the gate in the middle wall.
export const VAULT_ROWS = [
  '################################', // 0
  '#..............##..............#', // 1
  '#..............##..............#', // 2
  '#..............##..............#', // 3
  '#..............##..............#', // 4
  '#..............##..............#', // 5
  '#.h............##............c.#', // 6   starts, carvings above the shelves
  '#########..##########..#########', // 7   drop holes
  '#..............##..............#', // 8
  '#..............##..............#', // 9
  '#..............##..............#', // 10
  '#..............##..............#', // 11
  '#....#..#..#..#..#..#..#..#....#', // 12  one shelf per stone; the gate fills the gap in the middle
  '#..............................#', // 13  walkway under the shelves
  '#..............................#', // 14
  '################################', // 15
  '################################', // 16
  '################################', // 17
] as const;

export const VAULT_MECHS: MechDef[] = [
  { kind: 'carving', x: 5, y: 5, animal: 'frog', dots: 1 },
  { kind: 'carving', x: 8, y: 5, animal: 'bat', dots: 2 },
  { kind: 'carving', x: 23, y: 5, animal: 'bat', dots: 3 },
  { kind: 'carving', x: 26, y: 5, animal: 'monkey', dots: 4 },
  { kind: 'stone', x: 5, y: 11, animal: 'snake' },
  { kind: 'stone', x: 8, y: 11, animal: 'monkey' },
  { kind: 'stone', x: 11, y: 11, animal: 'jaguar' },
  { kind: 'stone', x: 14, y: 11, animal: 'frog' },
  { kind: 'stone', x: 17, y: 11, animal: 'bird' },
  { kind: 'stone', x: 20, y: 11, animal: 'fish' },
  { kind: 'stone', x: 23, y: 11, animal: 'bat' },
  { kind: 'stone', x: 26, y: 11, animal: 'turtle' },
  { kind: 'gate', x: 15, y: 12, w: 2, h: 3, rune: 'star' },
];
export const VAULT_PATTERN: Pattern = { code: ['frog', 'bat', 'bat', 'monkey'], rune: 'star' };

export const vaultLevel = () => parseLevel(VAULT_ROWS, VAULT_MECHS, undefined, VAULT_PATTERN);
