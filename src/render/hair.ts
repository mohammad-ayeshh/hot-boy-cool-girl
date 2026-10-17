// Hair that trails behind the characters as they move: a chain of points simulated in world space
// (Verlet). The root is glued to the head; the rest lags behind, so fast moves leave a streak.
// Cool Girl: a long flowing water ribbon. Hot Boy: a flame tail rising from his mohawk.
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
}

export const COOL_HAIR: HairStyle = { count: 13, seg: 3.4, gravity: 220, keep: 0.94, stiffness: 0.05, rest: [0.55, 1] };
export const HOT_FLAME: HairStyle = { count: 7, seg: 3.2, gravity: -420, keep: 0.86, stiffness: 0.09, rest: [0.9, -0.55] };

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
    while (this.acc >= STEP) {
      this.acc -= STEP;
      this.x[0] = this.px[0] = rx;
      this.y[0] = this.py[0] = ry;
      for (let i = 1; i < s.count; i++) {
        const vx = (this.x[i] - this.px[i]) * s.keep;
        const vy = (this.y[i] - this.py[i]) * s.keep;
        this.px[i] = this.x[i];
        this.py[i] = this.y[i];
        // a gentle sideways wave, like hair in water / a flickering flame
        const wave = Math.sin(time * 6 - i * 0.7) * (0.25 + speed * 0.5) * (i / s.count);
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

  /** A thin line along the chain (a shine on the hair). */
  line(g: Graphics, from: number, to: number, width: number, color: number, alpha: number, offset = 0): void {
    g.moveTo(this.x[from], this.y[from] - offset);
    for (let i = from + 1; i <= Math.min(to, this.style.count - 1); i++) g.lineTo(this.x[i], this.y[i] - offset);
    g.stroke({ width, color, alpha, cap: 'round' });
  }
}
