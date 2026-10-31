// Drawing the level: back wall and scenery, stone tiles and liquid pools (design doc 4, 9, 14.6).
// Each chapter has its own look (9.3, themes.ts); homemade levels and the Feel Lab use Chapter 1's.
import { Graphics } from 'pixi.js';
import { COLS, ROWS, LIQUID_DEPTH, type Level, type Liquid } from '../game/level';
import type { EmitOptions } from './particles';
import { THEMES, type Theme } from './themes';

export const T = 32; // world px per tile
const W = COLS * T, H = ROWS * T;

// Small deterministic random, so the decoration is the same every time.
function hash(x: number, y: number, k = 0): number {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The still part of the back layers (9.1 layers 6–3): drawn once per chapter. */
export function drawBackground(g: Graphics, th: Theme = THEMES[0]): void {
  g.clear();
  // far depths: vertical gradient
  for (let i = 0; i < 24; i++) g.rect(0, (H * i) / 24, W, H / 24 + 1).fill(lerpColor(th.sky[0], th.sky[1], i / 23));
  SCENERY[th.scenery](g, th);
  if (th.scenery !== 'summit') runes(g, th);
}

/** Back wall carving: faint rune glyphs. */
function runes(g: Graphics, th: Theme): void {
  for (let i = 0; i < 14; i++) {
    const x = hash(i, 5) * W, y = 40 + hash(i, 6) * (H - 160);
    const r = 8 + hash(i, 7) * 10;
    const line = { width: 2, color: th.rune, alpha: 0.6 };
    g.circle(x, y, r).stroke(line);
    g.moveTo(x - r * 0.6, y).lineTo(x + r * 0.6, y).stroke(line);
    g.moveTo(x, y - r * 0.6).lineTo(x, y + r * 0.2).stroke(line);
  }
}

/** Tall pillars with carved bands (the temple's bones, used by several areas). */
function pillars(g: Graphics, th: Theme, n: number, wide: number, seed: number): void {
  for (let i = 0; i < n; i++) {
    const x = 60 + i * (W / n) + hash(i, seed) * 50;
    const w = wide + hash(i, seed + 1) * 30;
    g.rect(x, 0, w, H).fill({ color: th.far, alpha: 0.7 });
    g.rect(x + 4, 0, 3, H).fill({ color: th.farEdge, alpha: 0.6 });
    for (let k = 0; k < 9; k++) g.rect(x - 4, 40 + k * 64, w + 8, 6).fill({ color: th.sky[1], alpha: 0.8 });
  }
}

const SCENERY: Record<Theme['scenery'], (g: Graphics, th: Theme) => void> = {
  // Ch 1: moonlight through cracks in the roof, pillars, giant roots and hanging vines
  jungle(g, th) {
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 260 + hash(i, 50) * 80;
      g.poly([x, 0, x + 50, 0, x + 170, H, x + 60, H]).fill({ color: 0xa9c4b4, alpha: 0.03 });
    }
    pillars(g, th, 6, 46, 1);
    for (let i = 0; i < 5; i++) {
      const x = hash(i, 60) * W, w = 10 + hash(i, 61) * 10;
      g.moveTo(x, H).bezierCurveTo(x + 30, H - 120, x - 40, H - 200, x + 20 * (hash(i, 62) - 0.5), H - 300 - hash(i, 63) * 150)
        .stroke({ width: w, color: 0x111d17, alpha: 0.8 });
    }
    for (let i = 0; i < 18; i++) {
      const x = hash(i, 9) * W;
      const len = 30 + hash(i, 10) * 140;
      g.moveTo(x, T).quadraticCurveTo(x + 8, T + len * 0.5, x + (hash(i, 11) - 0.5) * 20, T + len).stroke({ width: 2.5, color: 0x24331f, alpha: 0.8 });
      for (let k = 1; k < len / 14; k++) g.ellipse(x + (k % 2 ? 3 : -3), T + k * 14, 4, 2).fill({ color: 0x2b3d25, alpha: 0.8 });
    }
  },
  // Ch 2: drowned arches, water stains running down, a dark flood line
  flooded(g, th) {
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 190, w = 38;
      g.rect(x, 90, w, H).fill({ color: th.far, alpha: 0.8 });
      g.rect(x + 4, 90, 3, H).fill({ color: th.farEdge, alpha: 0.5 });
      if (i < 5) g.moveTo(x + w / 2, 110).quadraticCurveTo(x + 95 + w / 2, -10, x + 190 + w / 2, 110).stroke({ width: 22, color: th.far, alpha: 0.8 });
    }
    for (let i = 0; i < 26; i++) {
      const x = hash(i, 70) * W, len = 60 + hash(i, 71) * 260;
      g.rect(x, 0, 3 + hash(i, 72) * 5, len).fill({ color: th.sky[1], alpha: 0.35 });
    }
    g.rect(0, H * 0.62, W, H * 0.38).fill({ color: th.sky[1], alpha: 0.3 });
    g.rect(0, H * 0.62, W, 3).fill({ color: th.farEdge, alpha: 0.5 });
  },
  // Ch 3: square pillars with rivets, beams and hanging chains (the gears move: drawScenery)
  machine(g, th) {
    for (const y of [96, 430]) {
      g.rect(0, y, W, 18).fill({ color: th.far, alpha: 0.8 });
      for (let x = 20; x < W; x += 48) g.circle(x, y + 9, 3).fill({ color: th.farEdge, alpha: 0.7 });
    }
    pillars(g, th, 4, 70, 80);
    for (let i = 0; i < 7; i++) {
      const x = 70 + hash(i, 90) * (W - 140), len = 120 + hash(i, 91) * 260;
      for (let y = 0; y < len; y += 14) g.ellipse(x, y, i % 2 ? 4 : 3, 7).stroke({ width: 2.5, color: th.farEdge, alpha: 0.55 });
    }
  },
  // Ch 4: open night sky, a pale moon, two mountain ridges and broken roof arches
  summit(g, th) {
    g.circle(W * 0.78, H * 0.2, 60).fill({ color: 0xcfd8e0, alpha: 0.03 });
    g.circle(W * 0.78, H * 0.2, 34).fill({ color: 0xcfd8e0, alpha: 0.1 });
    for (let i = 0; i < 70; i++) g.circle(hash(i, 100) * W, hash(i, 101) * H * 0.55, 0.8 + hash(i, 102) * 1.2).fill({ color: 0xd8e0ea, alpha: 0.15 + hash(i, 103) * 0.3 });
    const ridges = [[H * 0.5, 110, th.far, 110], [H * 0.66, 80, lerpColor(th.far, th.sky[1], 0.4), 120]] as const;
    for (const [base, amp, color, k] of ridges) {
      const pts: number[] = [0, H];
      for (let x = 0; x <= W; x += 64) pts.push(x, base - hash(x, k) * amp);
      pts.push(W, H);
      g.poly(pts).fill(color);
    }
    for (let i = 0; i < 3; i++) {
      const x = 100 + i * 360 + hash(i, 130) * 60, top = H * 0.35 + hash(i, 131) * 60;
      g.rect(x, top, 34, H - top).fill({ color: th.sky[1], alpha: 0.85 });
      g.rect(x + 120, top + 40, 34, H - top).fill({ color: th.sky[1], alpha: 0.85 });
      g.moveTo(x + 17, top + 8).quadraticCurveTo(x + 60, top - 50, x + 100, top - 6).stroke({ width: 18, color: th.sky[1], alpha: 0.85 });
    }
  },
  // Ch 5: big carved wall blocks (the giant eyes blink: drawScenery)
  eyes(g, th) {
    for (let y = 0; y < H; y += 72) {
      for (let x = (y / 72) % 2 ? -60 : 0; x < W; x += 120) g.rect(x + 2, y + 2, 116, 68).stroke({ width: 2, color: th.far, alpha: 0.9 });
    }
  },
  // Ch 6: great round vault doors, sealed niches and heavy pillars
  vault(g, th) {
    const doors = [[230, 230, 120], [800, 260, 140]] as const;
    for (const [cx, cy, r] of doors) {
      g.circle(cx, cy, r).fill({ color: th.far, alpha: 0.8 }).stroke({ width: 6, color: th.farEdge, alpha: 0.6 });
      g.circle(cx, cy, r * 0.72).stroke({ width: 3, color: th.farEdge, alpha: 0.5 });
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        g.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25).lineTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7)
          .stroke({ width: 3, color: th.farEdge, alpha: 0.4 });
      }
      g.circle(cx, cy, r * 0.2).fill({ color: th.sky[1], alpha: 0.8 });
    }
    // tall arched niches: clearly carved into the wall, never block-shaped like a ledge
    for (let i = 0; i < 7; i++) {
      const x = 40 + hash(i, 140) * (W - 120), y = 60 + hash(i, 141) * (H - 260);
      g.roundRect(x, y, 40, 96, 20).fill({ color: th.sky[1], alpha: 0.55 }).stroke({ width: 2, color: th.farEdge, alpha: 0.3 });
    }
    pillars(g, th, 3, 80, 150);
  },
  // Ch 7: a cold cave: hanging rocks and rising ones, far and near (the fog drifts: drawScenery)
  caves(g, th) {
    const layers = [[0, th.far, 22], [1, lerpColor(th.far, th.sky[1], 0.5), 16]] as const;
    for (const [layer, color, n] of layers) {
      for (let i = 0; i < n; i++) {
        const x = hash(i, 160 + layer) * W, w = 24 + hash(i, 162 + layer) * 50, len = 60 + hash(i, 164 + layer) * (layer ? 200 : 140);
        g.poly([x - w / 2, 0, x + w / 2, 0, x + w * 0.1, len]).fill({ color, alpha: 0.9 });
        if (i % 2) g.poly([x - w / 2, H, x + w / 2, H, x - w * 0.1, H - len * 0.6]).fill({ color, alpha: 0.9 });
      }
    }
  },
};

