// Shared mechanisms (design doc 10.1, 10.2): pressure buttons, levers, moving platforms, gates.
// Linked things share a gold rune: a button or lever "powers" every platform and gate with its rune.
// Pure logic, no drawing. Both phones run it; the host's phone sends corrections (13.1, 13.2).
// Coordinates in tiles. Buttons and levers sit on the floor at the bottom of their cell (y + 1).
import type { Elem, Rect } from './level';

export type Rune = 'circle' | 'triangle' | 'square' | 'star';

/** Password gates (16.7, G5): the 8 temple animals carved on symbol stones and wall carvings. */
export const ANIMALS = ['snake', 'monkey', 'jaguar', 'frog', 'bird', 'fish', 'bat', 'turtle'] as const;
export type Animal = (typeof ANIMALS)[number];

/**
 * A level's password (16.7): stepping on symbol stones in this order turns `rune` on, and it stays on
 * (like a lever). Official chapters fill `code` from the team's random code (G3); homemade levels fix it (G14).
 */
export interface Pattern { code: Animal[]; rune: Rune }

/** `seen`: only this player sees it (Different eyes, 16.7); it still works for both. */
export type MechDef = (
  | { kind: 'button'; x: number; y: number; rune: Rune }
  | { kind: 'lever'; x: number; y: number; rune: Rune }
  /** top-left at (x, y), w tiles wide, half a tile thick; travels to `to` while powered */
  | { kind: 'platform'; x: number; y: number; w: number; to: [number, number]; rune: Rune }
  /** fills w × h tiles while closed; slides up into the ceiling while powered */
  | { kind: 'gate'; x: number; y: number; w: number; h: number; rune: Rune }
  /** a symbol stone on the floor (G2): stepping onto it enters its animal */
  | { kind: 'stone'; x: number; y: number; animal: Animal }
  /** an animal carved into the back wall (G9), with 1–4 dots for its place in the code (G6). Only decoration. */
  | { kind: 'carving'; x: number; y: number; animal: Animal; dots: number }
  /**
   * Crumbling stones (16.7, K1–K6): a row of `w` one-tile blocks starting at cell (x, y). Each block shakes when
   * someone stands on it, falls away, and grows back a few seconds later. No rune: nothing powers them.
   */
  | { kind: 'crumble'; x: number; y: number; w: number }
  /**
   * A timed switch (16.7, S1–S6): on while someone stands on it, and for `secs` more seconds after they step off.
   * It powers its rune like a button.
   */
  | { kind: 'timer'; x: number; y: number; rune: Rune; secs: number }
) & { seen?: Elem };

type ButtonDef = Extract<MechDef, { kind: 'button' }>;
type LeverDef = Extract<MechDef, { kind: 'lever' }>;
type PlatformDef = Extract<MechDef, { kind: 'platform' }>;
type GateDef = Extract<MechDef, { kind: 'gate' }>;
type StoneDef = Extract<MechDef, { kind: 'stone' }>;
type CarvingDef = Extract<MechDef, { kind: 'carving' }>;
type CrumbleDef = Extract<MechDef, { kind: 'crumble' }>;
type TimerDef = Extract<MechDef, { kind: 'timer' }>;

export interface ButtonState { def: ButtonDef; pressed: boolean; sink: number }
/** `on` here: the characters (by key) standing on it right now, so standing still doesn't flip it again. */
export interface LeverState { def: LeverDef; on: boolean; angle: number; holdUntil: number; standing: Set<string> }
export interface PlatformState { def: PlatformDef; p: number; rect: Rect; dx: number; dy: number; moving: boolean }
export interface GateState { def: GateDef; open: number; rect: Rect; moving: boolean }
/** `on`: which characters stand on it now (a stone counts when someone steps onto it); `flash`: a wrong step. */
export interface StoneState { def: StoneDef; on: Set<string>; sink: number; flash: number }
/** `near`: 0..1 how close the nearest player is; `lit`: someone is close enough to light it (drawing only). */
export interface CarvingState { def: CarvingDef; near: number; lit: boolean }
/**
 * Progress on the level's pattern. `entered`: stones stepped on correctly so far (they stay sunk).
 * `resets` counts wrong steps, so the guest can tell a reset happened from the host's state.
 */
