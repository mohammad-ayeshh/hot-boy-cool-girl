// The Feel Lab metrics room (design doc 7.7): every standard size in one screen.
//
//  Bottom lane (floor at row 15): steps 2, 1 and 3 tiles high, a 2-tile-high tunnel,
//  lava / water / poison pools and a 6-tile-high wall on the right.
//  Top lane (row 9): gaps of 2, 3, 4 (the longest real gap) and 6 tiles (must be impossible).
//  Climb up via the 3-tile block under the 3-tile gap.
//  Bottom-left and bottom-right 4 × 4 corners stay plain floor/wall (thumb zones, 5.3).
import { parseLevel } from './level';

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
