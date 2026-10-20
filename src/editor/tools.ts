// What each level designer tool does to a level (design doc 16.3). Pure functions on rows + mechs.
import { COLS, ROWS } from '../game/level';
import type { MechDef, Rune } from '../game/mechanisms';

export interface Draft { rows: string[]; mechs: MechDef[] }

export type Tool =
  | 'stone' | 'erase' | 'lava' | 'water' | 'poison'
  | 'gemFire' | 'gemWater' | 'startFire' | 'startWater' | 'doorFire' | 'doorWater'
  | 'button' | 'lever' | 'platform' | 'gate';

/** Map character each tool writes. */
export const TOOL_CHAR: Partial<Record<Tool, string>> = {
  stone: '#', erase: '.', lava: 'L', water: 'W', poison: 'P',
  gemFire: 'r', gemWater: 'b', startFire: 'h', startWater: 'c', doorFire: 'H', doorWater: 'C',
};
/** Tools you drag across the grid like a brush. */
export const BRUSH: Tool[] = ['stone', 'erase', 'lava', 'water', 'poison'];
const SINGLE = 'hcHC'; // only one of each per level
export const MAX_PLATFORM = 8;

/** The outer ring of stone is fixed, so nobody can fall out of the world. */
export const isBorder = (x: number, y: number): boolean => x <= 0 || y <= 0 || x >= COLS - 1 || y >= ROWS - 1;
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < COLS && y < ROWS;

const put = (d: Draft, x: number, y: number, ch: string) => {
  d.rows[y] = d.rows[y].slice(0, x) + ch + d.rows[y].slice(x + 1);
};

/** Index of the mechanism covering this tile (platforms count at both ends), or -1. */
export function mechAt(d: Draft, x: number, y: number): number {
  for (let i = d.mechs.length - 1; i >= 0; i--) {
    const m = d.mechs[i];
    if ((m.kind === 'button' || m.kind === 'lever') && m.x === x && m.y === y) return i;
    if (m.kind === 'gate' && x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h) return i;
    if (m.kind === 'platform' && ((y === m.y && x >= m.x && x < m.x + m.w) || (y === m.to[1] && x >= m.to[0] && x < m.to[0] + m.w))) return i;
  }
  return -1;
}

/** Use a map tool on one tile. Returns true if anything changed. */
export function paint(d: Draft, tool: Tool, x: number, y: number): boolean {
  const ch = TOOL_CHAR[tool];
  if (!ch || !inside(x, y) || isBorder(x, y)) return false;
  const old = d.rows[y][x];
  if (tool === 'erase') {
    const i = mechAt(d, x, y);
    if (i >= 0) { d.mechs.splice(i, 1); return true; }
    if (old === '.') return false;
    put(d, x, y, '.');
    return true;
  }
  // Brushes paint around start spots and doors instead of wiping them out by accident.
  if (BRUSH.includes(tool) && SINGLE.includes(old)) return false;
  if (old === ch) return false;
  if (SINGLE.includes(ch)) {
    d.rows.forEach((r, yy) => { const xx = r.indexOf(ch); if (xx >= 0) put(d, xx, yy, '.'); });
  }
  put(d, x, y, ch);
  return true;
}

/** Button or lever: tap to place, tap it again to remove. */
export function toggleSwitch(d: Draft, kind: 'button' | 'lever', x: number, y: number, rune: Rune): boolean {
  if (!inside(x, y) || isBorder(x, y)) return false;
  const i = d.mechs.findIndex((m) => (m.kind === 'button' || m.kind === 'lever') && m.x === x && m.y === y);
  if (i >= 0) {
    const was = d.mechs[i].kind;
    d.mechs.splice(i, 1);
    if (was === kind) return true;
  }
  d.mechs.push({ kind, x, y, rune });
  return true;
}

/** A dragged box, clamped inside the border. */
export function box(x0: number, y0: number, x1: number, y1: number): { x: number; y: number; w: number; h: number } {
  const cl = (v: number, hi: number) => Math.max(1, Math.min(hi - 2, v));
  const ax = cl(Math.min(x0, x1), COLS), bx = cl(Math.max(x0, x1), COLS);
  const ay = cl(Math.min(y0, y1), ROWS), by = cl(Math.max(y0, y1), ROWS);
  return { x: ax, y: ay, w: bx - ax + 1, h: by - ay + 1 };
}

export function addGate(d: Draft, x0: number, y0: number, x1: number, y1: number, rune: Rune): void {
  const b = box(x0, y0, x1, y1);
  d.mechs.push({ kind: 'gate', ...b, rune });
}

/** Platform: drag sideways for its width. It starts with nowhere to go; setPlatformTarget gives it one. */
export function addPlatform(d: Draft, x0: number, x1: number, y: number, rune: Rune): number {
  const b = box(x0, y, x1, y);
  const w = Math.min(MAX_PLATFORM, b.w);
  d.mechs.push({ kind: 'platform', x: b.x, y: b.y, w, to: [b.x, b.y], rune });
  return d.mechs.length - 1;
}

export function setPlatformTarget(d: Draft, i: number, x: number, y: number): boolean {
  const m = d.mechs[i];
  if (!m || m.kind !== 'platform') return false;
  const b = box(x, y, x + m.w - 1, y);
  m.to = [Math.min(b.x, COLS - 1 - m.w), b.y];
  return true;
}
