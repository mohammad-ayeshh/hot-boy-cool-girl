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
  /** 0..1 how strong his ignite flare is right now (Hot Boy's tap on the main screen, or a double tap on him in a level; see igniteFlare) */
  ignite?: number;
  /** seconds since her hair flip during a level (a double tap on her, 14.4), or -1: the sunglasses drop, then go back up */
  flip?: number;
}

/** How long Hot Boy's ignite lasts, in seconds. */
export const IGNITE_S = 2;

/** How long her hair flip during a level lasts (the sunglasses drop and go back up), in seconds: as long as his ignite. */
export const FLIP_S = IGNITE_S;

/** The ignite flare's strength t seconds after the tap: a fast whoosh up, a blaze, then it settles. */
export function igniteFlare(t: number): number {
  if (t < 0 || t >= IGNITE_S) return 0;
  if (t < 0.15) return 1 - (1 - t / 0.15) ** 2;
  if (t < 1.1) return 1;
  const u = (t - 1.1) / (IGNITE_S - 1.1);
  return 1 - u * u * (3 - 2 * u);
}

/** His stiff crown of flame spikes, around the top of his head (head space). Every odd point is a spike's tip. */
const CROWN = [-10, -1, -18, -5, -11, -9, -16, -17, -7, -12.5, -7, -22, -1, -13.5, 3, -22, 4.5, -12, 12, -17, 9.5, -7.5, 16, -7, 10, -1];
const CROWN_IN = [-8, -5, -12, -14, -5, -11, -3, -17, 0, -11, 5, -16, 5, -9, 9, -7];
const BAND = 0x7a1d08;

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
    const ign = a ? p.ignite ?? 0 : 0;
    const ignPump = ign > 0.05 && p.grounded && !run; // standing still he pumps his fist; walking or jumping only the flame shows
    const pump = p.victory >= 0 ? Math.abs(Math.sin(p.victory * 8)) : ignPump ? Math.abs(Math.sin(p.time * 9)) * ign : 0; // fist pump
    const frontHand = p.victory >= 0 ? { x: 7, y: -22 - pump * 4 } : ignPump ? { x: 16.5, y: -19 - pump * 3 } : air ? { x: 9, y: p.vy < 0 ? -22 : -18 } : idleHot(p, 1) ?? { x: 4 + swing, y: -1 + Math.abs(swing) * 0.15 };
    limb(g, 5, -10.5, frontHand.x, frontHand.y, C(HOT.main), 4);
    g.circle(frontHand.x, frontHand.y, 2.8).fill(C(HOT.light));

    // Head
    this.head.position.set(2.5, -22.5);
    this.head.rotation = a ? -this.upper.rotation * 0.6 : 0;
    const h = this.headG.clear();
    // the ignite flare: a tall flame shooting up from the top of his head, behind the crown
    if (ign > 0) {
      const fl = a ? Math.sin(p.time * 17) * 0.08 + Math.sin(p.time * 29) * 0.05 : 0;
      const sway = a ? Math.sin(p.time * 9) * 2 * ign : 0;
      for (const [col, k] of [[HOT.main, 1], [HOT.light, 0.66], [HOT.core, 0.33]] as [number, number][]) {
        const ht = (34 * k + 6) * ign * (1 + fl), w = (8 * k + 1.5) * Math.min(1, ign * 1.5);
        h.moveTo(-w - 1, -6).bezierCurveTo(-w - 2, -6 - ht * 0.45, -2 + sway, -6 - ht * 0.7, -3 + sway, -6 - ht)
          .bezierCurveTo(1 + sway, -6 - ht * 0.65, w + 2, -6 - ht * 0.4, w, -6).closePath().fill(C(col));
      }
    }
    // stiff crown of flame spikes: it doesn't trail, but it flickers, grows when he's excited and shrinks and sputters near water
    const flame = Math.max(0.35, 1 + p.excite * 0.25 - p.danger * 0.6) * (p.victory >= 0 ? 1.3 + pump * 0.15 : 1) * (1 + ign * 0.12);
    const sputter = p.danger > 0.2 && a ? (Math.random() < p.danger * 0.25 ? 0.6 : 1) : 1;
    const crown = (pts: number[]) => pts.map((v, i) => {
      const k = i >> 1, tip = k % 2 === 1;
      const flick = a && tip ? 1 + Math.sin(p.time * (11 + k * 2.3) + k * 1.7) * 0.06 + Math.sin(p.time * 23 + k) * 0.03 : 1;
      return i % 2 === 0 ? v * flame * sputter * flick : -4 + (v + 4) * flame * sputter * flick; // grows from the head's middle
    });
    h.poly(crown(CROWN)).fill(C(HOT.main));
    h.poly(crown(CROWN_IN)).fill(C(HOT.light));
    // head shape: slightly angular
    h.roundShape([{ x: -10, y: -6 }, { x: 0, y: -10.5 }, { x: 10.5, y: -5 }, { x: 10.5, y: 5 }, { x: 4, y: 10.5 }, { x: -6, y: 9.5 }, { x: -10.5, y: 3 }], 4.5).fill(C(HOT.light));
    h.ellipse(4, 2, 6.5, 6).fill({ color: C(HOT.core), alpha: 0.55 });
    // the headband: his signature item. Its long tails are drawn by the stage as trailing chains (render/hair.ts);
    // without them, two short stiff tails stick out of the knot.
    if (!this.trailHair) h.poly([-10, -3, -21, -8, -19, -3.5]).poly([-10, -2, -20, 1.5, -15.5, 2.5]).fill(C(BAND));
    h.poly([-10, -3, -13, -5, -12.5, -2]).fill(C(BAND)); // the knot
    h.moveTo(-11.5, -5.5).quadraticCurveTo(0, -10, 12, -5).lineTo(12, -2).quadraticCurveTo(0, -7, -11.5, -2.5).closePath().fill(C(BAND));
    // face, moved down a little to sit under the headband: angled brows, cocky grin (no fang since the 2026-11-21 redesign)
    h.save().translateTransform(-0.5, 2);
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
    h.restore();
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
    const hips = (a && p.grounded && !run) || p.victory >= 0; // hands on hips while waiting
    // hair ribbon flows behind her (drawn first so it's behind the body)
    const hairCol = C(COOL.main);
    // back arm
    if (hips) hipsBack(g, C);
    else {
      const hb = air ? { x: -8, y: p.vy < 0 ? -6 : -14 } : { x: -3 - swing, y: -0.5 };
      limb(g, -3.5, -10.5, hb.x, hb.y, C(mix(COOL.main, 0x000000, 0.25)), 3.2);
      g.circle(hb.x, hb.y, 2).fill(C(mix(COOL.light, 0x000000, 0.2)));
    }
    // torso: slim, flowing hourglass
    g.roundShape([{ x: -4.8, y: 0 }, { x: 4.8, y: 0 }, { x: 2.6, y: -6.5 }, { x: 4, y: -12 }, { x: -4, y: -12 }, { x: -2.6, y: -6.5 }], 2).fill(C(COOL.main));
    g.poly([0.5, -1, 3.5, -1, 1.8, -6.5, 3, -11, 0.5, -11]).fill({ color: C(COOL.light), alpha: 0.55 });
    // front arm
    if (hips) hipsFront(g, C);
    else {
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
    const fv = p.victory >= 0 ? p.victory : a ? p.flip ?? -1 : -1; // the level's end, or a double tap on her (14.4)
    const flip = fv >= 0 ? Math.sin(Math.min(1, fv / 0.45) * Math.PI) * 1.3 : 0; // hair flip
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
    // (and for a moment after a double tap on her during the level: they go back up at the end)
    const up = p.victory < 0 && fv >= 0 ? smooth((fv - (FLIP_S - 0.35)) / 0.35) : 0;
    const k = fv >= 0 ? easeOutBack(Math.min(1, Math.max(0, (fv - 0.3) / 0.25))) * (1 - up) : 0;
    // Seen from the side: only the near lens shows (the far one is behind her face), with its arm running back to her ear.
    const lerp = (a: number, b: number) => a + (b - a) * k;
    const cx = lerp(3.6, 6.6), cy = lerp(-10.3, 0.4); // lens middle: up on her head → over her eye
    const rot = lerp(-0.5, 0); // tilted to follow the top of her head
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const at = (x: number, y: number) => ({ x: cx + x * cos - y * sin, y: cy + x * sin + y * cos });
    const ear = { x: lerp(-5, -3), y: lerp(-8.6, -1.2) };
    const hinge = at(-2.6, -0.9);
    h.moveTo(hinge.x, hinge.y).lineTo(ear.x, ear.y).stroke({ width: 1.1, color: C(SHADES), cap: 'round' }); // the arm
    h.roundShape([at(-2.9, -1.6), at(3.1, -1.6), at(2.7, 1.1), at(0.6, 1.9), at(-2.4, 1.4)], 1).fill(C(SHADES)); // the lens
    const b0 = at(3, -1.1), b1 = at(4, -0.6);
    h.moveTo(b0.x, b0.y).lineTo(b1.x, b1.y).stroke({ width: 1, color: C(SHADES), cap: 'round' }); // the bridge, toward her nose
    const s0 = at(-1.6, -0.9), s1 = at(0.2, 0.4);
    h.moveTo(s0.x, s0.y).lineTo(s1.x, s1.y).stroke({ width: 0.8, color: C(COOL.core), alpha: 0.9, cap: 'round' }); // shine
  }
}

// ------------------------------------------------------------------ Cool Girl's waiting pose: hands on hips
const ARM = mix(COOL.main, COOL.light, 0.45); // lighter than her dress, so the arms read against it
const ARM_BACK = mix(COOL.main, 0x000000, 0.2);
const line = (g: Graphics, pts: number[], color: number, width: number, alpha = 1) => {
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
};

/** The back arm, behind her body (drawn before the torso): elbow out behind her, hand on her hip. */
function hipsBack(g: Graphics, C: (c: number) => number): void {
  line(g, [-3.5, -10.5, -8, -6.5, -4, -2.2], C(ARM_BACK), 3.2);
  g.circle(-4, -2.2, 1.9).fill(C(ARM_BACK));
}

/** The front arm, with a thin dark edge: elbow out in front, hand on her hip. */
function hipsFront(g: Graphics, C: (c: number) => number): void {
  const pts = [3.8, -10.5, 8.6, -6.6, 4.2, -2.2];
  line(g, pts, C(COOL.ink), 4.6, 0.55);
  line(g, pts, C(ARM), 3.2);
  g.circle(4.2, -2.2, 1.9).fill(C(COOL.light));
}

function smooth(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
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
