// Tile grid for one 32 × 18 screen (design doc 5.2). Coordinates are in tiles, y points down.

export const COLS = 32;
export const ROWS = 18;

export type Liquid = 'lava' | 'water' | 'poison';
export type Tile = 'empty' | 'stone' | Liquid;
export type Elem = 'fire' | 'water';
/** What killed a character: a deadly liquid, or a closing gate. */
export type DeathCause = Liquid | 'crush';

/** Liquids sit a little lower than the floor, so feet visibly dip in (and stepping out uses the step-up helper). */
export const LIQUID_DEPTH = 0.2;

import type { MechDef, Pattern } from './mechanisms';

/** Different eyes (16.7): a thing seen by only one player. Absent = both see it. Hidden things are still real (E5). */
export type Seen = Elem | undefined;
export interface Gem { x: number; y: number; elem: Elem; seen?: Elem }
export interface Rect { x0: number; y0: number; x1: number; y1: number }
export interface Point { x: number; y: number }
export interface LevelData {
  tiles: Tile[][]; // [row][col]
  spawn: Record<Elem, Point>;
  /** Exit doors: x = middle, y = the floor they stand on. Absent in test rooms. */
  doors: Partial<Record<Elem, Point>>;
  gems: Gem[];
  /** Buttons, levers, platforms, gates (see mechanisms.ts). */
  mechs: MechDef[];
  /** [row][col]: who alone sees the tile there (and a gem in it). Absent = everything is seen by both. */
  seen?: Seen[][];
  /** Password gates (16.7): the order to step on the symbol stones, and the rune it turns on. */
  pattern?: Pattern;
}

const CHAR_TILE: Record<string, Tile> = { '#': 'stone', L: 'lava', W: 'water', P: 'poison' };

/** Characters of a "seen" overlay map: `h` only Hot Boy sees this cell, `c` only Cool Girl, `.` both. */
export const SEEN_LEGEND = '.hc';
const SEEN_CHAR: Record<string, Seen> = { h: 'fire', c: 'water' };

/**
 * Parse an ASCII map. `#` stone, `L` lava, `W` water, `P` poison,
 * `h`/`c` Hot Boy / Cool Girl start (feet on the bottom of that cell), `H`/`C` their exit doors
 * (standing on the bottom of that cell), `r`/`b` fire/water gem.
 * `seen` (optional, same size): which cells' tiles and gems only one player sees (SEEN_LEGEND).
 */
export function parseLevel(rows: readonly string[], mechs: MechDef[] = [], seen?: readonly string[], pattern?: Pattern): LevelData {
  if (rows.length !== ROWS) throw new Error(`Level must have ${ROWS} rows, got ${rows.length}`);
  const tiles: Tile[][] = [];
  const spawn = { fire: { x: 2, y: ROWS - 3 }, water: { x: 3, y: ROWS - 3 } };
  const gems: Gem[] = [];
  const doors: Partial<Record<Elem, Point>> = {};
  rows.forEach((line, y) => {
    if (line.length !== COLS) throw new Error(`Row ${y} must have ${COLS} columns, got ${line.length}`);
    const row: Tile[] = [];
    [...line].forEach((ch, x) => {
      row.push(CHAR_TILE[ch] ?? 'empty');
      if (ch === 'h') spawn.fire = { x: x + 0.5, y: y + 1 };
      else if (ch === 'c') spawn.water = { x: x + 0.5, y: y + 1 };
      else if (ch === 'H') doors.fire = { x: x + 0.5, y: y + 1 };
      else if (ch === 'C') doors.water = { x: x + 0.5, y: y + 1 };
      else if (ch === 'r' || ch === 'b') {
        const gem: Gem = { x: x + 0.5, y: y + 0.5, elem: ch === 'r' ? 'fire' : 'water' };
        const who = SEEN_CHAR[seen?.[y]?.[x] ?? '.'];
        if (who) gem.seen = who;
        gems.push(gem);
      }
    });
    tiles.push(row);
  });
  const data: LevelData = { tiles, spawn, doors, gems, mechs };
  if (pattern) data.pattern = pattern;
  if (seen?.some((r) => /[hc]/.test(r))) {
    if (seen.length !== ROWS || seen.some((r) => r.length !== COLS)) throw new Error(`The seen map must be ${COLS} × ${ROWS}`);
    data.seen = seen.map((r) => [...r].map((ch) => SEEN_CHAR[ch]));
  }
  return data;
}

export class Level {
  readonly data: LevelData;
  /** Moving solids (platforms, gates), kept up to date by the mechanisms. */
  dynamic: Rect[] = [];
  constructor(data: LevelData) {
    this.data = data;
  }

  tile(tx: number, ty: number): Tile {
    if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return 'stone';
    return this.data.tiles[ty][tx];
  }