export interface VaultState { pattern: Pattern; entered: number[]; solved: boolean; resets: number; holdUntil: number }

/**
 * One crumbling block (16.7, K1–K6). `t`: seconds since someone first stood on it, or -1 while it is whole.
 * 0 … CRUMBLE_SHAKE: shaking (still solid); after that it is gone, until CRUMBLE_SHAKE + CRUMBLE_BACK has passed
 * and nobody is in its space. `x`, `y`: its cell; `rect` is its solid part (no height while gone).
 */
export interface CrumbleState { def: CrumbleDef; x: number; y: number; t: number; rect: Rect; holdUntil: number }

/**
 * A timed switch (16.7, S1–S6). `pressed`: someone stands on it now; `left`: seconds it stays on after that
 * (full while pressed, 0 = off); `on`: it was powering its rune at the last update (to notice it running out).
 */
export interface TimerState { def: TimerDef; pressed: boolean; left: number; sink: number; on: boolean }

/**
 * The rising tide (16.7, V1–V6): violet poison that fills the level from the bottom. `from`: where its surface
 * rests before anyone moves (y in tiles); `to`: the highest it climbs (a smaller y); `speed`: tiles per second.
 */
export interface Tide { from: number; to: number; speed: number }
/** `y`: the surface now; `running`: someone has moved, so it is rising (or has reached `to`). */
export interface TideState { def: Tide; y: number; running: boolean }
/** The tide kills only when the feet are clearly under its surface (7.4): this many tiles. */
export const TIDE_DEPTH = 0.3;

/** What the host sends 5× a second (and right after a stone is stepped on) to keep the guest's world in sync. */
export interface MechSync { lv?: number[]; pl?: number[]; pw?: { en: number[]; ok: 0 | 1; rs: number }; cr?: number[]; tm?: number[]; td?: [0 | 1, number] }

/** What a mechanism needs to know about a character. */
export interface Feet { left: number; right: number; y: number; vx: number; grounded: boolean }
/** A character's whole body, for "is someone in this space?" */
export interface Box { left: number; right: number; top: number; y: number }

/** Crumbling stones (K2, K3): how long a block shakes before it falls, and how long it stays away. Seconds. */
export const CRUMBLE_SHAKE = 0.7;
export const CRUMBLE_BACK = 5;

/** A carving lights up when a character's middle is this close (tiles), and goes dark again past CARVING_DARK (G9). */
export const CARVING_LIGHT = 2.6;
export const CARVING_DARK = 3.6;
/** Distance from a character (middle x, feet y) to a carving's middle. */
export function carvingDistance(d: { x: number; y: number }, x: number, feetY: number): number {
  return Math.hypot(x - (d.x + 0.5), feetY - 0.75 - (d.y + 0.5));
}

export const PLATFORM_THICK = 0.5;
const PLATFORM_SPEED = 3; // tiles/s
const GATE_SPEED = 2.2; // full opens per second

export type MechEvent =
  | { k: 'button'; i: number; down: boolean }
  | { k: 'lever'; i: number; on: boolean; local: boolean }
  | { k: 'platform'; i: number; start: boolean }
  | { k: 'gate'; i: number; opening: boolean }
  /** a symbol stone was stepped on: `ok` = the right one (`n` = how many are entered now); wrong = everything reset. i = -1: unknown stone */
  | { k: 'stone'; i: number; ok: boolean; n: number; local: boolean }
  /** the whole pattern was entered: its rune is on for good */
  | { k: 'solved' }
  /** crumbling block `i` started to shake (`local`: under a character simulated on this phone), fell, or grew back */
  | { k: 'crumble'; i: number; what: 'shake' | 'fall' | 'back'; local: boolean }
  /** timed switch `i` was stepped on, stepped off (its clock starts), ticked (`left` seconds to go) or ran out */
  | { k: 'timer'; i: number; what: 'down' | 'up' | 'tick' | 'out'; left: number }
  /** the tide started to rise */
  | { k: 'tide' };

