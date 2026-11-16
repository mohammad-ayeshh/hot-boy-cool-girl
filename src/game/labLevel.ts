// The Feel Lab metrics room (design doc 7.7): every standard size in one screen.
//
//  Bottom lane (floor at row 15): steps 2, 1 and 3 tiles high, a 2-tile-high tunnel,
//  lava / water / poison pools and a 6-tile-high wall on the right.
//  Top lane (row 9): gaps of 2, 3, 4 (the longest real gap) and 6 tiles (must be impossible).
//  Climb up via the 3-tile block under the 3-tile gap.
//  Bottom-left and bottom-right 4 × 4 corners stay plain floor/wall (thumb zones, 5.3).
import { parseLevel } from './level.ts';
import type { MechDef, Pattern, Tide } from './mechanisms';

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

// The crumbling-stones test room (16.7, K1–K6), at ?lab=crumble. A 12-tile crumbling bridge over poison: run across
// and it falls away behind you; stand still and you go down with it; about 5 s later it grows back. On the right,
// two single crumbling stones are steps up to a gem shelf: land, and jump again before the stone gives way.
export const CRUMBLE_ROWS = [
  '################################', // 0
  '#..............................#', // 1
  '#..............................#', // 2
  '#..............................#', // 3
  '#..............................#', // 4
  '#............................rb#', // 5   gems on the shelf
  '#............................###', // 6   the shelf
  '#..............................#', // 7
  '#..............................#', // 8   second stepping stone (col 27)
  '#..............................#', // 9
  '#..............................#', // 10  first stepping stone (col 24)
  '#..............................#', // 11
  '#.h.c..........................#', // 12  starts
  '##########............##########', // 13  the bridge fills the gap (cols 10–21)
  '##########PPPPPPPPPPPP##########', // 14  poison under it
  '################################', // 15
  '################################', // 16
  '################################', // 17
] as const;

export const CRUMBLE_MECHS: MechDef[] = [
  { kind: 'crumble', x: 10, y: 13, w: 12 },
  { kind: 'crumble', x: 24, y: 10, w: 1 },
  { kind: 'crumble', x: 27, y: 8, w: 1 },
];

export const crumbleLevel = () => parseLevel(CRUMBLE_ROWS, CRUMBLE_MECHS);

// The timed-switch test room (16.7, S1–S6), at ?lab=timer. The first switch (3 s) opens the gate: step off and
// run through before the ring on the gate runs out (stand under it too long and it crushes). The second switch
// (4 s) raises the lift to the shelf: put one character on the lift, press with the other, step off, and the rider
// has 4 s to walk onto the shelf before the lift sinks again.
export const TIMER_ROWS = [
  '################################', // 0
  '#..............................#', // 1
  '#..............................#', // 2
  '#..............................#', // 3
  '#..............................#', // 4
  '#..............................#', // 5
  '#..............................#', // 6
  '#..............................#', // 7
  '#..........................rb..#', // 8   gems on the shelf
  '#.......................########', // 9   the shelf
  '#.......................########', // 10
  '#.......................########', // 11
  '#.......................########', // 12
  '#.......................########', // 13
  '#.h.c...................########', // 14  starts; switches at cols 7 and 17, the gate at col 13, the lift at 21–22
  '################################', // 15
  '################################', // 16
  '################################', // 17
] as const;

export const TIMER_MECHS: MechDef[] = [
  { kind: 'timer', x: 7, y: 14, rune: 'circle', secs: 3 },
  { kind: 'gate', x: 13, y: 10, w: 1, h: 5, rune: 'circle' },
  { kind: 'timer', x: 17, y: 14, rune: 'triangle', secs: 4 },
  { kind: 'platform', x: 21, y: 14, w: 2, to: [21, 9], rune: 'triangle' },
];

export const timerLevel = () => parseLevel(TIMER_ROWS, TIMER_MECHS);

// The rising-tide test room (16.7, V1–V6), at ?lab=tide. Poison rests in the pit until someone moves, then climbs:
// over the floor, the middle ledge and the side ledges, and stops just under the top platform with the gems.
// Both bottom 4 × 4 corners are solid stone, so no poison edge is ever under a thumb (5.3).
export const TIDE_ROWS = [
  '################################', // 0
  '#..............................#', // 1
  '#..............................#', // 2
  '#..............................#', // 3
  '#.............r..b.............#', // 4   gems on the top platform
  '#.........############.........#', // 5   the top platform: the tide stops half a tile under its top
  '#..............................#', // 6
  '#..............................#', // 7
  '#....#####............#####....#', // 8   side ledges
  '#..............................#', // 9
  '#..........##########..........#', // 10  the middle ledge
  '#..............................#', // 11
  '#....h....................c....#', // 12  starts
  '############........############', // 13  the floor, with the pit in the middle
  '############........############', // 14
  '############........############', // 15
  '################################', // 16
  '################################', // 17
] as const;
export const TIDE_LAB: Tide = { from: 14.2, to: 5.5, speed: 0.4 };

export const tideLevel = () => ({ ...parseLevel(TIDE_ROWS), tide: TIDE_LAB });