/** The moving part of the scenery (gears, blinking eyes, fog, twinkling stars), redrawn every frame. `time` in seconds. */
export function drawScenery(g: Graphics, th: Theme, time: number): void {
  g.clear();
  const fog = (n: number, y0: number, y1: number, speed: number, color: number, alpha: number) => {
    for (let i = 0; i < n; i++) {
      const x = ((hash(i, 200) * (W + 500) + time * speed * (0.6 + hash(i, 201))) % (W + 500)) - 250;
      g.ellipse(x, y0 + hash(i, 202) * (y1 - y0), 200 + hash(i, 203) * 120, 18 + hash(i, 204) * 14).fill({ color, alpha });
    }
  };
  switch (th.scenery) {
    case 'flooded':
      fog(4, H * 0.68, H * 0.95, 9, 0x8fa6a3, 0.045);
      break;
    case 'caves':
      fog(5, H * 0.2, H * 0.9, 5, 0x9aa6b4, 0.035);
      break;
    case 'summit':
      for (let i = 0; i < 14; i++) {
        const a = 0.5 + 0.5 * Math.sin(time * (0.8 + hash(i, 210)) + i * 2.1);
        g.circle(hash(i, 211) * W, hash(i, 212) * H * 0.45, 1.6).fill({ color: 0xe6edf4, alpha: 0.12 + 0.4 * a * a });
      }
      break;
    case 'machine': {
      // meshing neighbours turn opposite ways; the rim speed is shared, so small gears spin faster
      const gears = [[170, 170, 96, 12, 1], [318, 268, 64, 8, -1], [800, 130, 112, 14, -1], [944, 330, 72, 9, 1], [560, 470, 80, 10, 1]] as const;
      for (const [x, y, r, teeth, dir] of gears) gear(g, th, x, y, r, teeth, dir * time * (14 / r));
      break;
    }
    case 'eyes': {
      const eyes = [[150, 140, 90], [480, 90, 70], [820, 170, 110], [300, 360, 80], [700, 420, 95]] as const;
      eyes.forEach(([x, y, rx], i) => {
        const period = 7 + hash(i, 220) * 5, t = (time + hash(i, 221) * period) % period;
        const open = t < 0.35 ? Math.abs(t - 0.175) / 0.175 : 1; // a slow blink now and then
        eye(g, th, x, y, rx, open, Math.sin(time * 0.25 + i) * 0.25);
      });
      break;
    }
  }
}