export class Mechanisms {
  buttons: ButtonState[] = [];
  levers: LeverState[] = [];
  platforms: PlatformState[] = [];
  gates: GateState[] = [];
  stones: StoneState[] = [];
  carvings: CarvingState[] = [];
  /** Crumbling stones, one entry per block (a def `w` wide gives `w` of them). */
  crumbles: CrumbleState[] = [];
  timers: TimerState[] = [];
  /**
   * The route robot's lag test (16.7, S5): every timed switch runs this many seconds short. A timed level must
   * still be winnable like that, so two phones that disagree a little about a clock both leave room to spare.
   */
  timerCut = 0;
  /** The level's rising tide, if it has one. */
  tide: TideState | null = null;
  /** The route robot's spare-time test (16.7, V5): the tide rises this many times faster. */
  tideRush = 1;
  /** The level's password, if it has one. */
  vault: VaultState | null = null;
  /** Solid rectangles for collision (platforms + closed part of gates); updated in place. */
  readonly solids: Rect[] = [];
  private readonly defs: MechDef[];
  private readonly pattern: Pattern | undefined;
  private readonly tideDef: Tide | undefined;

  constructor(defs: MechDef[], pattern?: Pattern, tide?: Tide) {
    this.defs = defs;
    this.pattern = pattern;
    this.tideDef = tide;
    this.reset();
  }

  reset(): void {
    this.buttons = [];
    this.levers = [];
    this.platforms = [];
    this.gates = [];
    this.stones = [];
    this.carvings = [];
    this.crumbles = [];
    this.timers = [];
    this.resetTide();
    this.vault = this.pattern ? { pattern: this.pattern, entered: [], solved: false, resets: 0, holdUntil: 0 } : null;
    this.solids.length = 0;
    for (const d of this.defs) {
      if (d.kind === 'button') this.buttons.push({ def: d, pressed: false, sink: 0 });
      else if (d.kind === 'lever') this.levers.push({ def: d, on: false, angle: -1, holdUntil: 0, standing: new Set() });
      else if (d.kind === 'platform') {
        const rect = { x0: d.x, y0: d.y, x1: d.x + d.w, y1: d.y + PLATFORM_THICK };
        this.platforms.push({ def: d, p: 0, rect, dx: 0, dy: 0, moving: false });
        this.solids.push(rect);
      } else if (d.kind === 'stone') this.stones.push({ def: d, on: new Set(), sink: 0, flash: 0 });
      else if (d.kind === 'carving') this.carvings.push({ def: d, near: 0, lit: false });
      else if (d.kind === 'timer') this.timers.push({ def: d, pressed: false, left: 0, sink: 0, on: false });
      else if (d.kind === 'crumble') {
        for (let k = 0; k < d.w; k++) {
          const rect = { x0: d.x + k, y0: d.y, x1: d.x + k + 1, y1: d.y + 1 };
          this.crumbles.push({ def: d, x: d.x + k, y: d.y, t: -1, rect, holdUntil: 0 });
          this.solids.push(rect);
        }
      } else {
        const rect = { x0: d.x, y0: d.y, x1: d.x + d.w, y1: d.y + d.h };
        this.gates.push({ def: d, open: 0, rect, moving: false });
        this.solids.push(rect);
      }
    }
  }

  powered(rune: Rune): boolean {
    return (
      this.buttons.some((b) => b.pressed && b.def.rune === rune) ||
      this.levers.some((l) => l.on && l.def.rune === rune) ||
      this.timers.some((t) => (t.pressed || t.left > 0) && t.def.rune === rune) ||
      (!!this.vault?.solved && this.vault.pattern.rune === rune)
    );
  }

  /** Index of the platform someone is standing on, or -1. */
  platformUnder(f: Feet): number {
    if (!f.grounded) return -1;
    return this.platforms.findIndex((p) => Math.abs(f.y - p.rect.y0) < 0.06 && f.right > p.rect.x0 && f.left < p.rect.x1);
  }

