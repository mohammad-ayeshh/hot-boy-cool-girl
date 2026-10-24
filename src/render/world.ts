// Drawing the level: back wall, stone tiles and liquid pools (design doc 4, 9, 14.6).
// This is a first, simple version for the Feel Lab; the full layered-depth art comes later.
import { Graphics } from 'pixi.js';
import { COLS, ROWS, LIQUID_DEPTH, type Level, type Liquid } from '../game/level';

export const T = 32; // world px per tile

const WORLD = { deep: 0x0a1211, dark: 0x16211f, mid: 0x2e3d39, light: 0x55695f, moss: 0x4a5a3c };

// Small deterministic random, so the decoration is the same every time.
function hash(x: number, y: number, k = 0): number {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function drawBackground(g: Graphics): void {
  g.clear();
  const W = COLS * T, H = ROWS * T;
  // far depths: vertical gradient
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    g.rect(0, (H * i) / 24, W, H / 24 + 1).fill(lerpColor(0x0f1c19, 0x070d0c, t));
  }
  // distant pillars (hazy, low contrast)
  for (let i = 0; i < 6; i++) {
    const x = 60 + i * 180 + hash(i, 1) * 50;
    const w = 46 + hash(i, 2) * 30;
    g.rect(x, 0, w, H).fill({ color: 0x132320, alpha: 0.7 });
    g.rect(x + 4, 0, 3, H).fill({ color: 0x1d302b, alpha: 0.6 });
    for (let k = 0; k < 9; k++) g.rect(x - 4, 40 + k * 64, w + 8, 6).fill({ color: 0x0c1715, alpha: 0.8 });
  }
  // back wall carving: faint rune glyphs
  for (let i = 0; i < 14; i++) {
    const x = hash(i, 5) * W, y = 40 + hash(i, 6) * (H - 160);
    const r = 8 + hash(i, 7) * 10;
    g.circle(x, y, r).stroke({ width: 2, color: 0x20332e, alpha: 0.6 });
    g.moveTo(x - r * 0.6, y).lineTo(x + r * 0.6, y).stroke({ width: 2, color: 0x20332e, alpha: 0.6 });
    g.moveTo(x, y - r * 0.6).lineTo(x, y + r * 0.2).stroke({ width: 2, color: 0x20332e, alpha: 0.6 });
  }
  // hanging vines from the ceiling (muted green only)
  for (let i = 0; i < 18; i++) {
    const x = hash(i, 9) * W;
    const len = 30 + hash(i, 10) * 140;
    g.moveTo(x, T).quadraticCurveTo(x + 8, T + len * 0.5, x + (hash(i, 11) - 0.5) * 20, T + len).stroke({ width: 2.5, color: 0x24331f, alpha: 0.8 });
    for (let k = 1; k < len / 14; k++) g.ellipse(x + (k % 2 ? 3 : -3), T + k * 14, 4, 2).fill({ color: 0x2b3d25, alpha: 0.8 });
  }
}

/**
 * `visible`: the cells this phone's player can see (Different eyes, 16.7). A hidden stone is drawn as air
 * and a hidden pool as plain stone floor, so it looks safe (16.8, level 3).
 */
export function drawTiles(g: Graphics, level: Level, visible: (x: number, y: number) => boolean = () => true): void {
  g.clear();
  const looks = (x: number, y: number) => {
    const t = level.tile(x, y);
    return visible(x, y) || t === 'empty' ? t : t === 'stone' ? 'empty' : 'stone';
  };
  const stone = (x: number, y: number) => looks(x, y) === 'stone';
  const air = (x: number, y: number) => looks(x, y) === 'empty';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!stone(x, y)) continue;
      const px = x * T, py = y * T;
      const shade = hash(x, y) * 0.12;
      g.rect(px, py, T, T).fill(lerpColor(WORLD.mid, WORLD.dark, 0.25 + shade));
      // carved block lines (offset every other row, so walls never look like a grid)
      const off = y % 2 ? T / 2 : 0;
      g.rect(px, py + T - 2, T, 2).fill({ color: WORLD.deep, alpha: 0.35 });
      const bx = px + ((off + 16) % T);
      g.rect(bx, py + 2, 2, T - 4).fill({ color: WORLD.deep, alpha: 0.3 });
      if (hash(x, y, 3) < 0.25) {
        const cx = px + 6 + hash(x, y, 4) * 20, cy = py + 6 + hash(x, y, 5) * 16;
        g.moveTo(cx, cy).lineTo(cx + 5, cy + 4).lineTo(cx + 3, cy + 9).stroke({ width: 1.2, color: WORLD.deep, alpha: 0.6 });
      }
      // exposed edges: lit top, dark bottom, soft sides
      if (!stone(x, y - 1)) {
        g.rect(px, py, T, 4).fill(WORLD.light);
        g.rect(px, py + 4, T, 2).fill({ color: WORLD.light, alpha: 0.35 });
        if (air(x, y - 1)) {
          // moss tufts on top edges
          for (let k = 0; k < 3; k++) {
            if (hash(x, y, 10 + k) < 0.55) {
              const mx = px + 4 + hash(x, y, 20 + k) * 24;
              g.ellipse(mx, py + 1, 5 + hash(x, y, 30 + k) * 4, 2.6).fill(WORLD.moss);
            }
          }
        }
      }
      if (!stone(x, y + 1) && y + 1 < ROWS) {
        g.rect(px, py + T - 4, T, 4).fill({ color: WORLD.deep, alpha: 0.8 });
        // vines hanging from the underside of ledges
        if (air(x, y + 1) && hash(x, y, 40) < 0.3) {
          const vx = px + 6 + hash(x, y, 41) * 20;
          const len = 10 + hash(x, y, 42) * 26;
          g.moveTo(vx, py + T).quadraticCurveTo(vx + 5, py + T + len / 2, vx + 1, py + T + len).stroke({ width: 2, color: WORLD.moss, alpha: 0.9 });
          for (let k = 1; k < len / 9; k++) g.ellipse(vx + (k % 2 ? 3 : -2), py + T + k * 9, 3, 1.6).fill(WORLD.moss);
        }
      }
      if (!stone(x - 1, y) && x > 0) g.rect(px, py, 3, T).fill({ color: WORLD.light, alpha: 0.25 });
      if (!stone(x + 1, y) && x + 1 < COLS) g.rect(px + T - 3, py, 3, T).fill({ color: WORLD.deep, alpha: 0.5 });
    }
  }
  // the stone under/around each pool, so pools sit in a basin
  for (const pool of level.pools(visible)) {
    g.rect(pool.x0 * T, pool.y * T + T * 0.75, (pool.x1 - pool.x0) * T, T * 0.25).fill(WORLD.dark);
  }
}