function gear(g: Graphics, th: Theme, cx: number, cy: number, r: number, teeth: number, angle: number): void {
  const pts: number[] = [];
  for (let k = 0; k < teeth; k++) {
    for (const [f, rr] of [[0, 0.84], [0.15, 1], [0.45, 1], [0.6, 0.84]] as const) {
      const a = angle + ((k + f) / teeth) * Math.PI * 2;
      pts.push(cx + Math.cos(a) * r * rr, cy + Math.sin(a) * r * rr);
    }
  }
  g.poly(pts).fill({ color: th.far, alpha: 0.85 }).stroke({ width: 2, color: th.farEdge, alpha: 0.6 });
  for (let k = 0; k < 4; k++) {
    const a = angle + (k / 4) * Math.PI * 2;
    g.moveTo(cx, cy).lineTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7).stroke({ width: 6, color: th.sky[1], alpha: 0.6 });
  }
  g.circle(cx, cy, r * 0.2).fill({ color: th.farEdge, alpha: 0.7 });
}

/** A carved eye: `open` 0 (shut) … 1, `look` −1 … 1 (the stone iris drifts a little). */
function eye(g: Graphics, th: Theme, cx: number, cy: number, rx: number, open: number, look: number): void {
  const ry = rx * 0.45;
  g.moveTo(cx - rx, cy).quadraticCurveTo(cx, cy - ry * 2 * open, cx + rx, cy).quadraticCurveTo(cx, cy + ry * 2 * open, cx - rx, cy)
    .fill({ color: th.sky[1], alpha: 0.5 }).stroke({ width: 4, color: th.farEdge, alpha: 0.55 });
  if (open > 0.3) {
    const ir = ry * 0.8 * Math.min(1, open * 1.2);
    g.circle(cx + look * rx * 0.4, cy, ir).stroke({ width: 3, color: th.farEdge, alpha: 0.45 });
    g.circle(cx + look * rx * 0.4, cy, ir * 0.4).fill({ color: th.far, alpha: 0.9 });
  }
}