  /** Buttons: pressed while anyone stands on them. */
  updateButtons(all: Feet[], events: MechEvent[]): void {
    this.buttons.forEach((b, i) => {
      const { x, y } = b.def;
      const down = all.some((f) => f.grounded && Math.abs(f.y - (y + 1)) < 0.08 && f.right > x + 0.15 && f.left < x + 0.85);
      if (down !== b.pressed) events.push({ k: 'button', i, down });
      b.pressed = down;
    });
    // Timed switches: pressed like a button; the clock is full while someone stands there and starts on the step-off.
    this.timers.forEach((t, i) => {
      const { x, y } = t.def;
      const down = all.some((f) => f.grounded && Math.abs(f.y - (y + 1)) < 0.08 && f.right > x + 0.15 && f.left < x + 0.85);
      if (down) t.left = this.timerSecs(t);
      if (down !== t.pressed) events.push({ k: 'timer', i, what: down ? 'down' : 'up', left: t.left });
      t.pressed = down;
    });
  }

  /** The tide goes back to where it rests (a restart; the Feel Lab after it caught someone). */
  resetTide(): void {
    this.tide = this.tideDef ? { def: this.tideDef, y: this.tideDef.from, running: false } : null;
  }

  /** Someone moved: the tide starts to rise (V2). Returns whether it just started. */
  startTide(events: MechEvent[]): boolean {
    const t = this.tide;
    if (!t || t.running) return false;
    t.running = true;
    events.push({ k: 'tide' });
    return true;
  }

  /** Are feet at `feetY` clearly under the tide (V4)? */
  tideCovers(feetY: number): boolean {
    return !!this.tide && feetY > this.tide.y + TIDE_DEPTH;
  }

  /** How long timed switch `t` stays on after the step-off (shortened by the robot's lag test). */
  timerSecs(t: TimerState): number {
    return Math.max(0, t.def.secs - this.timerCut);
  }

  /**
   * A rune that is on only because a timed switch is running out: how much of its time is left, 0..1 (the draining
   * ring on the things it powers, S3). null: the rune is off, or something else holds it on (a button, a lever, a
   * solved password, a timed switch someone still stands on).
   */
  runeClock(rune: Rune): number | null {
    if (this.buttons.some((b) => b.pressed && b.def.rune === rune) || this.levers.some((l) => l.on && l.def.rune === rune) ||
      (!!this.vault?.solved && this.vault.pattern.rune === rune)) return null;
    let best: number | null = null;
    for (const t of this.timers) {
      if (t.def.rune !== rune) continue;
      if (t.pressed) return null;
      if (t.left > 0) best = Math.max(best ?? 0, t.left / (this.timerSecs(t) || 1));
    }
    return best;
  }

  /**
   * Levers: stepping onto one flips it, whichever way you come from (owner's rule, 2026-11-10). Standing on it
   * doesn't flip it again: step off and back on for that. Only characters simulated on this phone flip them.
   */
  updateLevers(local: { key: string; feet: Feet }[], now: number, events: MechEvent[]): void {
    this.levers.forEach((l, i) => {
      const { x, y } = l.def;
      for (const { key, feet: f } of local) {
        const on = f.grounded && Math.abs(f.y - (y + 1)) < 0.08 && f.right > x + 0.25 && f.left < x + 0.75;
        if (on === l.standing.has(key)) continue;
        if (!on) { l.standing.delete(key); continue; }
        l.standing.add(key);
        l.on = !l.on;
        l.holdUntil = now + 700; // ignore older host corrections for a moment
        events.push({ k: 'lever', i, on: l.on, local: true });
      }
    });
  }

  /**
   * Symbol stones: a stone counts when a character steps onto it (only characters simulated on this phone;
   * the partner's steps arrive over the network). To enter the same animal twice, step off and on again (G11).
   */
  updateStones(local: { key: string; feet: Feet }[], now: number, events: MechEvent[]): void {
    this.stones.forEach((s, i) => {
      const { x, y } = s.def;
      for (const { key, feet: f } of local) {
        const on = f.grounded && Math.abs(f.y - (y + 1)) < 0.08 && f.right > x + 0.2 && f.left < x + 0.8;
        if (on === s.on.has(key)) continue;
        if (!on) { s.on.delete(key); continue; }
        s.on.add(key);
        this.pressStone(i, events, true, now);
      }
    });
  }

