// Chapter 13: The Last Trial (design doc 16.16). The end of the Trials (16.7, H5): every mechanic in every level (the
// rising tide, crumbling stones, timed switches, Different eyes and Don't touch), and its own team code: one carving in
// each of levels 1–4, off the main path, and the vault in 13-5 above the tide's highest point, after every danger, so a
// death never makes the team enter the code again. Carving animals are stand-ins (filled in from the team code).
// Remade SUPER HARD (16.7 "What HARD means", D14): every level is its own room with one trick the team has never seen.
// Every level has a route-robot solution (tools/routes/ch13.ts; 13-5's in tools/routes.ts), also with every clock 0.5 s
// shorter and the tide 1.25× faster; each tide is set so the robot loses at about 1.35× (0.8 tiles/s at most).
import type { LevelDef } from './levels';

export const CHAPTER_13: LevelDef[] = [
  {
    id: '13-1',
    name: 'The Hatch',
    idea: 'break the dust under your own feet, so your friend can jump up through the hole',
    targetTime: 25,
    teamCode: 13,
    apart: true,
    tide: { from: 15, to: 5.6, speed: 0.65 },
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#....H....C....r.LL..LL........#',
      '#...###..##########..#####.....#',
      '#...#..........................#',
      '#...#....b.....................#',
      '#...###########..####..........#',
      '#..................##..........#',
      '#........r.........##...b......#',
      '##....#####################....#',
      '#..............................#',
      '#.h.##.......................c.#',
      '####........................####',
      '####........................####',
      '####........................####',
      '################################',
    ],
    mechs: [
      // The trick: two closed cells, each with a two-stone dust hatch in its roof; the only way out is up through the hatch,
      // and only the partner can break it, by standing on it and stepping off before it falls. He holds her gate from a low
      // step (the button only she sees) while she climbs to the roof of his cell; on his word she leaves the timed switch
      // (only he sees it) that opens BOTH cells, and both run for their cell before the clock runs out: she over his hatch,
      // which falls behind her. He jumps up through it, climbs to the bridge on the lava (she can't go there) while she holds
      // the bridge gate from inside her cell (the button only he sees), and walks over her hatch to his door; she jumps up to
      // hers. Each passes over the other once. Carving 1 sits on a ledge above his start, off the way
      { kind: 'gate', x: 12, y: 9, w: 1, h: 2, rune: 'circle' },
      { kind: 'gate', x: 21, y: 6, w: 1, h: 5, rune: 'triangle' },
      { kind: 'gate', x: 12, y: 6, w: 1, h: 2, rune: 'circle' },
      { kind: 'gate', x: 13, y: 1, w: 1, h: 4, rune: 'square' },
      { kind: 'button', x: 5, y: 12, rune: 'triangle', seen: 'water' },
      { kind: 'button', x: 5, y: 7, rune: 'square', seen: 'fire' },
      { kind: 'timer', x: 20, y: 7, rune: 'circle', secs: 1.7, seen: 'fire' },
      { kind: 'crumble', x: 15, y: 8, w: 2 },
      { kind: 'crumble', x: 7, y: 5, w: 2 },
      { kind: 'carving', x: 1, y: 10, animal: 'snake', dots: 1 },
    ],
  },
  {
    id: '13-2',
    name: 'Keep It Running',
    idea: 'keep the ferry going: leave the switch, open the gate for your friend, and get back before the clock runs out',
    targetTime: 32,
    teamCode: 13,
    apart: true,
    tide: { from: 15, to: 3.6, speed: 0.39 },
    rows: [
      '################################',
      '#.........................r....#',
      '#...................bC....H....#',
      '#...................########...#',
      '#.............###..............#',
      '#.b...................r........#',
      '###..................##...#....#',
      '#............b.................#',
      '#..c.......................h...#',
      '#####....................#######',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '####........................####',
      '####........................####',
      '####........................####',
      '################################',
    ],
    mechs: [
      // The trick: a ferry on a timed switch, and a gate hanging over its path. He powers it from his side to bring her over,
      // but the gate's button is up on a shelf: he must leave the switch, hold the button while she passes, and be back on the
      // switch before its clock runs out, or the ferry turns back and the closed gate scrapes her off. Both switches are seen
      // only by her: she calls them out from the ferry. Then the doors: hers is the far one, behind a gate on a timed switch
      // that stands on a dust stone (one go, it falls), so she climbs first and he presses it when she is at the gate.
      // Carving 2 (only he sees it) is on a nub above her start
      { kind: 'platform', x: 5, y: 9, w: 4, to: [21, 9], rune: 'circle' },
      { kind: 'gate', x: 15, y: 5, w: 1, h: 4, rune: 'square' },
      { kind: 'gate', x: 23, y: 1, w: 1, h: 2, rune: 'triangle' },
      { kind: 'timer', x: 30, y: 8, rune: 'circle', secs: 3.2, seen: 'water' },
      { kind: 'button', x: 21, y: 5, rune: 'square', seen: 'water' },
      { kind: 'timer', x: 26, y: 5, rune: 'triangle', secs: 1.0 },
      { kind: 'crumble', x: 28, y: 6, w: 2 },
      { kind: 'carving', x: 1, y: 5, animal: 'snake', dots: 2, seen: 'fire' },
    ],
  },
  {
    id: '13-3',
    name: 'Before It Drowns',
    idea: 'the lever by the poison: on for her lift, off for his bridge, both before the poison takes it',
    targetTime: 25,
    teamCode: 13,
    apart: true,
    tide: { from: 15, to: 7.6, speed: 0.37 },
    rows: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#......H...b....C..............#',
      '#.....####..######.............#',
      '#..............................#',
      '#..................r...........#',
      '#...b...................r......#',
      '##....................###......#',
      '#..............................#',
      '#.c......................##..h.#',
      '####........................####',
      '####........................####',
      '####........................####',
      '################################',
    ],
    mechs: [
      // The trick: one lever just above the poison drives her lift (on: up) and his bridge (on: a 6-wide hole). The poison
      // will take the lever, and whatever it shows then stays for good. So he flips it on when she is on the lift (only he
      // sees the lift, only she sees the lever), and once she is off at the top he flips it off again, before the poison gets
      // there, and climbs. Up on his first ledge a timed switch (only she sees it) opens the gate to her door: from then on he
      // must get up, leap over her (she waits on the stone, not the dust he must not land on) and she must run through the
      // gate before it shuts. Carving 3 (only he sees it) is on a nub above her start: she climbs to it and he reads it
      { kind: 'platform', x: 4, y: 14, w: 2, to: [4, 7], rune: 'star', seen: 'fire' },
      { kind: 'gate', x: 16, y: 10, w: 6, h: 1, rune: 'star' },
      { kind: 'gate', x: 15, y: 2, w: 1, h: 5, rune: 'square' },
      { kind: 'lever', x: 25, y: 12, rune: 'star', seen: 'water' },
      { kind: 'timer', x: 23, y: 10, rune: 'square', secs: 3.7, seen: 'water' },
      { kind: 'crumble', x: 10, y: 7, w: 2 },
      { kind: 'carving', x: 1, y: 10, animal: 'snake', dots: 3, seen: 'fire' },
    ],
  },
  {
    id: '13-4',
    name: 'Falling Swap',
    idea: 'the only room to pass is over crumbling stone: one stands on it for a moment while the other leaps over',
    targetTime: 18,
    teamCode: 13,
    apart: true,
    tide: { from: 15, to: 6.6, speed: 0.63 },
    rows: [
      '################################',
      '#..............##..............#',
      '#..............##..............#',
      '#..............##..............#',
      '#............b.##.r............#',
      '#...........C..##..H...........#',
      '#..........##########..........#',
      '#..............................#',
      '#..............................#',
      '#...##..####......######..##...#',
      '#..............................#',
      '#........r............b........#',
      '#...#########....###########...#',
      '#.h..........................c.#',
      '####........................####',
      '####........................####',
      '####........................####',
      '################################',
    ],
    mechs: [
      // The trick: they start on the wrong sides of a long low tunnel where nobody can pass, and the only place with room to
      // leap over a friend is a skylight in the middle whose floor is crumbling stone. The stander must step onto it just as the
      // other jumps, and step off the moment the leaper is over, before it falls into the poison. Before that: each starts on
      // the timed switch (only the other sees it) that opens the other's way into the tunnel, so both leave on three. Only he
      // sees the crumbling stone: to her it is a hole, and she must step out over it on his word. After
      // the swap each climbs out through a gap in the tunnel roof to the doors, split by a pillar. Carving 4 is on the roof
      // at the far right end, past the way up
      { kind: 'gate', x: 4, y: 10, w: 1, h: 2, rune: 'circle' },
      { kind: 'gate', x: 27, y: 10, w: 1, h: 2, rune: 'triangle' },
      { kind: 'timer', x: 2, y: 13, rune: 'triangle', secs: 1.2, seen: 'water' },
      { kind: 'timer', x: 29, y: 13, rune: 'circle', secs: 1.2, seen: 'fire' },
      { kind: 'crumble', x: 13, y: 12, w: 4, seen: 'fire' },
      { kind: 'carving', x: 27, y: 8, animal: 'snake', dots: 4 },
    ],
  },
  {
    id: '13-5',
    name: 'The Last Trial',
    idea: 'the last climb, then the code: the vault waits above the poison, where nothing can hurt you',
    targetTime: 45,
    teamCode: 13,
    apart: true,
    tide: { from: 14.3, to: 7.6, speed: 0.8 },
    rows: [
      '################################',
      '#............######............#',
      '#............######............#',
      '#..............................#',
      '#..#..#..#..#......#..#..#..#..#',
      '#.......r.............b........#',
      '#.............H..C.............#',
      '#######..##############..#######',
      '#..............................#',
      '#..............................#',
      '#.....####################.....#',
      '#..............................#',
      '#..r........................b..#',
      '#.h..........................c.#',
      '####........................####',
      '####........................####',
      '####........................####',
      '################################',
    ],
    mechs: [
      // Below: crumbling steps off the start corners (hers only he sees) to the long low ledge under the vault, and the poison
      // keeps rising until it is just under the vault floor. One timed switch in the middle of the ledge (only he sees it) opens
      // BOTH trapdoors: whoever presses it sends the other up first, then must run to their own trapdoor and jump up through it
      // before it shuts. Above: the split vault, as in 6-10, out of the poison's reach; the code opens both gates onto the doors
      { kind: 'gate', x: 7, y: 7, w: 2, h: 1, rune: 'circle' },
      { kind: 'gate', x: 23, y: 7, w: 2, h: 1, rune: 'circle' },
      { kind: 'gate', x: 13, y: 3, w: 1, h: 4, rune: 'star' },
      { kind: 'gate', x: 18, y: 3, w: 1, h: 4, rune: 'star' },
      { kind: 'timer', x: 15, y: 9, rune: 'circle', secs: 1.95, seen: 'fire' },
      { kind: 'crumble', x: 4, y: 12, w: 2 },
      { kind: 'crumble', x: 26, y: 12, w: 2, seen: 'fire' },
      { kind: 'stone', x: 3, y: 3, animal: 'snake' },
      { kind: 'stone', x: 6, y: 3, animal: 'monkey' },
      { kind: 'stone', x: 9, y: 3, animal: 'jaguar' },
      { kind: 'stone', x: 12, y: 3, animal: 'frog' },
      { kind: 'stone', x: 19, y: 3, animal: 'bird' },
      { kind: 'stone', x: 22, y: 3, animal: 'fish' },
      { kind: 'stone', x: 25, y: 3, animal: 'bat' },
      { kind: 'stone', x: 28, y: 3, animal: 'turtle' },
    ],
    pattern: { code: ['snake', 'snake', 'snake', 'snake'], rune: 'star' },
  },
];
