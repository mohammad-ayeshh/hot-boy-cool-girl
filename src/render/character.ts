// Hot Boy and Cool Girl, drawn in code (design doc 14.2–14.5).
// Local space: origin = middle of the feet, +x = the way they face, units = world px (32 per tile).
// The whole figure is ~48 px (1.5 tiles) tall: about half head, half body.
import { Container, Graphics } from 'pixi.js';
import type { Elem } from '../game/level';

export interface Pose {
  time: number;
  /** 0..1 share of run speed */
  speed: number;
  grounded: boolean;
  /** vertical speed in tiles/s, negative = rising */
  vy: number;
  runPhase: number;
  /** seconds standing still */
  idle: number;
  animate: boolean;
  /** 0..1 how close the deadly liquid is */
  danger: number;
  /** 0..1 flash to white */
  whiten: number;
  /** 0..1 smoothed "excitement" (running, jumping) */
  excite: number;
  /** seconds since the level was completed, or -1 */
  victory: number;
}

const HOT = { core: 0xfff0c2, light: 0xffb02e, main: 0xff6a1a, dark: 0xb8320c, ink: 0x4a1204 };
const COOL = { core: 0xe4faff, light: 0x7adfff, main: 0x1fa3ff, dark: 0x0b57c9, ink: 0x06244f };
const SHADES = 0x0a1211;