  /**
   * Someone stepped onto stone `i`. The right animal sinks and stays down; the last one solves the pattern.
   * A wrong one resets every stone (G7). `local`: stepped on this phone (the guest then trusts itself for a moment).
   */
  pressStone(i: number, events: MechEvent[], local = false, now = 0): void {
    const v = this.vault, s = this.stones[i];
    if (!s) return;
    if (local && v) v.holdUntil = now + 700;
    if (!v || v.solved) {
      // the pattern is already done (or the level has none): the stone just answers the step
      events.push({ k: 'stone', i, ok: true, n: v ? v.entered.length : 0, local });
      return;
    }
    if (s.def.animal === v.pattern.code[v.entered.length]) {
      v.entered.push(i);
      events.push({ k: 'stone', i, ok: true, n: v.entered.length, local });
      if (v.entered.length >= v.pattern.code.length) {
        v.solved = true;
        events.push({ k: 'solved' });
      }
    } else {
      v.entered = [];
      v.resets++;
      s.flash = 1;
      events.push({ k: 'stone', i, ok: false, n: 0, local });
    }
  }

  /** Is crumbling block `i` gone right now (fallen, not back yet)? */
  crumbleGone(i: number): boolean {
    return this.crumbles[i].t >= CRUMBLE_SHAKE;
  }

  /** Block `i` starts to shake, if it is whole. Returns whether it did. */
  shakeCrumble(i: number, events: MechEvent[], local = false, now = 0): boolean {
    const c = this.crumbles[i];
    if (!c || c.t >= 0) return false;
    c.t = 0;
    if (local) c.holdUntil = now + 700; // ignore older host corrections for a moment
    events.push({ k: 'crumble', i, what: 'shake', local });
    return true;
  }

  /**
   * Crumbling stones (16.7, K1–K6). A block starts to shake when a character simulated on this phone stands on it
   * (the partner's steps arrive over the network); it shakes for CRUMBLE_SHAKE, falls away, and grows back
   * CRUMBLE_BACK later, but never while anyone (`all`: both characters as this phone shows them) is in its space.
   */
  updateCrumbles(local: Feet[], all: Box[], dt: number, now: number, events: MechEvent[]): void {
    this.crumbles.forEach((c, i) => {
      if (c.t < 0) {
        if (local.some((f) => f.grounded && Math.abs(f.y - c.y) < 0.08 && f.right > c.x + 0.1 && f.left < c.x + 0.9)) this.shakeCrumble(i, events, true, now);
        return;
      }
      const was = c.t;
      c.t += dt;
      if (was < CRUMBLE_SHAKE && c.t >= CRUMBLE_SHAKE) {
        c.rect.y1 = c.rect.y0; // no height: it blocks nothing (like an open gate)
        events.push({ k: 'crumble', i, what: 'fall', local: false });
      } else if (c.t >= CRUMBLE_SHAKE + CRUMBLE_BACK && !all.some((b) => b.right > c.x && b.left < c.x + 1 && b.y > c.y && b.top < c.y + 1)) {
        this.restoreCrumble(i, events);
      }
    });
  }

  private restoreCrumble(i: number, events: MechEvent[]): void {
    const c = this.crumbles[i];
    c.t = -1;
    c.rect.y1 = c.y + 1;
    events.push({ k: 'crumble', i, what: 'back', local: false });
  }

  /** Is stone `i` sunk as part of what's entered so far? */
  stoneDown(i: number): boolean {
    return !!this.vault?.entered.includes(i);
  }