  /** Top of the solid part of a tile (in tile units from the tile's top), or null if not solid. */
  solidTop(tx: number, ty: number): number | null {
    const t = this.tile(tx, ty);
    if (t === 'empty') return null;
    return t === 'stone' ? 0 : LIQUID_DEPTH;
  }

  /**
   * Does the box overlap anything solid? Returns the blocking extents (the union of solid rects hit)
   * so movement can be resolved, or null if the box is free.
   */
  hit(x0: number, y0: number, x1: number, y1: number): { left: number; right: number; top: number; bottom: number } | null {
    let res: { left: number; right: number; top: number; bottom: number } | null = null;
    for (let ty = Math.floor(y0); ty <= Math.floor(y1 - 1e-9); ty++) {
      for (let tx = Math.floor(x0); tx <= Math.floor(x1 - 1e-9); tx++) {
        const top = this.solidTop(tx, ty);
        if (top === null) continue;
        const ry0 = ty + top;
        if (ry0 >= y1 || ty + 1 <= y0) continue;
        if (!res) res = { left: tx, right: tx + 1, top: ry0, bottom: ty + 1 };
        else {
          res.left = Math.min(res.left, tx);
          res.right = Math.max(res.right, tx + 1);
          res.top = Math.min(res.top, ry0);
          res.bottom = Math.max(res.bottom, ty + 1);
        }
      }
    }
    for (const r of this.dynamic) {
      // r.y1 <= r.y0: a fully open gate has no height left; it must not block as a thin line (a trapdoor's hole).
      if (r.x0 >= x1 || r.x1 <= x0 || r.y0 >= y1 || r.y1 <= y0 || r.y1 <= r.y0) continue;
      if (!res) res = { left: r.x0, right: r.x1, top: r.y0, bottom: r.y1 };
      else {
        res.left = Math.min(res.left, r.x0);
        res.right = Math.max(res.right, r.x1);
        res.top = Math.min(res.top, r.y0);
        res.bottom = Math.max(res.bottom, r.y1);
      }
    }
    return res;
  }

  free(x0: number, y0: number, x1: number, y1: number): boolean {
    return this.hit(x0, y0, x1, y1) === null;
  }

  /** Width of the [x0,x1] span standing on each liquid in the row just below the feet at y. */
  liquidUnder(x0: number, x1: number, feetY: number): Record<Liquid, number> {
    const out: Record<Liquid, number> = { lava: 0, water: 0, poison: 0 };
    const ty = Math.floor(feetY - LIQUID_DEPTH + 0.02);
    for (let tx = Math.floor(x0); tx <= Math.floor(x1 - 1e-9); tx++) {
      const t = this.tile(tx, ty);
      if (t === 'lava' || t === 'water' || t === 'poison') out[t] += Math.min(x1, tx + 1) - Math.max(x0, tx);
    }
    return out;
  }

  /** Distance from a point to the nearest tile of one of the given liquids (Infinity if none nearby). */
  distanceToLiquid(px: number, py: number, kinds: readonly Liquid[], radius: number, visible: (x: number, y: number) => boolean = () => true): number {
    let best = Infinity;
    for (let ty = Math.floor(py - radius); ty <= Math.floor(py + radius); ty++) {
      for (let tx = Math.floor(px - radius); tx <= Math.floor(px + radius); tx++) {
        const t = this.tile(tx, ty);
        if (!(kinds as readonly Tile[]).includes(t) || !visible(tx, ty)) continue;
        const dx = Math.max(tx - px, 0, px - (tx + 1));
        const dy = Math.max(ty + LIQUID_DEPTH - py, 0, py - (ty + 1));
        best = Math.min(best, Math.hypot(dx, dy));
      }
    }
    return best;
  }

  /** Who alone sees the tile at (tx, ty); undefined = both. */
  seenBy(tx: number, ty: number): Seen {
    return this.data.seen?.[ty]?.[tx];
  }

  /** Horizontal runs of the same liquid, for drawing pools (only the cells `visible` allows). */
  pools(visible: (x: number, y: number) => boolean = () => true): { kind: Liquid; x0: number; x1: number; y: number }[] {
    const out: { kind: Liquid; x0: number; x1: number; y: number }[] = [];
    this.data.tiles.forEach((row, y) => {
      let x = 0;
      while (x < COLS) {
        const t = row[x];
        if ((t === 'lava' || t === 'water' || t === 'poison') && visible(x, y)) {
          let e = x;
          while (e + 1 < COLS && row[e + 1] === t && visible(e + 1, y)) e++;
          out.push({ kind: t, x0: x, x1: e + 1, y });
          x = e + 1;
        } else x++;
      }
    });
    return out;
  }
}