// ------------------------------------------------------------------ liquids

const LIQ: Record<Liquid, { body: number; surf: number; line: number; alpha: number; amp: number; speed: number; freq: number }> = {
  // lava: heavy, slow, bright glowing surface
  lava: { body: 0xb8320c, surf: 0xff6a1a, line: 0xfff0c2, alpha: 1, amp: 1.6, speed: 1.6, freq: 0.11 },
  // water: quick small ripples, see-through
  water: { body: 0x0b57c9, surf: 0x1fa3ff, line: 0xe4faff, alpha: 0.82, amp: 1.2, speed: 4.5, freq: 0.24 },
  // poison: thick, slow, bubbling
  poison: { body: 0x4e1677, surf: 0xa23be8, line: 0xf2d4ff, alpha: 0.95, amp: 1.0, speed: 1.0, freq: 0.16 },
};

interface Ripple { x: number; age: number; power: number }

export class Pools {
  private ripples: Ripple[] = [];
  constructor(private readonly level: Level, readonly g: Graphics, private readonly visible: (x: number, y: number) => boolean = () => true) {}

  /** A splash at world x (in tiles). */
  splash(xTiles: number, power = 1): void {
    this.ripples.push({ x: xTiles * T, age: 0, power });
  }

  update(dt: number, time: number): void {
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < 1.5);
    const g = this.g.clear();
    for (const pool of this.level.pools(this.visible)) {
      const L = LIQ[pool.kind];
      const x0 = pool.x0 * T, x1 = pool.x1 * T;
      const surfaceY = pool.y * T + T * (LIQUID_DEPTH - 0.1); // a bit above the feet: they dip in
      const bottom = pool.y * T + T * 0.75;
      const pts: number[] = [];
      for (let x = x0; x <= x1 + 0.01; x += 4) {
        let y = surfaceY + Math.sin(x * L.freq + time * L.speed) * L.amp + Math.sin(x * L.freq * 0.37 - time * L.speed * 0.6) * L.amp * 0.6;
        for (const r of this.ripples) {
          const d = Math.abs(x - r.x);
          if (d < 90) y += Math.sin(d * 0.25 - r.age * 14) * 4 * r.power * Math.exp(-r.age * 3) * (1 - d / 90);
        }
        pts.push(x, y);
      }
      const top = pts.slice();
      g.poly([...top, x1, bottom, x0, bottom]).fill({ color: L.body, alpha: L.alpha });
      // bright surface band
      const band: number[] = [];
      for (let i = 0; i < top.length; i += 2) band.push(top[i], top[i + 1]);
      for (let i = top.length - 2; i >= 0; i -= 2) band.push(top[i], top[i + 1] + 5);
      g.poly(band).fill({ color: L.surf, alpha: 0.9 });
      g.moveTo(top[0], top[1]);
      for (let i = 2; i < top.length; i += 2) g.lineTo(top[i], top[i + 1]);
      g.stroke({ width: 1.5, color: L.line, alpha: pool.kind === 'water' ? 0.8 : 0.6 });
      // poison bubbles / lava blobs
      if (pool.kind !== 'water') {
        const n = (pool.x1 - pool.x0) * 2;
        for (let i = 0; i < n; i++) {
          const life = (time * (pool.kind === 'poison' ? 0.6 : 0.35) + hash(i, pool.x0)) % 1;
          const bx = x0 + 6 + hash(i, pool.x0, 7) * (x1 - x0 - 12);
          const by = bottom - life * (bottom - surfaceY - 2);
          g.circle(bx, by, (pool.kind === 'poison' ? 2.5 : 1.8) * (0.5 + life)).fill({ color: L.line, alpha: 0.35 * (1 - life * 0.5) });
        }
      }
    }
  }
}

export function lerpColor(a: number, b: number, t: number): number {
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
