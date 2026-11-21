// Hair that trails behind the characters as they move: a chain of points simulated in world space
// (Verlet). The root is glued to the head; the rest lags behind, so fast moves leave a streak.
// Cool Girl: a long flowing water ribbon. Hot Boy: the two long tails of his headband (his flame hair is stiff).
import type { Graphics } from 'pixi.js';

export interface HairStyle {
  /** points in the chain (more = longer, smoother) */
  count: number;
  /** distance between points, world px */
  seg: number;
  /** px/s², negative = rises (flames) */
  gravity: number;
  /** velocity kept per 1/120 s step (0..1): lower = more drag, hangs closer to the head */
  keep: number;
  /** pull toward the resting shape near the root (0..1 per step) */
  stiffness: number;
  /** resting direction as (back, down) — "back" is flipped to behind the character */
  rest: [number, number];
  /** the sideways wave: [speed, phase step per point, size standing, extra size at full run]; default = her slow float */
  wave?: [number, number, number, number];
  /** phase offset of the wave, so two tails don't move as one */
  phase?: number;
}

export const COOL_HAIR: HairStyle = { count: 13, seg: 3.4, gravity: 220, keep: 0.94, stiffness: 0.05, rest: [0.55, 1] };
// His headband tails: cloth that whips and snaps (fast, short wave), shorter than her hair, one a little lower.
export const HOT_BAND: HairStyle = { count: 9, seg: 3.3, gravity: 260, keep: 0.88, stiffness: 0.14, rest: [1, 0.3], wave: [13, 1.1, 0.12, 0.75] };
export const HOT_BAND_LOW: HairStyle = { count: 8, seg: 3.1, gravity: 260, keep: 0.88, stiffness: 0.14, rest: [1, 0.65], wave: [13, 1.1, 0.12, 0.75], phase: 1.3 };

const STEP = 1 / 120;

export class HairChain {
  readonly x: Float32Array;
  readonly y: Float32Array;
  private readonly px: Float32Array;
  private readonly py: Float32Array;
  private acc = 0;
  private ready = false;

  constructor(readonly style: HairStyle) {
    this.x = new Float32Array(style.count);
    this.y = new Float32Array(style.count);
    this.px = new Float32Array(style.count);
    this.py = new Float32Array(style.count);
  }

  /** Snap into the resting shape (after a respawn). */
  reset(rx: number, ry: number, facing: number): void {
    const [bx, by] = this.restDir(facing);
    for (let i = 0; i < this.style.count; i++) {
      this.x[i] = this.px[i] = rx + bx * this.style.seg * i;
      this.y[i] = this.py[i] = ry + by * this.style.seg * i;
    }
    this.ready = true;
  }