  /**
   * Move platforms and gates toward their powered / unpowered positions.
   * `closing(rect, i)` is told the solid part of every gate that is closing: whoever is under it gets crushed.
   */
  update(dt: number, closing: (r: Rect, i: number) => void, events: MechEvent[]): void {
    const tide = this.tide;
    if (tide?.running) tide.y = Math.max(tide.def.to, tide.y - tide.def.speed * this.tideRush * dt);
    for (const b of this.buttons) b.sink += ((b.pressed ? 1 : 0) - b.sink) * Math.min(1, dt * 20);
    for (const l of this.levers) l.angle += ((l.on ? 1 : -1) - l.angle) * Math.min(1, dt * 14);
    this.timers.forEach((t, i) => {
      if (!t.pressed && t.left > 0) {
        // ticks: twice a second, four times a second in the last 1.5 s (S3)
        const beat = (v: number) => (v > 1.5 ? Math.ceil(v * 2) + 100 : Math.ceil(v * 4));
        const old = t.left;
        t.left = Math.max(0, t.left - dt);
        if (t.left > 0 && beat(t.left) !== beat(old)) events.push({ k: 'timer', i, what: 'tick', left: t.left });
      }
      const on = t.pressed || t.left > 0;
      if (t.on && !on) events.push({ k: 'timer', i, what: 'out', left: 0 });
      t.on = on;
      // the switch rises back up slowly as its time runs out
      const target = t.pressed ? 1 : on ? 0.25 + 0.75 * (t.left / (this.timerSecs(t) || 1)) : 0;
      t.sink += (target - t.sink) * Math.min(1, dt * 20);
    });
    this.stones.forEach((s, i) => {
      s.sink += ((this.stoneDown(i) ? 1 : s.on.size ? 0.4 : 0) - s.sink) * Math.min(1, dt * 16);
      s.flash = Math.max(0, s.flash - dt * 1.8);
    });
    this.platforms.forEach((pl, i) => {
      const d = pl.def;
      const dist = Math.hypot(d.to[0] - d.x, d.to[1] - d.y) || 1;
      const target = this.powered(d.rune) ? 1 : 0;
      const old = pl.p;
      const step = (PLATFORM_SPEED / dist) * dt;
      pl.p = target > pl.p ? Math.min(target, pl.p + step) : Math.max(target, pl.p - step);
      const moving = pl.p !== old;
      if (moving !== pl.moving) events.push({ k: 'platform', i, start: moving });
      pl.moving = moving;
      const before = { x: pl.rect.x0, y: pl.rect.y0 };
      this.placePlatform(pl);
      pl.dx = pl.rect.x0 - before.x;
      pl.dy = pl.rect.y0 - before.y;
    });
    this.gates.forEach((g, i) => {
      const target = this.powered(g.def.rune) ? 1 : 0;
      const old = g.open;
      // Clamp to the target, not to 0..1: a fully open gate must stay put, not twitch shut a little every step
      // (that twitch counted as "closing" and could crush someone jumping through an open trapdoor).
      const open = target > g.open ? Math.min(target, g.open + GATE_SPEED * dt) : Math.max(target, g.open - GATE_SPEED * dt);
      // A closing gate doesn't stop for anyone (10.2): standing in the gateway is deadly.
      if (open < old) closing({ x0: g.def.x, y0: g.def.y, x1: g.def.x + g.def.w, y1: g.def.y + g.def.h * (1 - open) }, i);
      const moving = open !== old;
      if (moving && !g.moving) events.push({ k: 'gate', i, opening: open > old });
      g.moving = moving;
      g.open = open;
      g.rect.y1 = g.def.y + g.def.h * (1 - open);
    });
  }

  private placePlatform(pl: PlatformState): void {
    const d = pl.def;
    const e = pl.p * pl.p * (3 - 2 * pl.p); // ease in and out (8.2)
    const x = d.x + (d.to[0] - d.x) * e;
    const y = d.y + (d.to[1] - d.y) * e;
    pl.rect.x0 = x;
    pl.rect.x1 = x + d.w;
    pl.rect.y0 = y;
    pl.rect.y1 = y + PLATFORM_THICK;
  }

  // ---- network: the host's word on the shared world ----

  state(): MechSync {
    const s: MechSync = { lv: this.levers.map((l) => (l.on ? 1 : 0)), pl: this.platforms.map((p) => Math.round(p.p * 1000) / 1000) };
    const v = this.vault;
    if (v) s.pw = { en: [...v.entered], ok: v.solved ? 1 : 0, rs: v.resets };
    if (this.tide) s.td = [this.tide.running ? 1 : 0, Math.round(this.tide.y * 1000) / 1000];
    if (this.timers.length) s.tm = this.timers.map((t) => Math.round(t.left * 100) / 100);
    if (this.crumbles.length) s.cr = this.crumbles.map((c) => (c.t < 0 ? -1 : Math.round(c.t * 100) / 100));
    return s;
  }

