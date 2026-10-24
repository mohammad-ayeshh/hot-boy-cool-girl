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
) & { seen?: Elem };

type ButtonDef = Extract<MechDef, { kind: 'button' }>;
type LeverDef = Extract<MechDef, { kind: 'lever' }>;
type PlatformDef = Extract<MechDef, { kind: 'platform' }>;
type GateDef = Extract<MechDef, { kind: 'gate' }>;
type StoneDef = Extract<MechDef, { kind: 'stone' }>;
type CarvingDef = Extract<MechDef, { kind: 'carving' }>;

export interface ButtonState { def: ButtonDef; pressed: boolean; sink: number }
export interface LeverState { def: LeverDef; on: boolean; angle: number; holdUntil: number }
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

/** What the host sends 5× a second (and right after a stone is stepped on) to keep the guest's world in sync. */
export interface MechSync { lv?: number[]; pl?: number[]; pw?: { en: number[]; ok: 0 | 1; rs: number } }

/** What a mechanism needs to know about a character. */
export interface Feet { left: number; right: number; y: number; vx: number; grounded: boolean }

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
  | { k: 'solved' };

export class Mechanisms {
  buttons: ButtonState[] = [];
  levers: LeverState[] = [];
  platforms: PlatformState[] = [];
  gates: GateState[] = [];
  stones: StoneState[] = [];
  carvings: CarvingState[] = [];
  /** The level's password, if it has one. */
  vault: VaultState | null = null;
  /** Solid rectangles for collision (platforms + closed part of gates); updated in place. */
  readonly solids: Rect[] = [];
  private readonly defs: MechDef[];
  private readonly pattern: Pattern | undefined;

  constructor(defs: MechDef[], pattern?: Pattern) {
    this.defs = defs;
    this.pattern = pattern;
    this.reset();
  }

  reset(): void {
    this.buttons = [];
    this.levers = [];
    this.platforms = [];
    this.gates = [];
    this.stones = [];
    this.carvings = [];
    this.vault = this.pattern ? { pattern: this.pattern, entered: [], solved: false, resets: 0, holdUntil: 0 } : null;
    this.solids.length = 0;
    for (const d of this.defs) {
      if (d.kind === 'button') this.buttons.push({ def: d, pressed: false, sink: 0 });
      else if (d.kind === 'lever') this.levers.push({ def: d, on: false, angle: -1, holdUntil: 0 });
      else if (d.kind === 'platform') {
        const rect = { x0: d.x, y0: d.y, x1: d.x + d.w, y1: d.y + PLATFORM_THICK };
        this.platforms.push({ def: d, p: 0, rect, dx: 0, dy: 0, moving: false });
        this.solids.push(rect);
      } else if (d.kind === 'stone') this.stones.push({ def: d, on: new Set(), sink: 0, flash: 0 });
      else if (d.kind === 'carving') this.carvings.push({ def: d, near: 0, lit: false });
      else {
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
  }

  /** Levers: flipped by walking into them (only characters simulated on this phone flip them). */
  updateLevers(local: Feet[], now: number, events: MechEvent[]): void {
    this.levers.forEach((l, i) => {
      const { x, y } = l.def;
      for (const f of local) {
        if (!f.grounded || Math.abs(f.y - (y + 1)) > 0.08 || f.right < x + 0.25 || f.left > x + 0.75 || Math.abs(f.vx) < 1) continue;
        const on = f.vx > 0; // pushed right = on
        if (on === l.on) continue;
        l.on = on;
        l.holdUntil = now + 700; // ignore older host corrections for a moment
        events.push({ k: 'lever', i, on, local: true });
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

  /** Is stone `i` sunk as part of what's entered so far? */
  stoneDown(i: number): boolean {
    return !!this.vault?.entered.includes(i);
  }

  /**
   * Move platforms and gates toward their powered / unpowered positions.
   * `closing(rect, i)` is told the solid part of every gate that is closing: whoever is under it gets crushed.
   */
  update(dt: number, closing: (r: Rect, i: number) => void, events: MechEvent[]): void {
    for (const b of this.buttons) b.sink += ((b.pressed ? 1 : 0) - b.sink) * Math.min(1, dt * 20);
    for (const l of this.levers) l.angle += ((l.on ? 1 : -1) - l.angle) * Math.min(1, dt * 14);
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
    return s;
  }

  /**
   * Guest: blend toward the host's state (levers and the password snap unless we just touched them ourselves).
   * The host's word on the password is final (13.1); changes it brings are reported as events so they are heard.
   */
  correct(s: MechSync, now: number, events: MechEvent[] = []): void {
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