  /** speed: 0..1, used to make the flow livelier while moving. */
  update(rx: number, ry: number, facing: number, dt: number, time: number, speed: number): void {
    if (!this.ready) this.reset(rx, ry, facing);
    // Fixed small steps keep it stable on 60 Hz and 120 Hz screens.
    this.acc = Math.min(this.acc + dt, 0.1);
    const s = this.style;
    const [bx, by] = this.restDir(facing);
    const [wSpeed, wStep, wBase, wRun] = s.wave ?? [6, 0.7, 0.25, 0.5];
    const ph = s.phase ?? 0;
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.x[0] = this.px[0] = rx;
      this.y[0] = this.py[0] = ry;
      for (let i = 1; i < s.count; i++) {
        const vx = (this.x[i] - this.px[i]) * s.keep;
        const vy = (this.y[i] - this.py[i]) * s.keep;
        this.px[i] = this.x[i];
        this.py[i] = this.y[i];
        // a sideways wave: hair floating in water, or cloth snapping in the wind
        const wave = Math.sin(time * wSpeed - i * wStep + ph) * (wBase + speed * wRun) * (i / s.count);
        this.x[i] += vx - by * wave * facing * 0.6;
        this.y[i] += vy + s.gravity * STEP * STEP + bx * wave * 0.6;
        // keep the shape near the root (stiffer close to the head)
        const k = s.stiffness * (1 - i / s.count);
        this.x[i] += (rx + bx * s.seg * i - this.x[i]) * k;
        this.y[i] += (ry + by * s.seg * i - this.y[i]) * k;
      }
      // keep the segment lengths
      for (let it = 0; it < 2; it++) {
        for (let i = 1; i < s.count; i++) {
          const dx = this.x[i] - this.x[i - 1], dy = this.y[i] - this.y[i - 1];
          const d = Math.hypot(dx, dy) || 1e-6;
          const f = s.seg / d;
          this.x[i] = this.x[i - 1] + dx * f;
          this.y[i] = this.y[i - 1] + dy * f;
        }
      }
    }
  }

  private restDir(facing: number): [number, number] {
    const [b, d] = this.style.rest;
    const len = Math.hypot(b, d);
    return [(-facing * b) / len, d / len];
  }

  tip(): { x: number; y: number } {
    const n = this.style.count - 1;
    return { x: this.x[n], y: this.y[n] };
  }

  /** A ribbon that tapers from `w0` at the root to `w1` at the tip. */
  ribbon(g: Graphics, w0: number, w1: number, color: number, alpha = 1, widthWobble?: (i: number) => number): void {
    const n = this.style.count;
    const left: number[] = [];
    const right: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      let tx = this.x[b] - this.x[a], ty = this.y[b] - this.y[a];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) * (widthWobble ? widthWobble(i) : 1) * 0.5;
      left.push(this.x[i] - ty * w, this.y[i] + tx * w);
      right.unshift(this.x[i] + ty * w, this.y[i] - tx * w);
    }
    g.poly([...left, ...right]).fill({ color, alpha });
  }

  /** A cloth tail that tapers from `w0` to `w1` and ends in a sharp V cut, with a lighter line down the middle. */
  tail(g: Graphics, w0: number, w1: number, color: number, edge: number): void {
    const n = this.style.count;
    const left: number[] = [];
    const right: number[] = [];
    let tx = 1, ty = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      tx = this.x[b] - this.x[a];
      ty = this.y[b] - this.y[a];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const w = (w0 + (w1 - w0) * (i / (n - 1))) * 0.5;
      left.push(this.x[i] - ty * w, this.y[i] + tx * w);
      right.unshift(this.x[i] + ty * w, this.y[i] - tx * w);
    }
    // the V cut: both corners stick out past the end, the middle stays in
    const e = n - 1, ext = 2.6;
    const lx = left[e * 2], ly = left[e * 2 + 1], rx = right[0], ry = right[1];
    const notch = [lx + tx * ext, ly + ty * ext, this.x[e] + tx * 0.4, this.y[e] + ty * 0.4, rx + tx * ext, ry + ty * ext];
    g.poly([...left, ...notch, ...right]).fill(color);
    this.line(g, 0, e, 0.7, edge, 1);
  }

  /** A thin line along the chain (a shine on the hair). */
  line(g: Graphics, from: number, to: number, width: number, color: number, alpha: number, offset = 0): void {
    g.moveTo(this.x[from], this.y[from] - offset);
    for (let i = from + 1; i <= Math.min(to, this.style.count - 1); i++) g.lineTo(this.x[i], this.y[i] - offset);
    g.stroke({ width, color, alpha, cap: 'round' });
  }
}

/** His headband's two tails (doc 14.5): tied at the knot behind his head, simulated like her hair, lower one first. */
export function drawBand(upper: HairChain, lower: HairChain, v: { facing: number; headPoint(x: number, y: number): { x: number; y: number } }, reset: boolean, dt: number, time: number, speed: number, g: Graphics, C: (c: number) => number = (c) => c): void {
  for (const [chain, y] of [[upper, -3.4], [lower, -1.8]] as [HairChain, number][]) {
    const root = v.headPoint(-11, y);
    if (reset) chain.reset(root.x, root.y, v.facing);
    chain.update(root.x, root.y, v.facing, dt, time, speed);
  }
  lower.tail(g, 2.6, 2, C(0x7a1d08), C(0xb33a12));
  upper.tail(g, 3, 2.3, C(0x7a1d08), C(0xb33a12));
}