  /**
   * Guest: blend toward the host's state (levers and the password snap unless we just touched them ourselves).
   * The host's word on the password is final (13.1); changes it brings are reported as events so they are heard.
   */
  correct(s: MechSync, now: number, events: MechEvent[] = [], all: Box[] = []): void {
    // Crumbling stones: both phones run the same clock from the same step, so they normally agree already. The host
    // only fixes a block that is clearly out of step (a lost message): one the guest never saw shake, one that is
    // back on the host but not here, or clocks more than 0.3 s apart. A block the guest's own character just
    // stepped on is left alone for a moment, and a block never grows back inside a character.
    s.cr?.forEach((t, i) => {
      const c = this.crumbles[i];
      if (!c || now <= c.holdUntil) return;
      if (t < 0) {
        if (c.t >= CRUMBLE_SHAKE && !all.some((b) => b.right > c.x && b.left < c.x + 1 && b.y > c.y && b.top < c.y + 1)) this.restoreCrumble(i, events);
        else if (c.t >= 0 && c.t < CRUMBLE_SHAKE) c.t = -1;
      } else if (c.t < 0) {
        if (t > CRUMBLE_SHAKE + CRUMBLE_BACK - 0.5) return; // it just grew back here; the host's is about to
        this.shakeCrumble(i, events);
        c.t = t;
        if (t >= CRUMBLE_SHAKE) { c.rect.y1 = c.rect.y0; events.push({ k: 'crumble', i, what: 'fall', local: false }); }
      } else if (Math.abs(c.t - t) > 0.3 && (c.t >= CRUMBLE_SHAKE) === (t >= CRUMBLE_SHAKE)) c.t = t;
    });
    // The tide: both phones raise it at the same speed from the moment they see the first move, so they differ by
    // the network delay at most. The guest follows the host's surface (13.1) once they are clearly apart.
    if (this.tide && s.td) {
      if (s.td[0] === 1 && this.startTide(events)) this.tide.y = s.td[1];
      else if (s.td[0] === 1 && Math.abs(this.tide.y - s.td[1]) > 0.05) this.tide.y += (s.td[1] - this.tide.y) * 0.5;
    }
    // Timed switches: the host's clock is the one that counts (13.1). Each phone starts the clock when it sees the
    // step-off, so they differ by the network delay; the guest follows the host once they are more than 0.1 s apart.
    s.tm?.forEach((left, i) => {
      const t = this.timers[i];
      if (t && !t.pressed && Math.abs(t.left - left) > 0.1) t.left = left;
    });
    const v = this.vault, pw = s.pw;
    if (v && pw && now > v.holdUntil) {
      if (pw.rs > v.resets) {
        for (const st of this.stones) st.flash = 0.6;
        events.push({ k: 'stone', i: -1, ok: false, n: 0, local: false });
      } else if (pw.en.length > v.entered.length) {
        events.push({ k: 'stone', i: pw.en[pw.en.length - 1], ok: true, n: pw.en.length, local: false });
      }
      const wasSolved = v.solved;
      v.entered = [...pw.en];
      v.resets = pw.rs;
      v.solved = pw.ok === 1;
      if (v.solved && !wasSolved) events.push({ k: 'solved' });
    }
    s.lv?.forEach((v, i) => {
      const l = this.levers[i];
      if (l && now > l.holdUntil) l.on = v === 1;
    });
    s.pl?.forEach((v, i) => {
      const p = this.platforms[i];
      if (p && Math.abs(p.p - v) > 0.03) {
        p.p += (v - p.p) * 0.5;
        this.placePlatform(p);
      }
    });
  }

  setLever(i: number, on: boolean): boolean {
    const l = this.levers[i];
    if (!l || l.on === on) return false;
    l.on = on;
    return true;
  }
}