/** One floating bit for the air layer (9.1 layer 2), somewhere on the screen. */
export function airParticle(th: Theme): EmitOptions {
  const a = th.air, x = Math.random() * W;
  const base = { count: 1, colors: a.colors, size: a.size, alpha: a.alpha };
  switch (a.kind) {
    case 'float': return { ...base, x, y: H * (0.1 + Math.random() * 0.85), speed: [5, 18], life: [2.5, 4.5], gravity: -3, drag: 0.9 };
    case 'fall': return { ...base, x, y: Math.random() * H * 0.8, speed: [3, 10], angle: Math.PI / 2, spread: 0.6, life: [3, 5], gravity: 4 };
    case 'drip': return { ...base, x, y: T + Math.random() * H * 0.4, speed: [0, 10], angle: Math.PI / 2, spread: 0.1, life: [0.6, 1.1], gravity: 500 };
    case 'wind': return { ...base, x: x - W * 0.2, y: Math.random() * H, speed: [60, 130], angle: 0.15, spread: 0.25, life: [2, 4] };
    case 'drift': return { ...base, x, y: H * (0.2 + Math.random() * 0.7), speed: [6, 16], angle: Math.random() < 0.5 ? 0 : Math.PI, spread: 0.4, life: [4, 7] };
  }
}