function mix(a: number, b: number, t: number): number {
  if (t <= 0) return a;
  const ch = (s: number) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

export class CharacterView extends Container {
  /** Squash & stretch, set by the scene each frame. */
  sx = 1;
  sy = 1;
  facing: -1 | 1 = 1;
  /** The long hair is drawn by the stage as a trailing chain (render/hair.ts) instead of here. */
  trailHair = false;

  private readonly back = new Graphics();
  private readonly body = new Graphics();
  private readonly upper = new Container();
  private readonly upperG = new Graphics();
  private readonly head = new Container();
  private readonly headG = new Graphics();
  private blinkAt = 2 + Math.random() * 3;

  constructor(readonly elem: Elem) {
    super();
    this.upper.addChild(this.upperG, this.head);
    this.head.addChild(this.headG);
    this.addChild(this.back, this.body, this.upper);
  }

  /** A point given in head space (origin = middle of the head), in the parent's (world) space. */
  headPoint(px: number, py: number): { x: number; y: number } {
    const hr = this.head.rotation;
    const x1 = this.head.x + px * Math.cos(hr) - py * Math.sin(hr);
    const y1 = this.head.y + px * Math.sin(hr) + py * Math.cos(hr);
    const ur = this.upper.rotation;
    const x2 = this.upper.x + x1 * Math.cos(ur) - y1 * Math.sin(ur);
    const y2 = this.upper.y + x1 * Math.sin(ur) + y1 * Math.cos(ur);
    return { x: this.x + x2 * this.scale.x, y: this.y + y2 * this.scale.y };
  }

  draw(p: Pose): void {
    this.scale.set(this.facing * this.sx, this.sy);
    if (this.elem === 'fire') this.drawHot(p);
    else this.drawCool(p);
  }

  private blinking(p: Pose): boolean {
    if (p.time > this.blinkAt + 0.12) this.blinkAt = p.time + 2.5 + Math.random() * 3;
    return p.animate && p.time > this.blinkAt;
  }

  // ------------------------------------------------------------------ Hot Boy
  private drawHot(p: Pose): void {
    const w = p.whiten;
    const C = (c: number) => mix(c, 0xffffff, w);
    const a = p.animate;
    const run = a && p.grounded && p.speed > 0.05;
    const ph = p.runPhase;
    const hipY = -13 + (run ? -Math.abs(Math.sin(ph)) * 2.2 : a ? Math.sin(p.time * 3) * 0.4 : 0); // bouncy

    // Legs (back leg first, darker)
    const back = this.back.clear();
    const body = this.body.clear();
    const legs = legPoses(p, run, ph, 7, 4.5, 'hot');
    drawLeg(back, -2, hipY, legs[1], C(mix(HOT.dark, 0x000000, 0.25)), 4.5);
    drawLeg(body, 2, hipY, legs[0], C(HOT.dark), 4.5);

    // Upper body leans forward with speed: he's always in a hurry.
    this.upper.position.set(0, hipY);
    this.upper.rotation = a ? 0.08 + p.speed * 0.2 + (p.grounded ? 0 : -p.vy * 0.004) : 0.08;
    const g = this.upperG.clear();
    const swing = run ? Math.sin(ph) * 7 : 0;
    const air = !p.grounded && a;
    // back arm
    const backHand = air ? { x: -7, y: p.vy < 0 ? -20 : -17 } : idleHot(p, -1) ?? { x: -4 - swing * 0.7, y: -1 + Math.abs(swing) * 0.15 };
    limb(g, -4, -10, backHand.x, backHand.y, C(mix(HOT.main, 0x000000, 0.25)), 4);
    g.circle(backHand.x, backHand.y, 2.6).fill(C(mix(HOT.light, 0x000000, 0.2)));
    // torso: broad shoulders, narrow hips (triangle = sharp shape language)
    g.roundShape([{ x: -3.5, y: 0 }, { x: 3.5, y: 0 }, { x: 8, y: -12 }, { x: -7, y: -12.5 }], 2.2).fill(C(HOT.main));
    g.poly([1, -2, 4, -2, 6.5, -11, 1, -11.5]).fill({ color: C(HOT.light), alpha: 0.65 });
    // front arm
    const pump = p.victory >= 0 ? Math.abs(Math.sin(p.victory * 8)) : 0; // victory fist pump
    const frontHand = p.victory >= 0 ? { x: 7, y: -22 - pump * 4 } : air ? { x: 9, y: p.vy < 0 ? -22 : -18 } : idleHot(p, 1) ?? { x: 4 + swing, y: -1 + Math.abs(swing) * 0.15 };
    limb(g, 5, -10.5, frontHand.x, frontHand.y, C(HOT.main), 4);
    g.circle(frontHand.x, frontHand.y, 2.8).fill(C(HOT.light));

    // Head
    this.head.position.set(2.5, -22.5);
    this.head.rotation = a ? -this.upper.rotation * 0.6 : 0;
    const h = this.headG.clear();
    // flaming mohawk, swept back; grows when excited, shrinks and sputters near water
    const flame = Math.max(0.35, 1 + p.excite * 0.55 - p.danger * 0.6) * (p.victory >= 0 ? 1.5 + pump * 0.3 : 1);
    const sputter = p.danger > 0.2 && a ? (Math.random() < p.danger * 0.25 ? 0.5 : 1) : 1;
    const layers: [number, number][] = [[HOT.main, 1], [HOT.light, 0.68], [HOT.core, 0.38]];
    for (const [col, k] of layers) {
      // spikes along the top of the head, front to back, each swept back and longer toward the back
      const pts: number[] = [Math.cos(-0.7) * 8 * k, Math.sin(-0.7) * 8 * k];
      for (let i = 0; i < 6; i++) {
        const ang = -0.9 - i * 0.34;
        const flick = a ? Math.sin(p.time * (11 + i * 3) + i * 1.7) * 0.16 + Math.sin(p.time * 23 + i) * 0.07 : 0;
        const len = (6.5 + i * 2.4) * flame * sputter * (1 + flick) * (0.45 + k * 0.55);
        const dir = ang - 0.75 - p.speed * 0.3;
        const bx = Math.cos(ang) * 9.6, by = Math.sin(ang) * 9.6;
        pts.push(bx + Math.cos(dir) * len, by + Math.sin(dir) * len);
        const v = ang - 0.2;
        pts.push(Math.cos(v) * (9.2 - (1 - k) * 2), Math.sin(v) * (9.2 - (1 - k) * 2));
      }
      pts.push(-8, 2, 0, 0);
      h.poly(pts).fill(C(col));
    }
    // head shape: slightly angular
    h.roundShape([{ x: -10, y: -6 }, { x: 0, y: -10.5 }, { x: 10.5, y: -5 }, { x: 10.5, y: 5 }, { x: 4, y: 10.5 }, { x: -6, y: 9.5 }, { x: -10.5, y: 3 }], 4.5).fill(C(HOT.light));
    h.ellipse(4, 2, 6.5, 6).fill({ color: C(HOT.core), alpha: 0.55 });
    // face: angled brows, cocky grin with a fang
    const ink = C(HOT.ink);
    if (this.blinking(p)) {
      h.moveTo(-0.5, 0).lineTo(3, 0).stroke({ width: 1.6, color: ink, cap: 'round' });
      h.moveTo(5.5, 0).lineTo(9.5, 0).stroke({ width: 1.6, color: ink, cap: 'round' });
    } else {
      h.ellipse(1.3, 0, 2, 2.6).fill(C(0xffffff));
      h.ellipse(7.3, 0, 2.3, 2.8).fill(C(0xffffff));
      const look = 0.7;
      h.circle(1.3 + look, 0.4, 1.3).fill(ink);
      h.circle(7.3 + look, 0.4, 1.45).fill(ink);
    }
    const worried = p.danger * 2.2; // brows lift when scared (but he still grins)
    h.moveTo(-2, -5.2 - worried).lineTo(3.2, -3.4).stroke({ width: 2, color: ink, cap: 'round' });
    h.moveTo(5, -3.4).lineTo(10, -5.6 - worried).stroke({ width: 2, color: ink, cap: 'round' });
    h.moveTo(1.5, 4.8).quadraticCurveTo(6, 7.5, 9.5, 3.6).stroke({ width: 1.6, color: ink, cap: 'round' });
    h.poly([6.4, 5.7, 7.8, 5.4, 7.1, 7.2]).fill(C(0xffffff)); // fang
  }

  // ------------------------------------------------------------------ Cool Girl
  private drawCool(p: Pose): void {
    const w = p.whiten;
    const C = (c: number) => mix(c, 0xffffff, w);
    const a = p.animate;
    const run = a && p.grounded && p.speed > 0.05;
    const ph = p.runPhase;
    const hipY = -14 + (a && !run ? Math.sin(p.time * 2) * 0.35 : 0); // glides: no bounce

    const back = this.back.clear();
    const body = this.body.clear();
    const legs = legPoses(p, run, ph, 8, 2, 'cool');
    drawLeg(back, -1.5, hipY, legs[1], C(mix(COOL.dark, 0x000000, 0.25)), 3.6);
    drawLeg(body, 1.5, hipY, legs[0], C(COOL.dark), 3.6);

    this.upper.position.set(0, hipY);
    this.upper.rotation = a ? p.speed * 0.06 : 0; // stands upright
    const g = this.upperG.clear();
    const swing = run ? Math.sin(ph) * 3 : 0;
    const air = !p.grounded && a;
    const crossed = (a && p.grounded && !run) || p.victory >= 0; // arms crossed while waiting
    // hair ribbon flows behind her (drawn first so it's behind the body)
    const hairCol = C(COOL.main);
    // back arm
    if (crossed) limb(g, -3.5, -10.5, 3.5, -6.5, C(mix(COOL.main, 0x000000, 0.25)), 3.2);
    else {
      const hb = air ? { x: -8, y: p.vy < 0 ? -6 : -14 } : { x: -3 - swing, y: -0.5 };
      limb(g, -3.5, -10.5, hb.x, hb.y, C(mix(COOL.main, 0x000000, 0.25)), 3.2);
      g.circle(hb.x, hb.y, 2).fill(C(mix(COOL.light, 0x000000, 0.2)));
    }
    // torso: slim, flowing hourglass
    g.roundShape([{ x: -4.8, y: 0 }, { x: 4.8, y: 0 }, { x: 2.6, y: -6.5 }, { x: 4, y: -12 }, { x: -4, y: -12 }, { x: -2.6, y: -6.5 }], 2).fill(C(COOL.main));
    g.poly([0.5, -1, 3.5, -1, 1.8, -6.5, 3, -11, 0.5, -11]).fill({ color: C(COOL.light), alpha: 0.55 });
    // front arm
    if (crossed) {
      limb(g, 3.8, -10.5, -3, -7.2, C(COOL.main), 3.2);
      g.circle(-3, -7.2, 2).fill(C(COOL.light));
    } else {
      const hf = air ? { x: 8, y: p.vy < 0 ? -6 : -15 } : { x: 3 + swing, y: -0.5 };
      limb(g, 3.8, -10.5, hf.x, hf.y, C(COOL.main), 3.2);
      g.circle(hf.x, hf.y, 2.1).fill(C(COOL.light));
    }

    this.head.position.set(0.5, -23.5);
    this.head.rotation = a ? Math.sin(p.time * 1.3) * 0.03 : 0;
    const h = this.headG.clear();
    // long water hair, flowing like a ribbon behind her
    const flow = a ? 1 + p.speed * 0.8 : 1;
    // angle away from "hanging straight down": more when running, up when falling
    const flip = p.victory >= 0 ? Math.sin(Math.min(1, p.victory / 0.45) * Math.PI) * 1.3 : 0; // hair flip
    const ang = 0.35 + flip + (a ? p.speed * 0.95 + (p.grounded ? 0 : p.vy > 0 ? Math.min(1.4, p.vy / 9) : Math.max(-0.3, p.vy / 40)) : 0);
    const N = 9;
    const top: number[] = [];
    const bot: number[] = [];
    let hx = -7.5, hy = -3;
    for (let k = 0; k <= N; k++) {
      const u = k / N;
      const wave = a ? Math.sin(p.time * 5.5 - k * 0.8) * (0.05 + p.speed * 0.12) : 0;
      const dir = Math.min(2.6, ang + wave + u * 0.15 * flow);
      const thick = 7 * (1 - u * 0.85);
      const nx = Math.cos(dir), ny = -Math.sin(dir); // normal to the strand
      top.push(hx + nx * thick / 2, hy + ny * thick / 2);
      bot.unshift(hx - nx * thick / 2, hy - ny * thick / 2);
      hx -= Math.sin(dir) * 2.7;
      hy += Math.cos(dir) * 2.7;
    }
    if (this.trailHair) h.poly([4, -10, -3, -11, -10, -4, -9.5, 5, -10.5, -1]).fill(hairCol); // root only
    else h.poly([4, -10, -3, -11, ...top, ...bot, -9, 4, -10.5, -1]).fill(hairCol);
    h.circle(0, 0, 10.2).fill(C(COOL.light)); // head
    h.ellipse(3, 1.5, 6.5, 6.5).fill({ color: C(COOL.core), alpha: 0.5 });
    // hair cap swept over one eye
    h.poly([-10.5, 2, -10, -5, -5, -10, 3, -11, 9, -7.5, 10.5, -3, 6, -4.5, 2.5, -3, 0.5, 2.5, -2.5, 6, -6, 7]).fill(hairCol);
    h.moveTo(-7, -7).quadraticCurveTo(0, -11, 7, -7.5).stroke({ width: 1.2, color: C(COOL.core), alpha: 0.8, cap: 'round' });
    // face: one visible eye, half-closed and confident; raised brow; smirk
    const ink = C(COOL.ink);
    const shock = Math.min(1, p.danger * 1.6); // the only time she loses her cool
    if (this.blinking(p)) {
      h.moveTo(4.3, 0.8).lineTo(8.6, 0.6).stroke({ width: 1.4, color: ink, cap: 'round' });
    } else {
      h.ellipse(6.4, 0.6, 2.2, 2.4 + shock).fill(C(0xffffff));
      h.circle(7.1, 1, 1.25).fill(ink);
      const lid = (1 - shock) * 1.5; // heavy lid = half-closed eyes
      if (lid > 0.1) h.rect(4, -2.2 - shock, 4.8, lid + 0.6).fill(C(COOL.light));
      h.moveTo(4, -0.9 + (1 - shock) * 0.6 - shock * 1.5).lineTo(8.8, -1.1 + (1 - shock) * 0.6 - shock * 1.5).stroke({ width: 1.3, color: ink, cap: 'round' });
    }
    h.moveTo(4, -4.8 - shock).quadraticCurveTo(6.8, -7.2 - shock, 9.2, -5).stroke({ width: 1.5, color: ink, cap: 'round' }); // raised brow
    if (shock > 0.5) h.ellipse(6, 5.2, 1.3, 1.6).fill(ink); // "oh no"
    else h.moveTo(3.5, 5.4).quadraticCurveTo(6.5, 6.4, 8.8, 4.2).stroke({ width: 1.4, color: ink, cap: 'round' }); // smirk
    // sunglasses: resting on her head, they drop onto her face when the level is done 😎
    const k = p.victory >= 0 ? easeOutBack(Math.min(1, Math.max(0, (p.victory - 0.3) / 0.25))) : 0;
    const gx1 = -3 + 2.6 * k, gy1 = -12.5 + 11 * k, gx2 = 3 + 1.4 * k, gy2 = -12 + 10.6 * k;
    h.roundRect(gx1, gy1, 5.2, 3, 1.3).fill(C(SHADES));
    h.roundRect(gx2, gy2, 5.2, 3, 1.3).fill(C(SHADES));
    h.moveTo(gx1 + 5.2, gy1 + 0.8).lineTo(gx2, gy2 + 1).stroke({ width: 1, color: C(SHADES) });
    h.moveTo(gx1 + 1.2, gy1 + 0.5).lineTo(gx1 + 3, gy1 + 1.5).stroke({ width: 0.8, color: C(COOL.core), alpha: 0.9 });
  }
}

function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

// ------------------------------------------------------------------ shared limb helpers
type Foot = { x: number; y: number; knee: number };

function legPoses(p: Pose, run: boolean, ph: number, stride: number, liftAmt: number, who: 'hot' | 'cool'): [Foot, Foot] {
  if (!p.animate) return [{ x: 3, y: 0, knee: 1 }, { x: -3, y: 0, knee: 1 }];
  if (!p.grounded) {
    if (p.vy < 0) return who === 'hot' ? [{ x: 5, y: -6, knee: 4 }, { x: -3, y: -3, knee: 3 }] : [{ x: 3, y: -4, knee: 3 }, { x: -2, y: -1, knee: 2 }];
    return [{ x: 4, y: 0, knee: 1.5 }, { x: -3, y: -1, knee: 2 }];
  }
  if (run) {
    const f = (o: number): Foot => {
      const s = Math.sin(ph + o);
      const c = Math.cos(ph + o);
      return { x: s * stride, y: -Math.max(0, c) * liftAmt, knee: 2 + Math.max(0, c) * 3 };
    };
    return [f(0), f(Math.PI)];
  }
  // standing; Hot Boy taps his foot when waiting
  const tap = who === 'hot' && p.idle > 1.5 ? Math.max(0, Math.sin(p.time * 9)) * 2 : 0;
  return [{ x: 3.5, y: -tap, knee: 1 }, { x: -3, y: 0, knee: 1 }];
}

function drawLeg(g: Graphics, hipX: number, hipY: number, f: Foot, color: number, width: number): void {
  const kx = (hipX + f.x) / 2 + f.knee;
  const ky = (hipY + f.y) / 2;
  g.moveTo(hipX, hipY).lineTo(kx, ky).lineTo(f.x, f.y - 1).stroke({ width, color, cap: 'round', join: 'round' });
  g.roundRect(f.x - 2.5, f.y - 2.6, 6, 2.8, 1.4).fill(color); // foot
}

function limb(g: Graphics, x0: number, y0: number, x1: number, y1: number, color: number, width: number): void {
  const mx = (x0 + x1) / 2 - 1.2;
  const my = (y0 + y1) / 2 + 1;
  g.moveTo(x0, y0).quadraticCurveTo(mx, my, x1, y1).stroke({ width, color, cap: 'round' });
}

/** Hot Boy's waiting gesture: a punch at the air every couple of seconds. */
function idleHot(p: Pose, side: -1 | 1): { x: number; y: number } | null {
  if (!p.animate || !p.grounded || p.speed > 0.05 || p.idle < 2.5) return null;
  const cycle = (p.idle - 2.5) % 2.2;
  if (side === 1 && cycle < 0.35) {
    const k = Math.sin((cycle / 0.35) * Math.PI);
    return { x: 5 + k * 6, y: -9 - k * 9 };
  }
  return side === 1 ? { x: 6, y: -3 } : { x: -6, y: -3 }; // fists on hips
}