/**
 * `visible`: the cells this phone's player can see (Different eyes, 16.7). A hidden stone is drawn as air
 * and a hidden pool as plain stone floor, so it looks safe (16.8, level 3).
 */
export function drawTiles(g: Graphics, level: Level, visible: (x: number, y: number) => boolean = () => true, th: Theme = THEMES[0]): void {
  g.clear();
  const S = th.stone;
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
      g.rect(px, py, T, T).fill(lerpColor(S.mid, S.dark, 0.25 + shade));
      // carved block lines (offset every other row, so walls never look like a grid)
      const off = y % 2 ? T / 2 : 0;
      g.rect(px, py + T - 2, T, 2).fill({ color: S.deep, alpha: 0.35 });
      const bx = px + ((off + 16) % T);
      g.rect(bx, py + 2, 2, T - 4).fill({ color: S.deep, alpha: 0.3 });
      if (hash(x, y, 3) < 0.25) {
        const cx = px + 6 + hash(x, y, 4) * 20, cy = py + 6 + hash(x, y, 5) * 16;
        g.moveTo(cx, cy).lineTo(cx + 5, cy + 4).lineTo(cx + 3, cy + 9).stroke({ width: 1.2, color: S.deep, alpha: 0.6 });
      }
      // exposed edges: lit top, dark bottom, soft sides
      if (!stone(x, y - 1)) {
        g.rect(px, py, T, 4).fill(S.light);
        g.rect(px, py + 4, T, 2).fill({ color: S.light, alpha: 0.35 });
        if (air(x, y - 1) && th.top !== null) {
          // moss (or algae, or snow) tufts on top edges
          for (let k = 0; k < 3; k++) {
            if (hash(x, y, 10 + k) < 0.55) {
              const mx = px + 4 + hash(x, y, 20 + k) * 24;
              g.ellipse(mx, py + 1, 5 + hash(x, y, 30 + k) * 4, 2.6).fill(th.top);
            }
          }
        }
      }
      if (!stone(x, y + 1) && y + 1 < ROWS) {
        g.rect(px, py + T - 4, T, 4).fill({ color: S.deep, alpha: 0.8 });
        if (air(x, y + 1) && th.hang && hash(x, y, 40) < 0.3) hang(g, th, px + 6 + hash(x, y, 41) * 20, py + T, 10 + hash(x, y, 42) * 26);
      }
      if (!stone(x - 1, y) && x > 0) g.rect(px, py, 3, T).fill({ color: S.light, alpha: 0.25 });
      if (!stone(x + 1, y) && x + 1 < COLS) g.rect(px + T - 3, py, 3, T).fill({ color: S.deep, alpha: 0.5 });
    }
  }
  // the stone under/around each pool, so pools sit in a basin
  for (const pool of level.pools(visible)) {
    g.rect(pool.x0 * T, pool.y * T + T * 0.75, (pool.x1 - pool.x0) * T, T * 0.25).fill(S.dark);
  }
}

/** What hangs from the underside of a ledge: vines, a wet streak with a drop, or a short chain. */
function hang(g: Graphics, th: Theme, x: number, y: number, len: number): void {
  const c = th.hangColor;
  if (th.hang === 'vines') {
    g.moveTo(x, y).quadraticCurveTo(x + 5, y + len / 2, x + 1, y + len).stroke({ width: 2, color: c, alpha: 0.9 });
    for (let k = 1; k < len / 9; k++) g.ellipse(x + (k % 2 ? 3 : -2), y + k * 9, 3, 1.6).fill(c);
  } else if (th.hang === 'drips') {
    g.rect(x - 1, y, 2, len * 0.5).fill({ color: c, alpha: 0.35 });
    g.ellipse(x, y + len * 0.5 + 2, 1.8, 2.6).fill({ color: c, alpha: 0.55 });
  } else {
    for (let k = 0; k * 9 < len * 0.7; k++) g.ellipse(x, y + 4 + k * 9, k % 2 ? 2 : 3, 5).stroke({ width: 1.8, color: c, alpha: 0.85 });
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
